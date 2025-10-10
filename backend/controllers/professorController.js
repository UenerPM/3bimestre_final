const { query } = require('../database');

// Listar todos os professores
exports.listarProfessores = async (req, res) => {
  try {
    const result = await query('SELECT * FROM professor ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar professores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar um novo professor
exports.criarProfessor = async (req, res) => {
  try {
    const { nome, departamento } = req.body;

    if (!nome || !departamento) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, departamento' });
    }

    const result = await query(
      'INSERT INTO professor (nome, departamento) VALUES ($1, $2) RETURNING *',
      [nome, departamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter um professor específico
exports.obterProfessor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM professor WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar um professor
exports.atualizarProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, departamento } = req.body;

    if (!nome || !departamento) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, departamento' });
    }

    const result = await query(
      'UPDATE professor SET nome = $1, departamento = $2 WHERE id = $3 RETURNING *',
      [nome, departamento, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar um professor
exports.deletarProfessor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM professor WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};