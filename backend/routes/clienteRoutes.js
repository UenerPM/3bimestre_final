const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rota para servir a página de CRUD no frontend (padronizado como produtoRoutes)
router.get('/abrirCrudCliente', clienteController.abrirCrudCliente);

router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.obterCliente);
router.post('/', clienteController.criarCliente);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;