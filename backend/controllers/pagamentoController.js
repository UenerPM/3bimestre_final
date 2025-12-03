// Controller para a tabela Pagamento conforme documentacao/avap2.sql
const path = require('path');
const db = require('../database');
const helper = require('../utils/controllerHelper');

// Lista todos os pagamentos
exports.listarPagamentos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Pagamento');
    return helper.respondList(res, result.rows);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

// Obtém pagamento pela chave PedidoIdPedido
exports.obterPagamentoPorPedido = async (req, res) => {
  try {
    const idpedido = Number(req.params.idpedido ?? req.params.id);
    if (!Number.isInteger(idpedido)) return helper.respondBadRequest(res, 'idpedido inválido');
    const result = await db.query('SELECT * FROM Pagamento WHERE PedidoIdPedido = $1', [idpedido]);
  if (result.rows.length === 0) return helper.respondNotFound(res, 'Pagamento não encontrado');
  return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

// Cria ou atualiza pagamento (INSERT ou UPDATE) - aqui tratamos criação simples
exports.criarPagamento = async (req, res) => {
  try {
    const idpedido = Number(req.body.idpedido ?? req.body.PedidoIdPedido ?? req.body.pedidoId);
    const valorTotalPagamento = helper.parseNumber(req.body.valorTotalPagamento ?? req.body.valor ?? req.body.total);
    const formaPagamentoId = req.body.forma_pagamento_id ?? req.body.formaPagamento ?? req.body.forma ?? null;
    const formaPagamentoIdNum = formaPagamentoId != null ? Number(formaPagamentoId) : null;
    if (!Number.isInteger(idpedido)) return helper.respondBadRequest(res, 'idpedido inválido');
    if (valorTotalPagamento === null || valorTotalPagamento < 0) return helper.respondBadRequest(res, 'valorTotalPagamento inválido');

    try {
  const result = await db.query(
    'INSERT INTO Pagamento (PedidoIdPedido, valorTotalPagamento, forma_pagamento_id) VALUES ($1, $2, $3) RETURNING *',
    [idpedido, valorTotalPagamento, formaPagamentoIdNum]
  );
  return helper.respondCreated(res, result.rows[0]);
    } catch (error) {
  if (error && error.code === '23503') return helper.respondBadRequest(res, 'Pedido não encontrado (violação de FK)');
  if (error && error.code === '23505') return helper.respondBadRequest(res, 'Pagamento para esse pedido já existe');
      throw error;
    }
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

// Atualiza pagamento por PedidoIdPedido
exports.atualizarPagamento = async (req, res) => {
  try {
    const idpedido = Number(req.params.idpedido ?? req.params.id);
    console.log('atualizarPagamento - idpedido param:', req.params, 'parsed:', idpedido, 'body:', req.body);
    const valorTotalPagamento = helper.parseNumber(req.body.valorTotalPagamento ?? req.body.valor ?? req.body.total);
    const formaPagamentoId = req.body.forma_pagamento_id ?? req.body.formaPagamento ?? req.body.forma ?? null;
    const formaPagamentoIdNum = formaPagamentoId != null ? Number(formaPagamentoId) : null;
    if (!Number.isInteger(idpedido)) return helper.respondBadRequest(res, 'idpedido inválido');
    if (valorTotalPagamento === null || valorTotalPagamento < 0) return helper.respondBadRequest(res, 'valorTotalPagamento inválido');

    const result = await db.query(
      'UPDATE Pagamento SET valorTotalPagamento = $1, forma_pagamento_id = $2 WHERE PedidoIdPedido = $3 RETURNING *',
      [valorTotalPagamento, formaPagamentoIdNum, idpedido]
    );
  if (result.rows.length === 0) return helper.respondNotFound(res, 'Pagamento não encontrado');
  return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

// Deleta pagamento por PedidoIdPedido
exports.deletarPagamento = async (req, res) => {
  try {
    const idpedido = Number(req.params.idpedido ?? req.params.id);
    if (!Number.isInteger(idpedido)) return helper.respondBadRequest(res, 'idpedido inválido');
    const result = await db.query('DELETE FROM Pagamento WHERE PedidoIdPedido = $1 RETURNING *', [idpedido]);
  if (result.rows.length === 0) return helper.respondNotFound(res, 'Pagamento não encontrado');
  return helper.respondNoContent(res);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.abrirCrudPagamento = (req, res) => {
  const caminhoArquivo = path.join(__dirname, '../../frontend/pagamento/pagamento.html');
  res.sendFile(caminhoArquivo);
};