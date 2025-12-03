const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    const cpf = '88888888801';
    console.log('Criando pessoa auxiliar...');
    let res = await fetch('http://localhost:3001/pessoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfpessoa: cpf, nomepessoa: 'Funcionario Teste', email: `func${cpf}@ex.com`, senha_pessoa: 'pass', datanascimentopessoa: '1990-01-01' })
    });
    console.log('Pessoa create status:', res.status, 'body:', await res.json());

    console.log('Criando cargo temporário...');
    let cargoRes = await fetch('http://localhost:3001/cargo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nomecargo: 'Cargo Teste Temp' })
    });
    const cargoBody = await cargoRes.json();
    const cargoId = cargoBody.idcargo || cargoBody.idCargo || cargoBody.id;

    console.log('Criando funcionario...');
    res = await fetch('http://localhost:3001/funcionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PessoaCpfPessoa: cpf, salario: 2000, porcentagemComissao: 5, CargosIdCargo: cargoId })
    });
    console.log('Funcionario create status:', res.status, 'body:', await res.json());

    console.log('Alterando funcionario...');
    res = await fetch(`http://localhost:3001/funcionario/${cpf}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salario: 2500 })
    });
    console.log('Funcionario update status:', res.status, 'body:', await res.json());

    console.log('Deletando funcionario...');
    res = await fetch(`http://localhost:3001/funcionario/${cpf}`, { method: 'DELETE' });
    console.log('Funcionario delete status:', res.status);

    console.log('Deletando pessoa auxiliar...');
    res = await fetch(`http://localhost:3001/pessoa/${cpf}`, { method: 'DELETE' });
    console.log('Pessoa delete status:', res.status);
    if (cargoId) {
      try {
        const delCargo = await fetch(`http://localhost:3001/cargo/${cargoId}`, { method: 'DELETE' });
        console.log('Cargo temporário delete status:', delCargo.status);
      } catch (e) {
        console.warn('Não foi possível deletar cargo temporário:', e && e.message ? e.message : e);
      }
    }
  } catch (err) {
    console.error('Erro no teste funcionario:', err);
  }
})();
