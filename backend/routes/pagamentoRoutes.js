const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

router.get('/abrirCrudPagamento', pagamentoController.abrirCrudPagamento);
router.get('/', pagamentoController.listarPagamentos);
// obter pagamento pelo id do pedido (PedidoIdPedido é a PK na tabela Pagamento)
router.get('/:idpedido', pagamentoController.obterPagamentoPorPedido);
router.post('/', pagamentoController.criarPagamento);
router.put('/:idpedido', pagamentoController.atualizarPagamento);
router.delete('/:idpedido', pagamentoController.deletarPagamento);

module.exports = router;