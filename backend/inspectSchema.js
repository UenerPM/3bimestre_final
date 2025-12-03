const db = require('./database');

async function inspecionarSchema() {
  try {
    console.log('Inspecionando schema do banco...\n');

    // Listar tabelas
    const tabelas = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'peer'
      ORDER BY table_name
    `);
    console.log('📋 Tabelas encontradas:');
    tabelas.rows.forEach(t => console.log(`  - ${t.table_name}`));

    // Verificar colunas importantes
    const colunasFormaPagamento = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'peer' AND table_name = 'FormaDePagamento'
    `);
    console.log('\n📋 Colunas em FormaDePagamento:');
    colunasFormaPagamento.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // Verificar PagamentoHasFormaPagamento
    const colunasPHFP = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'peer' AND table_name = 'PagamentoHasFormaPagamento'
    `);
    console.log('\n📋 Colunas em PagamentoHasFormaPagamento:');
    colunasPHFP.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // Verificar Pagamento
    const colunasPagamento = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'peer' AND table_name = 'Pagamento'
    `);
    console.log('\n📋 Colunas em Pagamento:');
    colunasPagamento.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // Verificar Produto
    const colunasProduto = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'peer' AND table_name = 'Produto'
    `);
    console.log('\n📋 Colunas em Produto:');
    colunasProduto.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // Verificar PedidoHasProduto
    const colunasPhp = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'peer' AND table_name = 'PedidoHasProduto'
    `);
    console.log('\n📋 Colunas em PedidoHasProduto:');
    colunasPhp.rows.forEach(c => console.log(`  - ${c.column_name}`));

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

inspecionarSchema();
