-- =============================
-- Script completo para Loja de Linguiças (PostgreSQL)
-- Estrutura estendida para um site/e-commerce online
-- =============================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para manter updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================
-- Entidades principais
-- =============================

-- Pessoas (dados pessoais básicos, pode estar ligado a usuário/cliente/funcionário)
CREATE TABLE IF NOT EXISTS pessoa (
  cpf VARCHAR(14) PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE,
  telefone VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários do sistema (login) — para clientes e administradores
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) REFERENCES pessoa(cpf),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome_exibicao VARCHAR(150),
  papel VARCHAR(50) DEFAULT 'customer', -- ex: customer, admin
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER usuario_set_timestamp
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Endereços (vários endereços por cliente)
CREATE TABLE IF NOT EXISTS endereco (
  id_endereco SERIAL PRIMARY KEY,
  cpf VARCHAR(14) REFERENCES pessoa(cpf),
  apelido VARCHAR(50),
  logradouro VARCHAR(200),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(100),
  cep VARCHAR(20),
  tipo_endereco VARCHAR(30), -- ex: entrega, cobrança
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER endereco_set_timestamp
BEFORE UPDATE ON endereco
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS categoria_produto (
  id_categoria SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  slug VARCHAR(150) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER categoria_produto_set_timestamp
BEFORE UPDATE ON categoria_produto
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Produtos
CREATE TABLE IF NOT EXISTS produto (
  id_produto SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE,
  nome_produto VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  descricao TEXT,
  peso_kg NUMERIC(8,3),
  largura_cm NUMERIC(8,2),
  altura_cm NUMERIC(8,2),
  profundidade_cm NUMERIC(8,2),
  preco_base NUMERIC(12,2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  id_categoria INT REFERENCES categoria_produto(id_categoria),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER produto_set_timestamp
BEFORE UPDATE ON produto
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Imagens dos produtos
CREATE TABLE IF NOT EXISTS produto_imagem (
  id_imagem SERIAL PRIMARY KEY,
  id_produto INT REFERENCES produto(id_produto) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  ordem INT DEFAULT 0
);

-- Variantes (tamanhos, sabores, embalagens)
CREATE TABLE IF NOT EXISTS produto_variante (
  id_variante SERIAL PRIMARY KEY,
  id_produto INT REFERENCES produto(id_produto) ON DELETE CASCADE,
  nome_variante VARCHAR(150),
  sku VARCHAR(100) UNIQUE,
  preco NUMERIC(12,2),
  estoque INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE
);

-- Histórico de inventário (movimentações)
CREATE TABLE IF NOT EXISTS inventario_movimentacao (
  id_movimentacao SERIAL PRIMARY KEY,
  id_produto INT REFERENCES produto(id_produto),
  id_variante INT REFERENCES produto_variante(id_variante),
  tipo_movimentacao VARCHAR(30), -- entrada, saida, ajuste
  quantidade INT NOT NULL,
  origem VARCHAR(100), -- ex: compra fornecedor, venda, ajuste manual
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carrinho de compras temporário
CREATE TABLE IF NOT EXISTS carrinho (
  id_carrinho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES usuario(id_usuario),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER carrinho_set_timestamp
BEFORE UPDATE ON carrinho
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS carrinho_item (
  id_item SERIAL PRIMARY KEY,
  id_carrinho UUID REFERENCES carrinho(id_carrinho) ON DELETE CASCADE,
  id_produto INT REFERENCES produto(id_produto),
  id_variante INT REFERENCES produto_variante(id_variante),
  quantidade INT NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Cupons / descontos
CREATE TABLE IF NOT EXISTS cupom (
  id_cupom SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT,
  tipo_desconto VARCHAR(20), -- percentual, fixo
  valor NUMERIC(12,2),
  data_inicio DATE,
  data_fim DATE,
  limite_uso INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos e itens (fluxo de venda)
CREATE TYPE pedido_status AS ENUM ('pendente','confirmado','processando','enviado','entregue','cancelado','devolvido');

CREATE TABLE IF NOT EXISTS pedido (
  id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES usuario(id_usuario),
  id_cliente SERIAL, -- opcional se desejar entidade cliente separada
  data_pedido TIMESTAMPTZ DEFAULT NOW(),
  status pedido_status DEFAULT 'pendente',
  subtotal NUMERIC(12,2) DEFAULT 0,
  frete NUMERIC(12,2) DEFAULT 0,
  desconto NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  id_endereco_entrega INT REFERENCES endereco(id_endereco),
  id_endereco_cobranca INT REFERENCES endereco(id_endereco),
  codigo_rastreamento VARCHAR(200),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER pedido_set_timestamp
BEFORE UPDATE ON pedido
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS pedido_item (
  id_item SERIAL PRIMARY KEY,
  id_pedido UUID REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_produto INT REFERENCES produto(id_produto),
  id_variante INT REFERENCES produto_variante(id_variante),
  quantidade INT NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL
);

-- Formas de pagamento
CREATE TABLE IF NOT EXISTS forma_pagamento (
  id_forma_pagamento SERIAL PRIMARY KEY,
  nome_forma_pagamento VARCHAR(100) NOT NULL,
  descricao TEXT
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS pagamento (
  id_pagamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido UUID REFERENCES pedido(id_pedido),
  id_forma_pagamento INT REFERENCES forma_pagamento(id_forma_pagamento),
  valor NUMERIC(12,2) NOT NULL,
  status_pagamento VARCHAR(50), -- ex: autorizado, capturado, cancelado
  transacao_id VARCHAR(255),
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Envio / remessa
CREATE TABLE IF NOT EXISTS remessa (
  id_remessa SERIAL PRIMARY KEY,
  id_pedido UUID REFERENCES pedido(id_pedido) UNIQUE,
  transportadora VARCHAR(150),
  tipo_servico VARCHAR(100),
  codigo_rastreamento VARCHAR(200),
  custo NUMERIC(12,2),
  enviado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ
);

-- Avaliações e comentários
CREATE TABLE IF NOT EXISTS avaliacao_produto (
  id_avaliacao SERIAL PRIMARY KEY,
  id_produto INT REFERENCES produto(id_produto),
  id_usuario UUID REFERENCES usuario(id_usuario),
  nota INT CHECK (nota BETWEEN 1 AND 5),
  titulo VARCHAR(200),
  comentario TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Logs simples de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id_log SERIAL PRIMARY KEY,
  tabela VARCHAR(100),
  operacao VARCHAR(20),
  registro_id TEXT,
  dados JSONB,
  realizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================
-- Índices e dados de exemplo
-- =============================

CREATE INDEX IF NOT EXISTS idx_produto_slug ON produto(slug);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_pedido_status ON pedido(status);

-- Dados de exemplo básicos
-- Categorias
INSERT INTO categoria_produto (nome, descricao, slug) VALUES
  ('Linguiças', 'Variedade de linguiças artesanais', 'linguicas')
ON CONFLICT (slug) DO NOTHING;

-- Produtos
INSERT INTO produto (sku, nome_produto, slug, descricao, preco_base, id_categoria) VALUES
  ('TOsc-001', 'Linguiça Toscana', 'linguica-toscana', 'Linguiça toscana tradicional', 29.90, 1)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO produto_variante (id_produto, nome_variante, sku, preco, estoque) VALUES
  ((SELECT id_produto FROM produto WHERE sku='TOsc-001'), '500g', 'TOsc-001-500g', 29.90, 50)
ON CONFLICT DO NOTHING;

-- Formas de pagamento
INSERT INTO forma_pagamento (nome_forma_pagamento, descricao) VALUES
  ('Dinheiro', 'Pagamento em espécie'),
  ('Cartão de Crédito', 'Pagamento com cartão'),
  ('Pix', 'Pagamento via Pix')
ON CONFLICT DO NOTHING;

-- Usuário de exemplo (senha hashed deve ser gerada pela aplicação)
INSERT INTO pessoa (cpf, nome, data_nascimento, telefone) VALUES
  ('11111111111', 'João Silva', '1980-01-01', '11999990000')
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO usuario (cpf, email, senha_hash, nome_exibicao, papel) VALUES
  ('11111111111', 'joao@example.com', 'HASH_PLACEHOLDER', 'João Silva', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Trigger para atualizar updated_at em tabelas que utilizam updated_at
-- (já criado trigger function no topo; adicionamos triggers conforme necessidade)

