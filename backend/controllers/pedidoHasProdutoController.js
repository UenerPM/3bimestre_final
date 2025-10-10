const { query } = require('../database');
const path = require('path');

// Abre a página do CRUD de pedidoHasProduto
exports.abrirCrudPedidoHasProduto = (req, res) => {
  const caminho = path.join(__dirname, '../../frontend/pedidoHasProduto/pedidoHasProduto.html');
  res.sendFile(caminho);
}

// Lista todos os registros de pedidohasproduto (com join para informações legíveis)
exports.listarPedidoHasProduto = async (req, res) => {
  try {
    const sql = `SELECT php.produtoidproduto AS produtoId, php.pedidoidpedido AS pedidoId, php.quantidade, php.precounitario AS precoUnitario,
                 p.nomeproduto AS nomeProduto, ped.datadopedido AS dataDoPedido
                 FROM pedidohasproduto php
                 LEFT JOIN produto p ON p.idproduto = php.produtoidproduto
                 LEFT JOIN pedido ped ON ped.idpedido = php.pedidoidpedido`;
    const result = await query(sql);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidohasproduto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Cria um novo registro em PedidoHasProduto
exports.criarPedidoHasProduto = async (req, res) => {
  try {
    const { ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario, precounitario } = req.body;
    const preco = precoUnitario ?? precounitario ?? null;

    if (!ProdutoIdProduto || !PedidoIdPedido || !quantidade) {
      return res.status(400).json({ error: 'produtoId, pedidoId e quantidade são obrigatórios' });
    }

    const sql = 'INSERT INTO pedidohasproduto (produtoidproduto, pedidoidpedido, quantidade, precounitario) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await query(sql, [ProdutoIdProduto, PedidoIdPedido, quantidade, preco]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar PedidoHasProduto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}

// Obtém registros pelo id do pedido (retorna todos os produtos do pedido)
exports.obterPedidoHasProduto = async (req, res) => {
  try {
  const pedidoId = req.params.id;
  if (!pedidoId) return res.status(400).json({ error: 'ID do pedido é obrigatório' });

  // retornar informações legíveis juntando com produto e pedido
  const sql = `SELECT php.produtoidproduto AS produtoId, php.pedidoidpedido AS pedidoId, php.quantidade, php.precounitario AS precoUnitario,
               p.nomeproduto AS nomeProduto, ped.datadopedido AS dataDoPedido
               FROM pedidohasproduto php
               LEFT JOIN produto p ON p.idproduto = php.produtoidproduto
               LEFT JOIN pedido ped ON ped.idpedido = php.pedidoidpedido
               WHERE php.pedidoidpedido = $1`;
  const result = await query(sql, [pedidoId]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter PedidoHasProduto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Atualiza um registro (espera os campos de chave primária no body)
exports.atualizarPedidoHasProduto = async (req, res) => {
  try {
    const { ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario, precounitario } = req.body;
    const preco = precoUnitario ?? precounitario ?? null;

    if (!ProdutoIdProduto || !PedidoIdPedido) {
      return res.status(400).json({ error: 'Chaves produtoId e pedidoId são obrigatórias para atualizar' });
    }

    const sql = 'UPDATE pedidohasproduto SET quantidade = $1, precounitario = $2 WHERE produtoidproduto = $3 AND pedidoidpedido = $4 RETURNING *';
    const result = await query(sql, [quantidade, preco, ProdutoIdProduto, PedidoIdPedido]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar PedidoHasProduto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}

// Deleta um registro. Se query param produto for passado, deleta o registro específico, senão deleta todos do pedido
exports.deletarPedidoHasProduto = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const produtoId = req.query.produto; // opcional

    if (!pedidoId) return res.status(400).json({ error: 'ID do pedido é obrigatório' });

    if (produtoId) {
      await query('DELETE FROM pedidohasproduto WHERE pedidoidpedido = $1 AND produtoidproduto = $2', [pedidoId, produtoId]);
    } else {
      await query('DELETE FROM pedidohasproduto WHERE pedidoidpedido = $1', [pedidoId]);
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar PedidoHasProduto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Insere múltiplos itens em uma única transação
exports.criarPedidoHasProdutoBatch = async (req, res) => {
  const { itens } = req.body; // espera { itens: [ { ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario } ] }
  if (!Array.isArray(itens) || itens.length === 0) return res.status(400).json({ error: 'Array de itens é obrigatório' });
  const client = await require('../database').getClient();
  try {
    await client.query('BEGIN');
    for (const it of itens) {
      const produto = it.ProdutoIdProduto ?? it.produtoId ?? it.produtoid;
      const pedido = it.PedidoIdPedido ?? it.pedidoId ?? it.pedidoid;
      const quantidade = it.quantidade ?? it.qtd;
      const preco = it.precoUnitario ?? it.precounitario ?? null;
      if (!produto || !pedido || !quantidade) throw new Error('Produto, pedido e quantidade são obrigatórios para cada item');

      const sql = `INSERT INTO pedidohasproduto (produtoidproduto, pedidoidpedido, quantidade, precounitario)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (produtoidproduto, pedidoidpedido)
                   DO UPDATE SET quantidade = pedidohasproduto.quantidade + EXCLUDED.quantidade,
                                 precounitario = EXCLUDED.precounitario`;
      try {
        await client.query(sql, [produto, pedido, quantidade, preco]);
      } catch (e) {
        // fallback: se por algum motivo o upsert falhar com 23505, tentar atualizar manualmente
        if (e && e.code === '23505') {
          console.warn(`Upsert falhou por duplicidade para produto ${produto} pedido ${pedido}, tentando UPDATE fallback`);
          const upd = 'UPDATE pedidohasproduto SET quantidade = quantidade + $1, precounitario = $2 WHERE produtoidproduto = $3 AND pedidoidpedido = $4';
          await client.query(upd, [quantidade, preco, produto, pedido]);
        } else {
          throw e; // rethrow para ser tratado pelo catch externo
        }
      }
    }
    await client.query('COMMIT');
    return res.status(201).json({ inserted: itens.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao inserir batch de itens:', error);
    if (error && error.code === '23503') return res.status(400).json({ error: 'Violação de integridade: cliente/produto/pedido inexistente' });
    return res.status(500).json({ error: 'Erro ao inserir itens em batch', details: error.message });
  } finally {
    client.release();
  }
}
