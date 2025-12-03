// Controller para a tabela pedido
const path = require('path');
const db = require('../database');
const helper = require('../utils/controllerHelper');

exports.listarPedidos = async (req, res) => {
  try {
  const result = await db.query('SELECT * FROM Pedido');
  return helper.respondList(res, result.rows);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.criarPedido = async (req, res) => {
  try {
    const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;

    // validações básicas: aceitar data em ISO ou yyyy-MM-dd
    if (!dataDoPedido) return helper.respondBadRequest(res, 'dataDoPedido é obrigatória');
    const d = new Date(dataDoPedido);
    if (isNaN(d.getTime())) return helper.respondBadRequest(res, 'dataDoPedido em formato inválido');
    if (!ClientePessoaCpfPessoa) return helper.respondBadRequest(res, 'ClientePessoaCpfPessoa é obrigatório');
    if (!FuncionarioPessoaCpfPessoa) return helper.respondBadRequest(res, 'FuncionarioPessoaCpfPessoa é obrigatório');

    const result = await db.query(
      'INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES ($1, $2, $3) RETURNING *',
      [d.toISOString(), ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa]
    );
    return helper.respondCreated(res, result.rows[0]);
  } catch (error) {
    if (error && error.code === '23503') return helper.respondBadRequest(res, 'Cliente ou Funcionário não encontrado (violação de chave estrangeira)');
    return helper.respondServerError(res, error);
  }
};

exports.atualizarPedido = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return helper.respondBadRequest(res, 'ID inválido');

    const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;
    if (!dataDoPedido) return helper.respondBadRequest(res, 'dataDoPedido é obrigatória');
    const d = new Date(dataDoPedido);
    if (isNaN(d.getTime())) return helper.respondBadRequest(res, 'dataDoPedido em formato inválido');
    if (!ClientePessoaCpfPessoa) return helper.respondBadRequest(res, 'ClientePessoaCpfPessoa é obrigatório');
    if (!FuncionarioPessoaCpfPessoa) return helper.respondBadRequest(res, 'FuncionarioPessoaCpfPessoa é obrigatório');

    const result = await db.query('UPDATE Pedido SET dataDoPedido = $1, ClientePessoaCpfPessoa = $2, FuncionarioPessoaCpfPessoa = $3 WHERE idPedido = $4 RETURNING *', [d.toISOString(), ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa, id]);
  if (result.rows.length === 0) return helper.respondNotFound(res, 'Pedido não encontrado');
  return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    if (error && error.code === '23503') return helper.respondBadRequest(res, 'Cliente ou Funcionário não encontrado (violação de chave estrangeira)');
    return helper.respondServerError(res, error);
  }
};

exports.deletarPedido = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return helper.respondBadRequest(res, 'ID inválido');
    const result = await db.query('DELETE FROM Pedido WHERE idPedido = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return helper.respondNotFound(res, 'Pedido não encontrado');
    return helper.respondNoContent(res);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.abrirCrudPedido = (req, res) => {
  const caminhoArquivo = path.join(__dirname, '../../frontend/pedido/pedido.html');
  res.sendFile(caminhoArquivo);
};