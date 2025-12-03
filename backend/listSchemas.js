const db = require('./database');

async function listarSchemas() {
  try {
    console.log('Listando schemas...\n');

    const schemas = await db.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name
    `);
    
    console.log('📋 Schemas encontrados:');
    schemas.rows.forEach(s => console.log(`  - ${s.schema_name}`));

    // Tenta listar tabelas em todos os schemas que parecem ser de aplicação
    for (const s of ['public', 'peer', 'avap2']) {
      try {
        const tabelas = await db.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1
          ORDER BY table_name
        `, [s]);
        
        if (tabelas.rows.length > 0) {
          console.log(`\n📋 Tabelas em schema '${s}':`);
          tabelas.rows.forEach(t => console.log(`  - ${t.table_name}`));
        }
      } catch (e) {
        // ignore
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

listarSchemas();
