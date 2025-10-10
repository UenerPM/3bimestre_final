// ...existing code...
const path = require('path');
const dbModule = require('../database');

// fallback para aceitar exports diferentes (query direto ou pool)
const query = dbModule.query || (dbModule.pool && dbModule.pool.query) || (async (sql, params) => { throw new Error('database.query não disponível'); });

exports.abrirCrudCargo = (req, res) => {
    // envia a página estática do frontend (ajuste o caminho se necessário)
    return res.sendFile(path.join(__dirname, '../../frontend/cargo/cargo.html'));
};

exports.listarCargos = async (req, res) => {
    try {
        const result = await query('SELECT idcargo, nomecargo FROM cargo ORDER BY idcargo');
        return res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar cargos:', error);
        return res.status(500).json({ error: 'Erro ao listar cargos' });
    }
};

exports.criarCargo = async (req, res) => {
    try {
        const { nomecargo } = req.body;
        // validação mais segura
        const nome = nomecargo == null ? '' : String(nomecargo).trim();
        if (!nome) {
            return res.status(400).json({ error: 'nomecargo é obrigatório' });
        }

        const result = await query(
            'INSERT INTO cargo (nomecargo) VALUES ($1) RETURNING idcargo, nomecargo',
            [nome]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar cargo:', error);
        return res.status(500).json({ error: 'Erro ao criar cargo' });
    }
};

exports.obterCargo = async (req, res) => {
    try {
        const idParam = req.params.id;
        const id = parseInt(idParam, 10);
        console.log('GET /cargo/:id -> id param:', idParam, 'parsed:', id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const result = await query('SELECT idcargo, nomecargo FROM cargo WHERE idcargo = $1', [id]);
        console.log('Query result rows:', result.rows);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter cargo:', error);
        return res.status(500).json({ error: 'Erro ao obter cargo' });
    }
};

exports.atualizarCargo = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { nomecargo } = req.body;
        if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        if (!nomecargo || !nomecargo.toString().trim()) {
            return res.status(400).json({ error: 'nomecargo é obrigatório' });
        }

        const result = await query(
            'UPDATE cargo SET nomecargo = $1 WHERE idcargo = $2 RETURNING idcargo, nomecargo',
            [nomecargo, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar cargo:', error);
        return res.status(500).json({ error: 'Erro ao atualizar cargo' });
    }
};

exports.deletarCargo = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const result = await query('DELETE FROM cargo WHERE idcargo = $1 RETURNING idcargo', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar cargo:', error);
        return res.status(500).json({ error: 'Erro ao deletar cargo' });
    }
};