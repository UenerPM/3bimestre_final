const express = require('express');
const router = express.Router();
const pessoaController = require('../controllers/pessoaController');

// CRUD de Pessoas

router.get('/abrirCrudPessoa', pessoaController.abrirCrudPessoa);
router.get('/', pessoaController.listarPessoas);
router.post('/', pessoaController.criarPessoa);
router.get('/:cpfpessoa', pessoaController.obterPessoa);
router.put('/:cpfpessoa', pessoaController.atualizarPessoa);
router.delete('/:cpfpessoa', pessoaController.deletarPessoa);

module.exports = router;
