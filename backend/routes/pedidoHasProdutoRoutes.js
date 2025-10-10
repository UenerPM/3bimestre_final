// Rotas para a tabela pedidoHasProduto
const express = require('express');
const router = express.Router();
const pedidoHasProdutoController = require('../controllers/pedidoHasProdutoController');

// CRUD de pedidoHasProduto
router.get('/abrirCrudPedidoHasProduto', pedidoHasProdutoController.abrirCrudPedidoHasProduto);
router.get('/', pedidoHasProdutoController.listarPedidoHasProduto);
router.post('/', pedidoHasProdutoController.criarPedidoHasProduto);
router.post('/batch', pedidoHasProdutoController.criarPedidoHasProdutoBatch);
router.get('/:id', pedidoHasProdutoController.obterPedidoHasProduto);
router.put('/:id', pedidoHasProdutoController.atualizarPedidoHasProduto);
router.delete('/:id', pedidoHasProdutoController.deletarPedidoHasProduto);

module.exports = router;
