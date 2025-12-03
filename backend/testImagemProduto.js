const fetch = require('node-fetch');

async function testarSistemaImagens() {
    try {
        console.log('1. Criando uma imagem via API...');
        let response = await fetch('http://localhost:3001/imagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caminho: 'img/produtos/teste.jpg' })
        });
        let imagem = await response.json();
        console.log('Imagem criada:', imagem);

        console.log('\n2. Criando um produto com imagem...');
        response = await fetch('http://localhost:3001/produto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nomeproduto: 'Produto com Imagem',
                quantidadeemestoque: 10,
                precounitario: 29.99,
                imagem_caminho: 'img/produtos/teste.jpg'
            })
        });
        let produto = await response.json();
        console.log('Produto criado:', produto);

        console.log('\n3. Listando produtos para verificar imagens...');
        response = await fetch('http://localhost:3001/produto');
        let produtos = await response.json();
        console.log('Produtos:', produtos);

    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

// Executar teste
testarSistemaImagens();