-- ==============================================
-- LIMPEZA DO BANCO (CASCADE para apagar dependências)
-- ==============================================
DROP TABLE IF EXISTS PagamentoHasFormaPagamento CASCADE;
DROP TABLE IF EXISTS Pagamento CASCADE;
DROP TABLE IF EXISTS PedidoHasProduto CASCADE;
DROP TABLE IF EXISTS Pedido CASCADE;
DROP TABLE IF EXISTS Produto CASCADE;
DROP TABLE IF EXISTS Cliente CASCADE;
DROP TABLE IF EXISTS Funcionario CASCADE;
DROP TABLE IF EXISTS Cargo CASCADE;
DROP TABLE IF EXISTS Pessoa CASCADE;
DROP TABLE IF EXISTS Cidade CASCADE;
DROP TABLE IF EXISTS FormaDePagamento CASCADE;

-- ==============================================
-- CRIAÇÃO DAS TABELAS
-- ==============================================

CREATE TABLE Pessoa (
    cpfPessoa VARCHAR(20) PRIMARY KEY,
    nomePessoa VARCHAR(60) NOT NULL,
    dataNascimentoPessoa DATE,
    numero VARCHAR(15),
    cep VARCHAR(15),
    email VARCHAR(255),
    senha_pessoa VARCHAR(255) NOT NULL,
    data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cargo (
    idCargo SERIAL PRIMARY KEY,
    nomeCargo VARCHAR(45) NOT NULL
);

CREATE TABLE Cliente (
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES Pessoa(cpfPessoa) ON DELETE CASCADE,
    rendaCliente NUMERIC(12,2),
    dataDeCadastroCliente DATE
);

CREATE TABLE Funcionario (
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES Pessoa(cpfPessoa) ON DELETE CASCADE,
    salario NUMERIC(12,2),
    CargosIdCargo INT NOT NULL REFERENCES Cargo(idCargo),
    porcentagemComissao NUMERIC(5,2)
);

CREATE TABLE Produto (
    idProduto SERIAL PRIMARY KEY,
    nomeProduto VARCHAR(45) NOT NULL,
    quantidadeEmEstoque INT DEFAULT 0,
    precoUnitario NUMERIC(12,2) NOT NULL
);

CREATE TABLE Pedido (
    idPedido SERIAL PRIMARY KEY,
    dataDoPedido DATE NOT NULL,
    ClientePessoaCpfPessoa VARCHAR(20) NOT NULL REFERENCES Cliente(PessoaCpfPessoa),
    FuncionarioPessoaCpfPessoa VARCHAR(20) NOT NULL REFERENCES Funcionario(PessoaCpfPessoa)
);

CREATE TABLE PedidoHasProduto (
    ProdutoIdProduto INT NOT NULL REFERENCES Produto(idProduto),
    PedidoIdPedido INT NOT NULL REFERENCES Pedido(idPedido),
    quantidade INT NOT NULL,
    precoUnitario NUMERIC(12,2),
    PRIMARY KEY (ProdutoIdProduto, PedidoIdPedido)
);

CREATE TABLE Pagamento (
    PedidoIdPedido INT PRIMARY KEY REFERENCES Pedido(idPedido) ON DELETE CASCADE,
    dataPagamento TIMESTAMP DEFAULT now(),
    valorTotalPagamento NUMERIC(12,2)
);

CREATE TABLE FormaDePagamento (
    idFormaPagamento SERIAL PRIMARY KEY,
    nomeFormaPagamento VARCHAR(100) NOT NULL
);

CREATE TABLE PagamentoHasFormaPagamento (
    PagamentoIdPedido INT NOT NULL REFERENCES Pagamento(PedidoIdPedido) ON DELETE CASCADE,
    FormaPagamentoIdFormaPagamento INT NOT NULL REFERENCES FormaDePagamento(idFormaPagamento),
    valorPago NUMERIC(12,2),
    PRIMARY KEY (PagamentoIdPedido, FormaPagamentoIdFormaPagamento)
);

-- ==============================================
-- INSERINDO DADOS NA TABELA PESSOA
-- ==============================================
INSERT INTO Pessoa (cpfPessoa, nomePessoa, dataNascimentoPessoa, numero, cep, email, senha_pessoa)
VALUES
('11111111111', 'João Silva', '1990-05-14', '123', '87000000', 'joao.silva@email.com', 'senha123'),
('22222222222', 'Maria Oliveira', '1985-09-22', '456', '87010000', 'maria.oliveira@email.com', 'senha456'),
('33333333333', 'Carlos Souza', '1992-01-10', '789', '87020000', 'carlos.souza@email.com', 'senha789'),
('44444444444', 'Ana Lima', '1998-11-02', '321', '87030000', 'ana.lima@email.com', 'senha321'),
('55555555555', 'Lucas Pereira', '2000-03-17', '654', '87040000', 'lucas.pereira@email.com', 'senha654');

-- ==============================================
-- INSERINDO DADOS NA TABELA CARGO
-- ==============================================
INSERT INTO Cargo (nomeCargo)
VALUES
('Atendente'),
('Caixa'),
('Gerente');

-- ==============================================
-- INSERINDO DADOS NA TABELA FUNCIONARIO
-- ==============================================
INSERT INTO Funcionario (PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao)
VALUES
('11111111111', 2500.00, 1, 2.5),
('22222222222', 3000.00, 2, 3.0),
('33333333333', 5000.00, 3, 5.0);

-- ==============================================
-- INSERINDO DADOS NA TABELA CLIENTE
-- ==============================================
INSERT INTO Cliente (PessoaCpfPessoa, rendaCliente, dataDeCadastroCliente)
VALUES
('44444444444', 4000.00, '2024-02-15'),
('55555555555', 2500.00, '2024-03-20');

-- ==============================================
-- INSERINDO DADOS NA TABELA PRODUTO
-- ==============================================
INSERT INTO Produto (nomeProduto, quantidadeEmEstoque, precoUnitario)
VALUES
('Linguiça Toscana', 100, 25.90),
('Linguiça Calabresa', 80, 27.50),
('Linguiça Caseira', 60, 29.90),
('Linguiça Apimentada', 50, 30.00);

-- ==============================================
-- INSERINDO DADOS NA TABELA PEDIDO
-- ==============================================
INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa)
VALUES
('2025-10-01', '44444444444', '11111111111'),
('2025-10-02', '55555555555', '22222222222');

