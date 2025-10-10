const fs = require('fs');
const path = require('path');
const { query } = require('./database');

(async () => {
  try {
    const sqlFilePath = path.join(__dirname, '../documentacao/avap2.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('Executando script SQL...');
    await query(sqlContent);
    console.log('Script SQL executado com sucesso!');
  } catch (error) {
    console.error('Erro ao executar o script SQL:', error);
  }
})();