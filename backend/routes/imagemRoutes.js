const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const imagemController = require('../controllers/imagemController');

// Diretório para armazenar imagens (relativo ao projeto)
const uploadDir = path.join(__dirname, '../../frontend/img/produtos');

// configurar storage do multer para nomear arquivo com o id do produto
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const produtoId = req.params.produtoId || 'unknown';
		const ext = path.extname(file.originalname) || '.jpg';
		cb(null, `${produtoId}${ext}`);
	}
});

const upload = multer({ storage });

// CRUD básico
router.get('/', imagemController.listarImagens);
router.get('/:id', imagemController.obterImagem);
router.post('/', imagemController.criarImagem);
router.put('/:id', imagemController.atualizarImagem);
router.delete('/:id', imagemController.deletarImagem);

// Upload de imagem associado a um produto (campo do form: 'imagem')
router.post('/upload/:produtoId', upload.single('imagem'), imagemController.uploadImagem);

// Rota especial para verificar se um caminho já existe
router.get('/verificar/:caminho', imagemController.verificarCaminho);

module.exports = router;