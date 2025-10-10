const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.get('/abrirCrudPedido', pedidoController.abrirCrudPedido);
router.get('/', pedidoController.listarPedidos);
router.post('/', pedidoController.criarPedido);
router.put('/:idpedido', pedidoController.atualizarPedido);
router.delete('/:idpedido', pedidoController.deletarPedido);

module.exports = router;