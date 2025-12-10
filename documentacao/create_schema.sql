-- Script de criação do schema do banco de dados AVAP (PostgreSQL)
-- Execute com: psql -U <usuario> -d <database> -f create_schema.sql

BEGIN;

-- Tabela Pessoa
CREATE TABLE IF NOT EXISTS pessoa (
  cpfpessoa VARCHAR PRIMARY KEY,
  nomepessoa VARCHAR NOT NULL,
  datanascimentopessoa DATE,
  numero VARCHAR,
  cep VARCHAR,
  email VARCHAR,
  senha_pessoa VARCHAR NOT NULL,
  data_acesso TIMESTAMP
);

-- Tabela Cargo
CREATE TABLE IF NOT EXISTS cargo (
  idcargo SERIAL PRIMARY KEY,
  nomecargo VARCHAR NOT NULL
);

-- Tabela Funcionario (soft-delete via coluna ativo)
CREATE TABLE IF NOT EXISTS funcionario (
  pessoacpfpessoa VARCHAR PRIMARY KEY REFERENCES pessoa(cpfpessoa) ON DELETE RESTRICT,
  salario NUMERIC,
  cargosidcargo INTEGER NOT NULL REFERENCES cargo(idcargo),
  porcentagemcomissao NUMERIC,
  ativo BOOLEAN DEFAULT true
);

-- Tabela Cliente
CREATE TABLE IF NOT EXISTS cliente (
  pessoacpfpessoa VARCHAR PRIMARY KEY REFERENCES pessoa(cpfpessoa) ON DELETE RESTRICT,
  rendacliente NUMERIC,
  datadecadastrocliente DATE
);

-- Tabela Imagem
CREATE TABLE IF NOT EXISTS imagem (
  id SERIAL PRIMARY KEY,
  caminho VARCHAR NOT NULL
);

-- Tabela Produto
CREATE TABLE IF NOT EXISTS produto (
  idproduto SERIAL PRIMARY KEY,
  nomeproduto VARCHAR NOT NULL,
  quantidadeemestoque INTEGER,
  precounitario NUMERIC NOT NULL,
  id_imagem INTEGER REFERENCES imagem(id)
);

-- Tabela Pedido
CREATE TABLE IF NOT EXISTS pedido (
  idpedido SERIAL PRIMARY KEY,
  datadopedido DATE NOT NULL,
  clientepessoacpfpessoa VARCHAR NOT NULL REFERENCES pessoa(cpfpessoa) ON DELETE RESTRICT,
  funcionariopessoacpfpessoa VARCHAR NOT NULL REFERENCES funcionario(pessoacpfpessoa) ON DELETE RESTRICT
);

-- Tabela PedidoHasProduto (junction)
CREATE TABLE IF NOT EXISTS pedidohasproduto (
  produtoidproduto INTEGER NOT NULL REFERENCES produto(idproduto) ON DELETE RESTRICT,
  pedidoidpedido INTEGER NOT NULL REFERENCES pedido(idpedido) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL,
  precounitario NUMERIC,
  PRIMARY KEY (produtoidproduto, pedidoidpedido)
);

-- Tabela Forma de Pagamento
CREATE TABLE IF NOT EXISTS formadepagamento (
  idformapagamento SERIAL PRIMARY KEY,
  nomeformapagamento VARCHAR NOT NULL
);

-- Tabela Pagamento
CREATE TABLE IF NOT EXISTS pagamento (
  idpagamento SERIAL PRIMARY KEY,
  pedidoidpedido INTEGER NOT NULL REFERENCES pedido(idpedido) ON DELETE CASCADE,
  datapagamento TIMESTAMP,
  valortotalpagamento NUMERIC,
  forma_pagamento_id INTEGER REFERENCES formadepagamento(idformapagamento)
);

COMMIT;

-- Indexes úteis
CREATE INDEX IF NOT EXISTS idx_pedido_datadopedido ON pedido(datadopedido);
CREATE INDEX IF NOT EXISTS idx_pagamento_pedido ON pagamento(pedidoidpedido);
CREATE INDEX IF NOT EXISTS idx_php_pedido ON pedidohasproduto(pedidoidpedido);
