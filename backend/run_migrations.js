const fs = require('fs');
const path = require('path');
const { query } = require('./database');

(async () => {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      console.log('Executando migração:', file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await query(sql);
      console.log('Migração concluída:', file);
    }

    console.log('Todas as migrações executadas com sucesso.');
  } catch (err) {
    console.error('Erro ao executar migrações:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
})();
