const { query } = require('../database');
const path = require('path');

exports.abrirCrudProduto = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
};

exports.listarProdutos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM produto ORDER BY idproduto');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarProduto = async (req, res) => {
  try {
    console.log('Dados recebidos do frontend:', req.body); // Log para depuração
    console.log('Dados recebidos no backend:', req.body);
    const { idproduto, nomeproduto, quantidadeemestoque, precounitario } = req.body;

    // Validação detalhada dos campos
    if (!nomeproduto || typeof nomeproduto !== 'string' || nomeproduto.trim() === '') {
      return res.status(400).json({ error: 'O campo nomeproduto é obrigatório e deve ser uma string válida.' });
    }

    if (!quantidadeemestoque || isNaN(quantidadeemestoque) || quantidadeemestoque < 0) {
      return res.status(400).json({ error: 'O campo quantidadeemestoque é obrigatório e deve ser um número válido maior ou igual a zero.' });
    }

    if (!precounitario || isNaN(precounitario) || precounitario <= 0) {
      return res.status(400).json({ error: 'O campo precounitario é obrigatório e deve ser um número válido maior que zero.' });
    }

    const result = await query(
      'INSERT INTO produto (idproduto, nomeproduto, quantidadeemestoque, precounitario) VALUES ($1, $2, $3, $4) RETURNING *',
      [idproduto, nomeproduto, quantidadeemestoque, precounitario]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error); // Log detalhado do erro
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM produto WHERE idproduto = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nomeproduto, quantidadeemestoque, precounitario } = req.body;

    const existingProductResult = await query(
      'SELECT * FROM produto WHERE idproduto = $1',
      [id]
    );

    if (existingProductResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const currentProduct = existingProductResult.rows[0];
    const updatedFields = {
      nomeproduto: nomeproduto || currentProduct.nomeproduto,
      quantidadeemestoque: quantidadeemestoque || currentProduct.quantidadeemestoque,
      precounitario: precounitario || currentProduct.precounitario
    };

    const updateResult = await query(
      'UPDATE produto SET nomeproduto = $1, quantidadeemestoque = $2, precounitario = $3 WHERE idproduto = $4 RETURNING *',
      [updatedFields.nomeproduto, updatedFields.quantidadeemestoque, updatedFields.precounitario, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingProductResult = await query(
      'SELECT * FROM produto WHERE idproduto = $1',
      [id]
    );

    if (existingProductResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await query(
      'DELETE FROM produto WHERE idproduto = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar produto com dependências associadas'
      });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterProdutoPorDescricao = async (req, res) => {
  try {
    const { descricao } = req.params;

    if (!descricao) {
      return res.status(400).json({ error: 'A descrição é obrigatória' });
    }

    const result = await query(
      'SELECT * FROM produto WHERE nomeproduto = $1',
      [descricao]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

