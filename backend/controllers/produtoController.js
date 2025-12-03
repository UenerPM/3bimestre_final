const { query } = require('../database');
const path = require('path');
const helper = require('../utils/controllerHelper');

exports.abrirCrudProduto = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
};

exports.listarProdutos = async (req, res) => {
  try {
    // JOIN com imagem para trazer o caminho junto
    const result = await query(`
      SELECT p.*, i.caminho as imagem_caminho 
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      ORDER BY p.idproduto
    `);
    return helper.respondList(res, result.rows);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.criarProduto = async (req, res) => {
  try {
    console.log('Dados recebidos do frontend:', req.body);
    const { idproduto, nomeproduto, imagem_caminho } = req.body;
    const quantidadeemestoque = helper.parseNumber(req.body.quantidadeemestoque ?? req.body.quantidade ?? req.body.qtd);
    const precounitario = helper.parseNumber(req.body.precounitario ?? req.body.precoUnitario ?? req.body.preco);

    // Validações básicas
    if (!nomeproduto?.trim()) {
      return helper.respondBadRequest(res, 'O campo nomeproduto é obrigatório');
    }
    if (quantidadeemestoque === null || quantidadeemestoque < 0) {
      return helper.respondBadRequest(res, 'Quantidade em estoque inválida');
    }
    if (precounitario === null || precounitario < 0) {
      return helper.respondBadRequest(res, 'Preço unitário inválido');
    }

    let id_imagem = null;
    // Se forneceu caminho de imagem, criar ou obter ID
    if (imagem_caminho) {
      const imagemResult = await query(
        'INSERT INTO imagem (caminho) VALUES ($1) ON CONFLICT (caminho) DO UPDATE SET caminho = EXCLUDED.caminho RETURNING id',
        [imagem_caminho]
      );
      id_imagem = imagemResult.rows[0].id;
    }

    const result = await query(
      'INSERT INTO produto (idproduto, nomeproduto, quantidadeemestoque, precounitario, id_imagem) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [idproduto || null, nomeproduto.trim(), quantidadeemestoque, precounitario, id_imagem]
    );

    // Buscar produto com caminho da imagem
    const produtoComImagem = await query(`
      SELECT p.*, i.caminho as imagem_caminho 
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      WHERE p.idproduto = $1
    `, [result.rows[0].idproduto]);

    return helper.respondCreated(res, produtoComImagem.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.code === '23502') {
      return helper.respondBadRequest(res, 'Dados obrigatórios não fornecidos');
    }
    return helper.respondServerError(res, error);
  }
};

exports.obterProduto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return helper.respondBadRequest(res, 'ID deve ser um número válido');
    
    const result = await query(`
      SELECT p.*, i.caminho as imagem_caminho 
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      WHERE p.idproduto = $1
    `, [id]);
    
    if (result.rows.length === 0) return helper.respondNotFound(res, 'Produto não encontrado');
    return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.atualizarProduto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return helper.respondBadRequest(res, 'ID inválido');

    // Buscar produto existente
    const existingProductResult = await query('SELECT * FROM produto WHERE idproduto = $1', [id]);
    if (existingProductResult.rows.length === 0) return helper.respondNotFound(res, 'Produto não encontrado');

    const currentProduct = existingProductResult.rows[0];
    const nomeproduto = req.body.nomeproduto !== undefined ? String(req.body.nomeproduto).trim() : currentProduct.nomeproduto;
    const quantidadeemestoque = req.body.quantidadeemestoque !== undefined ? helper.parseNumber(req.body.quantidadeemestoque) : currentProduct.quantidadeemestoque;
    const precounitario = req.body.precounitario !== undefined ? helper.parseNumber(req.body.precounitario) : currentProduct.precounitario;
    
    // Tratar imagem
    let id_imagem = currentProduct.id_imagem;
    if (req.body.imagem_caminho !== undefined) {
      if (req.body.imagem_caminho) {
        const imagemResult = await query(
          'INSERT INTO imagem (caminho) VALUES ($1) ON CONFLICT (caminho) DO UPDATE SET caminho = EXCLUDED.caminho RETURNING id',
          [req.body.imagem_caminho]
        );
        id_imagem = imagemResult.rows[0].id;
      } else {
        id_imagem = null; // Remover imagem se enviou vazio
      }
    }

    // Validações
    if (!nomeproduto) return helper.respondBadRequest(res, 'nomeproduto é obrigatório');
    if (quantidadeemestoque === null || quantidadeemestoque < 0) return helper.respondBadRequest(res, 'quantidadeemestoque inválida');
    if (precounitario === null || precounitario < 0) return helper.respondBadRequest(res, 'precounitario inválido');

    const updateResult = await query(`
      UPDATE produto 
      SET nomeproduto = $1, 
          quantidadeemestoque = $2, 
          precounitario = $3,
          id_imagem = $4
      WHERE idproduto = $5 
      RETURNING *
    `, [nomeproduto, quantidadeemestoque, precounitario, id_imagem, id]);

    // Buscar produto atualizado com caminho da imagem
    const produtoComImagem = await query(`
      SELECT p.*, i.caminho as imagem_caminho 
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      WHERE p.idproduto = $1
    `, [id]);

    return helper.respondJson(res, produtoComImagem.rows[0]);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

exports.deletarProduto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return helper.respondBadRequest(res, 'ID inválido');
    const existingProductResult = await query('SELECT * FROM produto WHERE idproduto = $1', [id]);
    if (existingProductResult.rows.length === 0) return helper.respondNotFound(res, 'Produto não encontrado');
    await query('DELETE FROM produto WHERE idproduto = $1', [id]);
    return helper.respondNoContent(res);
  } catch (error) {
    if (error && error.code === '23503') return helper.respondBadRequest(res, 'Não é possível deletar produto com dependências associadas');
    return helper.respondServerError(res, error);
  }
};

exports.obterProdutoPorDescricao = async (req, res) => {
  try {
    const { descricao } = req.params;
    if (!descricao) return helper.respondBadRequest(res, 'A descrição é obrigatória');
    
    const result = await query(`
      SELECT p.*, i.caminho as imagem_caminho 
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      WHERE p.nomeproduto = $1
    `, [descricao]);
    
    if (result.rows.length === 0) return helper.respondNotFound(res, 'Produto não encontrado');
    return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    return helper.respondServerError(res, error);
  }
};

