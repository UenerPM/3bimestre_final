const { query } = require('../database');
const { respondJson, respondList, respondCreated, respondBadRequest, respondNotFound, respondServerError } = require('../utils/controllerHelper');

// Listar todos os registros de pagamentoHasFormaPagamento
exports.listar = async (req, res) => {
	try {
		const sql = `
			SELECT 
				pagamentoidpedido as idpagamento,
				formapagamentoidformapagamento as idformapagamento,
				valorpago as valor
			FROM pagamentohasformapagamento
			ORDER BY pagamentoidpedido, formapagamentoidformapagamento
		`;
		console.log('listar - SQL:', sql);
		const result = await query(sql);
		return respondList(res, result.rows);
	} catch (err) {
		console.error('Erro listar:', err);
		return respondServerError(res, err);
	}
};

// Obter um registro específico de pagamentoHasFormaPagamento
exports.obter = async (req, res) => {
	try {
		const { id } = req.params;
		// ID é composto: "idpagamento-idformapagamento"
		const [idPagamento, idFormaPagamento] = id.split('-');

		if (!idPagamento || !idFormaPagamento) {
			return respondBadRequest(res, 'ID inválido. Use formato: idpagamento-idformapagamento');
		}

		const sql = `
			SELECT 
				pagamentoidpedido as idpagamento,
				formapagamentoidformapagamento as idformapagamento,
				valorpago as valor
			FROM pagamentohasformapagamento
			WHERE pagamentoidpedido = $1 AND formapagamentoidformapagamento = $2
		`;
		const result = await query(sql, [idPagamento, idFormaPagamento]);

		if (result.rows.length === 0) {
			return respondNotFound(res, 'Registro não encontrado');
		}

		return respondJson(res, result.rows[0]);
	} catch (err) {
		console.error('Erro obter:', err);
		return respondServerError(res, err);
	}
};

// Criar um novo registro de pagamentoHasFormaPagamento
exports.criar = async (req, res) => {
	try {
		const { idpagamento, idformapagamento, valor } = req.body;

		if (!idpagamento || !idformapagamento) {
			return respondBadRequest(res, 'idpagamento e idformapagamento são obrigatórios');
		}

		// Validar se o pagamento existe
		const checkPagamento = await query(
			'SELECT PedidoIdPedido FROM Pagamento WHERE PedidoIdPedido = $1',
			[idpagamento]
		);
		if (checkPagamento.rows.length === 0) {
			return respondBadRequest(res, 'Pagamento não encontrado');
		}

		// Validar se a forma de pagamento existe
		const checkForma = await query(
			'SELECT idFormaPagamento FROM FormaDePagamento WHERE idFormaPagamento = $1',
			[idformapagamento]
		);
		if (checkForma.rows.length === 0) {
			return respondBadRequest(res, 'Forma de pagamento não encontrada');
		}

		const sql = `
			INSERT INTO pagamentohasformapagamento (pagamentoidpedido, formapagamentoidformapagamento, valorpago)
			VALUES ($1, $2, $3)
			RETURNING pagamentoidpedido as idpagamento, formapagamentoidformapagamento as idformapagamento, valorpago as valor
		`;

		const result = await query(sql, [idpagamento, idformapagamento, valor || null]);
		return respondCreated(res, result.rows[0]);
	} catch (err) {
		console.error('Erro criar:', err);
		return respondServerError(res, err);
	}
};

// Atualizar um registro de pagamentoHasFormaPagamento
exports.atualizar = async (req, res) => {
	try {
		const { id } = req.params;
		const { valor } = req.body;

		const [idPagamento, idFormaPagamento] = id.split('-');

		if (!idPagamento || !idFormaPagamento) {
			return respondBadRequest(res, 'ID inválido. Use formato: idpagamento-idformapagamento');
		}

		// Verificar se existe
		const existing = await query(
			'SELECT * FROM pagamentohasformapagamento WHERE pagamentoidpedido = $1 AND formapagamentoidformapagamento = $2',
			[idPagamento, idFormaPagamento]
		);

		if (existing.rows.length === 0) {
			return respondNotFound(res, 'Registro não encontrado');
		}

		const sql = `
			UPDATE pagamentohasformapagamento
			SET valorpago = $1
			WHERE pagamentoidpedido = $2 AND formapagamentoidformapagamento = $3
			RETURNING pagamentoidpedido as idpagamento, formapagamentoidformapagamento as idformapagamento, valorpago as valor
		`;

		const result = await query(sql, [valor || null, idPagamento, idFormaPagamento]);
		return respondJson(res, result.rows[0]);
	} catch (err) {
		console.error('Erro atualizar:', err);
		return respondServerError(res, err);
	}
};

// Deletar um registro de pagamentoHasFormaPagamento
exports.deletar = async (req, res) => {
	try {
		const { id } = req.params;
		const [idPagamento, idFormaPagamento] = id.split('-');

		if (!idPagamento || !idFormaPagamento) {
			return respondBadRequest(res, 'ID inválido. Use formato: idpagamento-idformapagamento');
		}

		// Verificar se existe
		const existing = await query(
			'SELECT * FROM pagamentohasformapagamento WHERE pagamentoidpedido = $1 AND formapagamentoidformapagamento = $2',
			[idPagamento, idFormaPagamento]
		);

		if (existing.rows.length === 0) {
			return respondNotFound(res, 'Registro não encontrado');
		}

		const sql = `
			DELETE FROM pagamentohasformapagamento
			WHERE pagamentoidpedido = $1 AND formapagamentoidformapagamento = $2
		`;

		await query(sql, [idPagamento, idFormaPagamento]);
		return respondJson(res, { success: true, message: 'Registro deletado' });
	} catch (err) {
		console.error('Erro deletar:', err);
		return respondServerError(res, err);
	}
};