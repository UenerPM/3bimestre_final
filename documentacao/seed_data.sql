-- Script de população de dados de exemplo para AVAP
-- Execute com: psql -U <usuario> -d <database> -f seed_data.sql

BEGIN;

-- Cargos
INSERT INTO cargo (nomecargo) VALUES
  ('Vendedor'),
  ('Gerente')
ON CONFLICT DO NOTHING;

-- Pessoas
INSERT INTO pessoa (cpfpessoa, nomepessoa, datanascimentopessoa, numero, cep, email, senha_pessoa, data_acesso) VALUES
  ('11111111111','João Silva','1990-05-14','123','87000000','joao.silva@email.com','senha123', now()),
  ('16646655952','Pablo Henrique de Oliveira Detoni','2008-05-15','1643','87302320','pablodetoni10@gmail.com','123', now()),
  ('22222222222','Maria Oliveira','1985-09-22','456','87010000','maria.oliveira@email.com','senha456', now()),
  ('33333333333','Carlos Souza','1992-01-10','789','87020000','carlos.souza@email.com','senha789', now()),
  ('41111111111','Oksane','2024-02-04','175','87308330','oksane@gmail.com','123', now()),
  ('41649321805','Uener Peres Marcon','2009-03-07','175','87308330','uperesmarcon@gmail.com','uener2009', now()),
  ('44444444444','Ana Lima','1998-11-02','321','87030000','ana.lima@email.com','senha321', now()),
  ('55555555555','Lucas Pereira','2000-03-17','654','87040000','lucas.pereira@email.com','senha654', now()),
  ('99999999999','Teste Integrado','2000-01-01','123','12345678','teste@mail.com','123456', now())
ON CONFLICT DO NOTHING;

-- Funcionários (assumindo cargos já inseridos: idcargo 1 e 2)
INSERT INTO funcionario (pessoacpfpessoa, salario, cargosidcargo, porcentagemcomissao, ativo) VALUES
  ('11111111111', 3000.00, 1, 5.00, true),
  ('22222222222', 3500.00, 1, 6.00, true),
  ('33333333333', 4000.00, 2, 8.00, true),
  ('41649321805', 2500.00, 1, 4.00, true)
ON CONFLICT DO NOTHING;

-- Clientes
INSERT INTO cliente (pessoacpfpessoa, rendacliente, datadecadastrocliente) VALUES
  ('16646655952', 1500.00, '2025-10-09'),
  ('41111111111', 100.00, '2025-12-04'),
  ('44444444444', 2000.00, '2025-10-07'),
  ('55555555555', 1800.00, '2025-10-07'),
  ('99999999999', 500.00, '2025-10-24')
ON CONFLICT DO NOTHING;

-- Imagens
INSERT INTO imagem (caminho) VALUES
  ('/img/prod1.jpg'),
  ('/img/prod2.jpg')
ON CONFLICT DO NOTHING;

-- Produtos
INSERT INTO produto (nomeproduto, quantidadeemestoque, precounitario, id_imagem) VALUES
  ('Doce de Leite', 100, 5.50, 1),
  ('Bala Sortida', 200, 1.20, 2),
  ('Chocolate Meio Amargo', 50, 10.00, NULL)
ON CONFLICT DO NOTHING;

-- Formas de Pagamento
INSERT INTO formadepagamento (nomeformapagamento) VALUES
  ('Dinheiro'),
  ('Cartão de Crédito'),
  ('PIX')
ON CONFLICT DO NOTHING;

-- Pedidos (criar alguns pedidos em datas úteis para testar filtros)
INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) VALUES
  ('2025-12-03', '16646655952', '11111111111'),
  ('2025-12-04', '41111111111', '41649321805'),
  ('2025-12-05', '99999999999', '11111111111'),
  ('2025-11-20', '44444444444', '33333333333')
RETURNING idpedido;

-- Vincular produtos aos pedidos (pedidohasproduto)
-- Para simplicidade, vamos assumir ids de produto 1,2,3 e que os pedidos retornaram ids 1..4
INSERT INTO pedidohasproduto (produtoidproduto, pedidoidpedido, quantidade, precounitario) VALUES
  (1, 1, 3, 5.50),
  (2, 1, 10, 1.20),
  (2, 2, 5, 1.20),
  (3, 3, 2, 10.00),
  (1, 4, 1, 5.50)
ON CONFLICT DO NOTHING;

-- Pagamentos
INSERT INTO pagamento (pedidoidpedido, datapagamento, valortotalpagamento, forma_pagamento_id) VALUES
  (1, '2025-12-03 10:00:00',  (3 * 5.50 + 10 * 1.20)::NUMERIC, 1),
  (2, '2025-12-04 15:30:00',  (5 * 1.20)::NUMERIC, 2),
  (3, '2025-12-05 18:00:00',  (2 * 10.00)::NUMERIC, 3),
  (4, '2025-11-20 12:00:00',  (1 * 5.50)::NUMERIC, 2)
ON CONFLICT DO NOTHING;

COMMIT;
