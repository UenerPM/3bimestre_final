const { query } = require('../database');
const path = require('path');
const helper = require('../utils/controllerHelper');

/*
 * Controller: Cliente
 * Padrão: abrirCrud, listar, criar, obter, atualizar, deletar.
 * Usa helper para respostas padronizadas.
 */

exports.abrirCrudCliente = (req, res) => {
    // Envia a página estática do frontend correspondente ao CRUD de Cliente
    res.sendFile(path.join(__dirname, '../../frontend/cliente/cliente.html'));
};

exports.listarClientes = async (req, res) => {
    try {
        // Retorna CPF do cliente, renda e o nome vinculado na tabela pessoa (se existir)
        const sql = `SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa ORDER BY p.nomepessoa NULLS LAST, c.pessoacpfpessoa`;
        console.log('listarClientes - SQL:', sql);
        const result = await query(sql);
        return helper.respondList(res, result.rows);
    } catch (err) {
        console.error('Erro listarClientes:', err && err.stack ? err.stack : err);
        return helper.respondServerError(res, err);
    }
};

exports.criarCliente = async (req, res) => {
    try {
        const { pessoacpfpessoa, rendacliente, datadecadastracliente } = req.body;
        if (!pessoacpfpessoa) return helper.respondBadRequest(res, 'CPF da pessoa é obrigatório');

        await query(
            'INSERT INTO cliente (pessoacpfpessoa, rendacliente, datadecadastrocliente) VALUES ($1, $2, $3)',
            [pessoacpfpessoa, rendacliente || null, datadecadastracliente || null]
        );

        // Buscar novamente com join para retornar o nome da pessoa
        const created = await query(
            `SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`,
            [pessoacpfpessoa]
        );

        return helper.respondCreated(res, created.rows[0]);
    } catch (err) {
        console.error('Erro criarCliente:', err);
        if (err && err.code === '23503') return helper.respondBadRequest(res, 'Pessoa referenciada não existe');
        return helper.respondServerError(res, err);
    }
};

exports.obterCliente = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) return helper.respondBadRequest(res, 'ID obrigatório');

        const sql = `SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`;
        const result = await query(sql, [id]);
        if (result.rows.length === 0) return helper.respondNotFound(res, 'Cliente não encontrado');
        return helper.respondJson(res, result.rows[0]);
    } catch (err) {
        console.error('Erro obterCliente:', err);
        return helper.respondServerError(res, err);
    }
};

exports.atualizarCliente = async (req, res) => {
    try {
        const id = req.params.id;
        const { rendacliente, datadecadastracliente } = req.body;
        const existing = await query('SELECT pessoacpfpessoa as pessoacpfpessoa, rendacliente as rendacliente, datadecadastrocliente as datadecadastracliente FROM cliente WHERE pessoacpfpessoa = $1', [id]);
        if (existing.rows.length === 0) return helper.respondNotFound(res, 'Cliente não encontrado');

        await query(
            'UPDATE cliente SET rendacliente = $1, datadecadastrocliente = $2 WHERE pessoacpfpessoa = $3',
            [rendacliente || existing.rows[0].rendacliente, datadecadastracliente || existing.rows[0].datadecadastracliente, id]
        );

        // Buscar novamente com join para retornar o nome da pessoa
        const updated = await query(`SELECT c.pessoacpfpessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, c.rendacliente as rendacliente, c.datadecadastrocliente as datadecadastracliente FROM cliente c LEFT JOIN pessoa p ON p.cpfpessoa = c.pessoacpfpessoa WHERE c.pessoacpfpessoa = $1`, [id]);
        return helper.respondJson(res, updated.rows[0]);
    } catch (err) {
        console.error('Erro atualizarCliente:', err);
        return helper.respondServerError(res, err);
    }
};

exports.deletarCliente = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await query('SELECT pessoacpfpessoa as pessoacpfpessoa FROM cliente WHERE pessoacpfpessoa = $1', [id]);
        if (existing.rows.length === 0) return helper.respondNotFound(res, 'Cliente não encontrado');
        await query('DELETE FROM cliente WHERE pessoacpfpessoa = $1', [id]);
        return helper.respondNoContent(res);
    } catch (err) {
        console.error('Erro deletarCliente:', err);
        return helper.respondServerError(res, err);
    }
};