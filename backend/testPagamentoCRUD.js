// Smoke test para CRUD de Pagamento
(async () => {
  try {
    const mod = await import('node-fetch');
    const fetch = mod.default || mod;

    console.log('Criando pagamento...');
    let response = await fetch('http://localhost:3001/pagamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idpedido: 1, valorTotalPagamento: 123.45 })
    });
    console.log('Status create:', response.status);
    try { console.log('Resposta create:', await response.json()); } catch (e) {}

    console.log('Alterando pagamento...');
    response = await fetch('http://localhost:3001/pagamento/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valorTotalPagamento: 200.00 })
    });
    console.log('Status update:', response.status);
    try { console.log('Resposta update:', await response.json()); } catch (e) {}

    console.log('Deletando pagamento...');
    response = await fetch('http://localhost:3001/pagamento/1', { method: 'DELETE' });
    console.log('Status delete:', response.status);
  } catch (error) {
    console.error('Erro ao testar CRUD pagamento:', error);
    process.exitCode = 1;
  }
})();
