const { query } = require('../database');
const path = require('path');

exports.abrirCrudCliente = (req, res) => {
	res.sendFile(path.join(__dirname, '../../frontend/cliente/cliente.html'));
}

exports.listarClientes = async (req, res) => {
	try {
		// Retorna CPF do cliente, renda e o nome vinculado na tabela pessoa (se existir)
		const sql = `SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa ORDER BY p.nomepessoa NULLS LAST, c.pessoacpfpessoa`;
		console.log('listarClientes - SQL:', sql);
		const result = await query(sql);
		res.json(result.rows);
	} catch (err) {
		console.error('Erro listarClientes:', err && err.stack ? err.stack : err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.obterCliente = async (req, res) => {
	try {
		const id = req.params.id;
		if (!id) return res.status(400).json({ error: 'ID obrigatório' });
		const sql = `SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`;
	const result = await query(sql, [id]);
	if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
	res.json(result.rows[0]);
	} catch (err) {
		console.error('Erro obterCliente:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.criarCliente = async (req, res) => {
	try {
		const { pessoacpfpessoa, rendacliente, datadecadastracliente } = req.body;
		if (!pessoacpfpessoa) return res.status(400).json({ error: 'CPF da pessoa é obrigatório' });
		const result = await query(
			'INSERT INTO cliente (pessoacpfpessoa, rendacliente, datadecadastrocliente) VALUES ($1, $2, $3) RETURNING pessoacpfpessoa',
			[pessoacpfpessoa, rendacliente || null, datadecadastracliente || null]
		);
		// Buscar novamente com join para retornar o nome da pessoa
		const created = await query(
			`SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`,
			[pessoacpfpessoa]
		);
		res.status(201).json(created.rows[0]);
	} catch (err) {
		console.error('Erro criarCliente:', err);
		if (err.code === '23503') return res.status(400).json({ error: 'Pessoa referenciada não existe' });
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.atualizarCliente = async (req, res) => {
	try {
		const id = req.params.id;
		const { rendacliente, datadecadastracliente } = req.body;
		const existing = await query('SELECT pessoacpfpessoa as pessoacpfpessoa, rendacliente as rendacliente, datadecadastrocliente as datadecadastracliente FROM cliente WHERE pessoacpfpessoa = $1', [id]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
		await query(
			'UPDATE cliente SET rendacliente = $1, datadecadastrocliente = $2 WHERE pessoacpfpessoa = $3',
			[rendacliente || existing.rows[0].rendacliente, datadecadastracliente || existing.rows[0].datadecadastracliente, id]
		);
		// Buscar novamente com join para retornar o nome da pessoa
		const updated = await query(`SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`, [id]);
		res.json(updated.rows[0]);
	} catch (err) {
		console.error('Erro atualizarCliente:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}

exports.deletarCliente = async (req, res) => {
	try {
		const id = req.params.id;
		const existing = await query('SELECT pessoacpfpessoa as pessoacpfpessoa FROM cliente WHERE pessoacpfpessoa = $1', [id]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
		await query('DELETE FROM cliente WHERE pessoacpfpessoa = $1', [id]);
		res.status(204).send();
	} catch (err) {
		console.error('Erro deletarCliente:', err);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}
}