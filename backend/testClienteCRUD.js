const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    const cpf = '99999999901';
    console.log('Criando pessoa auxiliar...');
    let res = await fetch('http://localhost:3001/pessoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfpessoa: cpf, nomepessoa: 'Cliente Teste', email: `cliente${cpf}@ex.com`, senha_pessoa: 'pass', datanascimentopessoa: '1990-01-01' })
    });
    console.log('Pessoa create status:', res.status, 'body:', await res.json());

    console.log('Criando cliente...');
    res = await fetch('http://localhost:3001/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pessoacpfpessoa: cpf, rendacliente: 5000 })
    });
    console.log('Cliente create status:', res.status, 'body:', await res.json());

    console.log('Alterando cliente...');
    res = await fetch(`http://localhost:3001/cliente/${cpf}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rendacliente: 6000 })
    });
    console.log('Cliente update status:', res.status, 'body:', await res.json());

    console.log('Deletando cliente...');
    res = await fetch(`http://localhost:3001/cliente/${cpf}`, { method: 'DELETE' });
    console.log('Cliente delete status:', res.status);

    console.log('Deletando pessoa auxiliar...');
    res = await fetch(`http://localhost:3001/pessoa/${cpf}`, { method: 'DELETE' });
    console.log('Pessoa delete status:', res.status);
  } catch (err) {
    console.error('Erro no teste cliente:', err);
  }
})();