-- ==============================================
-- INSERINDO DADOS NA TABELA PEDIDOHASPRODUTO
-- ==============================================
INSERT INTO PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario)
VALUES
(1, 1, 2, 25.90),
(3, 1, 1, 29.90),
(2, 2, 3, 27.50),
(4, 2, 2, 30.00);

-- ==============================================
-- INSERINDO DADOS NA TABELA PAGAMENTO
-- ==============================================
INSERT INTO Pagamento (PedidoIdPedido, valorTotalPagamento)
VALUES
(1, 81.70),  -- 2×25.90 + 1×29.90
(2, 142.50); -- 3×27.50 + 2×30.00

-- ==============================================
-- INSERINDO DADOS NA TABELA FORMADEPAGAMENTO
-- ==============================================
INSERT INTO FormaDePagamento (nomeFormaPagamento)
VALUES
('Dinheiro'),
('Cartão de Crédito'),
('PIX'),
('Cartão de Débito');

-- ==============================================
-- INSERINDO DADOS NA TABELA PAGAMENTOHASFORMAPAGAMENTO
-- ==============================================
INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago)
VALUES
(1, 3, 81.70),   -- Pedido 1 pago via PIX
(2, 2, 100.00),  -- Pedido 2 pago parcialmente com cartão
(2, 1, 42.50);   -- Pedido 2 pago com dinheiro (restante)
