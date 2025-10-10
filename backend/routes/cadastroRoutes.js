const express = require('express');
const router = express.Router();
const cadastroController = require('../controllers/cadastroController');

// Rota para criar um novo cadastro
router.post('/', cadastroController.criarCadastro);

module.exports = router;