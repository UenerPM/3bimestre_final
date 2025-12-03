const db = require('./database');

async function inspecionarColunas() {
  try {
    console.log('Inspecionando colunas das tabelas...\n');

    const tabelas = ['formadepagamento', 'pagamento', 'pagamentohaspormadepagamento', 'produto', 'pedidohasproduto', 'pedido'];

    for (const tabela of tabelas) {
      const colunas = await db.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tabela]);
      
      if (colunas.rows.length > 0) {
        console.log(`📋 ${tabela.toUpperCase()}:`);
        colunas.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
        console.log();
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

inspecionarColunas();
