const fs = require('fs');
const path = require('path');
const { query } = require('./database');

(async () => {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const file = '20251204_add_funcionario_ativo.sql';
    const fullPath = path.join(migrationsDir, file);
    if (!fs.existsSync(fullPath)) {
      console.error('Arquivo de migração não encontrado:', fullPath);
      process.exit(1);
    }
    console.log('Executando migração:', file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    await query(sql);
    console.log('Migração concluída:', file);
  } catch (err) {
    console.error('Erro ao executar migração:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
})();