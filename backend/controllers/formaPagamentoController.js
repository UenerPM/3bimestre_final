const { query } = require('../database');
const path = require('path');

exports.abrirCrudFormaPagamento = (req, res) => {
	res.sendFile(path.join(__dirname, '../../frontend/formaPagamento/formaPagamento.html'));
}

exports.listarFormas = async (req, res) => {
	try {
		const sql = `SELECT idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento FROM formadepagamento ORDER BY idformapagamento`;
		console.log('listarFormas - SQL:', sql);
		const result = await query(sql);
	const helper = require('../utils/controllerHelper');
	return helper.respondList(res, result.rows);
	} catch (err) {
		console.error('Erro listarFormas:', err);
	const helper = require('../utils/controllerHelper');
	return helper.respondServerError(res, err);
	}
}

exports.obterForma = async (req, res) => {
	try {
		const idForma = parseInt(req.params.id);
		if (isNaN(idForma)) {
			const helper = require('../utils/controllerHelper');
			return helper.respondBadRequest(res, 'ID inválido');
		}
		const sql = `SELECT idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento FROM formadepagamento WHERE idformapagamento = $1`;
		const result = await query(sql, [idForma]);
	const helper = require('../utils/controllerHelper');
	if (result.rows.length === 0) return helper.respondNotFound(res, 'Forma de pagamento não encontrada');
	return helper.respondJson(res, result.rows[0]);
	} catch (err) {
		console.error('Erro obterForma:', err);
	const helper = require('../utils/controllerHelper');
	return helper.respondServerError(res, err);
	}
}

exports.criarForma = async (req, res) => {
    try {
	const { nomeformapagamento: nomeFormaPagamento } = req.body;
	if (!nomeFormaPagamento) {
		const helper = require('../utils/controllerHelper');
		return helper.respondBadRequest(res, 'Nome é obrigatório');
	}
		const result = await query('INSERT INTO formadepagamento (nomeformapagamento) VALUES ($1) RETURNING idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento', [nomeFormaPagamento]);
		const helper = require('../utils/controllerHelper');
		return helper.respondCreated(res, result.rows[0]);
	} catch (err) {
		console.error('Erro criarForma:', err);
	const helper = require('../utils/controllerHelper');
	return helper.respondServerError(res, err);
    }
}

exports.atualizarForma = async (req, res) => {
	try {
	const id = parseInt(req.params.id);
	const { nomeformapagamento: nomeFormaPagamento } = req.body;
	if (isNaN(id)) {
		const helper = require('../utils/controllerHelper');
		return helper.respondBadRequest(res, 'ID inválido');
	}
	const existing = await query('SELECT idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento FROM formadepagamento WHERE idformapagamento = $1', [id]);
	if (existing.rows.length === 0) {
		const helper = require('../utils/controllerHelper');
		return helper.respondNotFound(res, 'Forma não encontrada');
	}
		const updated = await query('UPDATE formadepagamento SET nomeformapagamento = $1 WHERE idformapagamento = $2 RETURNING idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento', [nomeFormaPagamento || existing.rows[0].nomeformapagamento, id]);
		const helper = require('../utils/controllerHelper');
		return helper.respondJson(res, updated.rows[0]);
	} catch (err) {
		console.error('Erro atualizarForma:', err);
	const helper = require('../utils/controllerHelper');
	return helper.respondServerError(res, err);
	}
}

exports.deletarForma = async (req, res) => {
	try {
	const idForma = parseInt(req.params.id);
	const existing = await query('SELECT idformapagamento as idformadepagamento FROM formadepagamento WHERE idformapagamento = $1', [idForma]);
	if (existing.rows.length === 0) {
		const helper = require('../utils/controllerHelper');
		return helper.respondNotFound(res, 'Forma não encontrada');
	}
		await query('DELETE FROM formadepagamento WHERE idformapagamento = $1', [idForma]);
		const helper = require('../utils/controllerHelper');
		return helper.respondNoContent(res);
	} catch (err) {
		console.error('Erro deletarForma:', err && err.stack ? err.stack : err);
		// Violação de FK: registros dependentes existem
		if (err.code === '23503') {
			const helper = require('../utils/controllerHelper');
			return helper.respondBadRequest(res, 'Não é possível excluir: forma de pagamento está sendo usada em pagamentos');
		}
		const helper = require('../utils/controllerHelper');
		return helper.respondServerError(res, err);
	}
}