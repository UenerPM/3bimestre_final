const { query } = require('../database');
const fs = require('fs');
const path = require('path');

// Pasta base para imagens (relativa à raiz do projeto)
const BASE_IMG_DIR = path.join(__dirname, '../../frontend/img/produtos');

// Helper para validar caminho
function validarCaminho(caminho) {
    if (!caminho) return false;
    // Garantir que começa com img/produtos/
    if (!caminho.startsWith('img/produtos/')) return false;
    // Verificar se arquivo existe fisicamente
    const caminhoAbsoluto = path.join(__dirname, '../../frontend', caminho);
    return fs.existsSync(caminhoAbsoluto);
}

// CRUD básico
async function listarImagens(req, res) {
    try {
        const result = await query('SELECT * FROM imagem ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar imagens:', err);
        res.status(500).json({ error: 'Erro interno ao listar imagens' });
    }
}

async function obterImagem(req, res) {
    const { id } = req.params;
    try {
        const result = await query('SELECT * FROM imagem WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Imagem não encontrada' });
            return;
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter imagem:', err);
        res.status(500).json({ error: 'Erro interno ao obter imagem' });
    }
}

async function criarImagem(req, res) {
    const { caminho } = req.body;
    
    // Validação do caminho
    if (!validarCaminho(caminho)) {
        res.status(400).json({ 
            error: 'Caminho inválido. Deve começar com img/produtos/ e o arquivo deve existir.' 
        });
        return;
    }

    try {
        // Verificar se já existe
        const existente = await query('SELECT id FROM imagem WHERE caminho = $1', [caminho]);
        if (existente.rows.length > 0) {
            res.json(existente.rows[0]); // Retorna o id existente
            return;
        }

        const result = await query(
            'INSERT INTO imagem (caminho) VALUES ($1) RETURNING *',
            [caminho]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar imagem:', err);
        res.status(500).json({ error: 'Erro interno ao criar imagem' });
    }
}

async function atualizarImagem(req, res) {
    const { id } = req.params;
    const { caminho } = req.body;
    
    // Validação do caminho
    if (!validarCaminho(caminho)) {
        res.status(400).json({ 
            error: 'Caminho inválido. Deve começar com img/produtos/ e o arquivo deve existir.' 
        });
        return;
    }

    try {
        const result = await query(
            'UPDATE imagem SET caminho = $1 WHERE id = $2 RETURNING *',
            [caminho, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Imagem não encontrada' });
            return;
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar imagem:', err);
        res.status(500).json({ error: 'Erro interno ao atualizar imagem' });
    }
}

async function deletarImagem(req, res) {
    const { id } = req.params;
    try {
        // Primeiro verifica se há produtos usando esta imagem
        const produtos = await query('SELECT id FROM produto WHERE id_imagem = $1', [id]);
        if (produtos.rows.length > 0) {
            res.status(400).json({ 
                error: 'Não é possível excluir: imagem está sendo usada por produtos' 
            });
            return;
        }

        const result = await query('DELETE FROM imagem WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Imagem não encontrada' });
            return;
        }
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar imagem:', err);
        res.status(500).json({ error: 'Erro interno ao deletar imagem' });
    }
}

// Rota especial para verificar se um caminho existe
async function verificarCaminho(req, res) {
    const { caminho } = req.params;
    try {
        if (!validarCaminho(caminho)) {
            res.json({ exists: false, message: 'Caminho inválido ou arquivo não encontrado' });
            return;
        }

        const result = await query('SELECT id FROM imagem WHERE caminho = $1', [caminho]);
        res.json({ 
            exists: result.rows.length > 0,
            id: result.rows[0]?.id,
            isValid: true
        });
    } catch (err) {
        console.error('Erro ao verificar caminho:', err);
        res.status(500).json({ error: 'Erro interno ao verificar caminho' });
    }
}

// Handler para upload de arquivo e associação ao produto
async function uploadImagem(req, res) {
    try {
        const produtoId = Number(req.params.produtoId);
        if (!Number.isInteger(produtoId)) return res.status(400).json({ error: 'produtoId inválido' });

        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Arquivo não enviado (campo "imagem")' });

        const filename = file.filename; // definido pelo multer
        const caminhoRel = path.posix.join('img', 'produtos', filename);

        // remover possíveis arquivos antigos com mesmo id e outra extensão
        try {
            const files = fs.readdirSync(BASE_IMG_DIR);
            files.forEach(f => {
                if (f.startsWith(String(produtoId)) && f !== filename) {
                    try { fs.unlinkSync(path.join(BASE_IMG_DIR, f)); } catch (e) { /* ignore */ }
                }
            });
        } catch (e) {
            // não bloqueia se leitura falhar
        }

        // Inserir ou obter id da imagem
        console.log('Upload recebido para produtoId=', produtoId, 'arquivo=', file.path);
        const insert = await query('INSERT INTO imagem (caminho) VALUES ($1) ON CONFLICT (caminho) DO NOTHING RETURNING id', [caminhoRel]);
        let idImagem;
        if (insert.rows.length > 0) idImagem = insert.rows[0].id;
        else {
            const sel = await query('SELECT id FROM imagem WHERE caminho = $1', [caminhoRel]);
            idImagem = sel.rows[0]?.id;
        }

        // associar ao produto
        if (idImagem) {
            await query('UPDATE produto SET id_imagem = $1 WHERE idproduto = $2', [idImagem, produtoId]);
            console.log(`Imagem associada: produto ${produtoId} -> imagem id ${idImagem} (${caminhoRel})`);
        } else {
            console.warn('Falha ao inserir/obter id da imagem para caminho', caminhoRel);
        }

        res.json({ id: idImagem, caminho: caminhoRel });
    } catch (err) {
        console.error('Erro no upload de imagem:', err);
        res.status(500).json({ error: 'Erro interno ao fazer upload' });
    }
}

// Criar diretório de imagens se não existir
if (!fs.existsSync(BASE_IMG_DIR)) {
    fs.mkdirSync(BASE_IMG_DIR, { recursive: true });
    console.log('Diretório de imagens criado:', BASE_IMG_DIR);
}

module.exports = {
    listarImagens,
    obterImagem,
    criarImagem,
    atualizarImagem,
    deletarImagem,
    verificarCaminho,
    uploadImagem
};