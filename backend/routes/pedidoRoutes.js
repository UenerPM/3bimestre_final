const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.get('/abrirCrudPedido', pedidoController.abrirCrudPedido);
router.get('/', pedidoController.listarPedidos);
router.get('/:id', pedidoController.obterPedido);
router.post('/', pedidoController.criarPedido);
router.put('/:id', pedidoController.atualizarPedido);
router.delete('/:id', pedidoController.deletarPedido);

module.exports = router;