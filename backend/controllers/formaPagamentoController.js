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
		
		res.json(result.rows);
	} catch (err) {
		console.error('Erro listarFormas:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.obterForma = async (req, res) => {
	try {
		const idForma = parseInt(req.params.id);
		if (isNaN(idForma)) return res.status(400).json({ error: 'ID inválido' });
		const sql = `SELECT idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento FROM formadepagamento WHERE idformapagamento = $1`;
		const result = await query(sql, [idForma]);
		if (result.rows.length === 0) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
		res.json(result.rows[0]);
	} catch (err) {
		console.error('Erro obterForma:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.criarForma = async (req, res) => {
    try {
        const { nomeformapagamento: nomeFormaPagamento } = req.body;
        if (!nomeFormaPagamento) return res.status(400).json({ error: 'Nome é obrigatório' });
		const result = await query('INSERT INTO formadepagamento (nomeformapagamento) VALUES ($1) RETURNING idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento', [nomeFormaPagamento]);
		res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro criarForma:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

exports.atualizarForma = async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const { nomeformapagamento: nomeFormaPagamento } = req.body;
		if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
		const existing = await query('SELECT idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento FROM formadepagamento WHERE idformapagamento = $1', [id]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Forma não encontrada' });
		const updated = await query('UPDATE formadepagamento SET nomeformapagamento = $1 WHERE idformapagamento = $2 RETURNING idformapagamento as idformadepagamento, nomeformapagamento as nomeformapagamento', [nomeFormaPagamento || existing.rows[0].nomeformapagamento, id]);
		res.json(updated.rows[0]);
	} catch (err) {
		console.error('Erro atualizarForma:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.deletarForma = async (req, res) => {
	try {
		const idForma = parseInt(req.params.id);
		const existing = await query('SELECT idformapagamento as idformadepagamento FROM formadepagamento WHERE idformapagamento = $1', [idForma]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Forma não encontrada' });
		await query('DELETE FROM formadepagamento WHERE idformapagamento = $1', [idForma]);
		res.status(204).send();
	} catch (err) {
		console.error('Erro deletarForma:', err && err.stack ? err.stack : err);
		// Violação de FK: registros dependentes existem
		if (err.code === '23503') {
			return res.status(400).json({ error: 'Não é possível excluir: forma de pagamento está sendo usada em pagamentos' });
		}
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}