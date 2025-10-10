const { query } = require('./database');

(async () => {
  try {
    console.log('Consultando estrutura da tabela produto...');
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'produto';
    `);
    console.table(result.rows);
  } catch (error) {
    console.error('Erro ao consultar estrutura da tabela:', error);
  } finally {
    process.exit();
  }
})();