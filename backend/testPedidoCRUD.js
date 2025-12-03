// Smoke test para CRUD de Pedido
(async () => {
  try {
    const mod = await import('node-fetch');
    const fetch = mod.default || mod;

    console.log('Criando pedido...');
    let response = await fetch('http://localhost:3001/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataDoPedido: new Date().toISOString(), ClientePessoaCpfPessoa: '00000000000', FuncionarioPessoaCpfPessoa: '00000000000' })
    });
    console.log('Status create:', response.status);
    try { console.log('Resposta create:', await response.json()); } catch (e) {}

    console.log('Alterando pedido...');
    response = await fetch('http://localhost:3001/pedido/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataDoPedido: new Date().toISOString(), ClientePessoaCpfPessoa: '00000000000', FuncionarioPessoaCpfPessoa: '00000000000' })
    });
    console.log('Status update:', response.status);
    try { console.log('Resposta update:', await response.json()); } catch (e) {}

    console.log('Deletando pedido...');
    response = await fetch('http://localhost:3001/pedido/1', { method: 'DELETE' });
    console.log('Status delete:', response.status);
  } catch (error) {
    console.error('Erro ao testar CRUD pedido:', error);
    process.exitCode = 1;
  }
})();
