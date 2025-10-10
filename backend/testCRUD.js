import fetch from 'node-fetch';

(async () => {
  try {
    console.log('Criando pessoa...');
    let response = await fetch('http://localhost:3001/pessoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpfpessoa: '12345678901',
        nomepessoa: 'Pessoa Teste',
        email: 'teste@exemplo.com',
        senha_pessoa: 'senha123',
        data_nascimento: '2000-01-01'
      })
    });
    const createdPerson = await response.json();
    console.log('Resposta ao criar:', createdPerson);

    if (createdPerson.error) {
      console.error('Erro ao criar pessoa:', createdPerson.error);
      return;
    }

    console.log('Alterando pessoa...');
    response = await fetch(`http://localhost:3001/pessoa/${createdPerson.cpfpessoa}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomepessoa: 'Pessoa Alterada',
        email: 'alterado@exemplo.com',
        senha_pessoa: 'novaSenha123'
      })
    });
    const updatedPerson = await response.json();
    console.log('Resposta ao alterar:', updatedPerson);

    if (updatedPerson.error) {
      console.error('Erro ao alterar pessoa:', updatedPerson.error);
      return;
    }

    console.log('Deletando pessoa...');
    response = await fetch(`http://localhost:3001/pessoa/${createdPerson.cpfpessoa}`, {
      method: 'DELETE'
    });
    console.log('Pessoa deletada, status:', response.status);
  } catch (error) {
    console.error('Erro ao testar CRUD:', error);
  }
})();

const fetch = require('node-fetch');
(async () => {
    try {
        console.log('Criando produto...');
        let response = await fetch('http://localhost:3001/produto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nomeproduto: 'Produto Teste',
                quantidadeemestoque: 10,
                precounitario: 20.5
            })
        });
        console.log('Resposta:', await response.json());

        console.log('Alterando produto...');
        response = await fetch('http://localhost:3001/produto/1', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nomeproduto: 'Produto Alterado',
                quantidadeemestoque: 15,
                precounitario: 25.0
            })
        });
        console.log('Resposta:', await response.json());

        console.log('Deletando produto...');
        response = await fetch('http://localhost:3001/produto/1', {
            method: 'DELETE'
        });
        console.log('Produto deletado, status:', response.status);
    } catch (error) {
        console.error('Erro ao testar CRUD:', error);
    }
})();