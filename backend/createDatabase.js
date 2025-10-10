const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '21514518',
};

const pool = new Pool(dbConfig);

(async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL!');

    const dbName = 'avap2';
    console.log(`Criando o banco de dados: ${dbName}`);
    await client.query(`CREATE DATABASE ${dbName}`);

    console.log(`Banco de dados ${dbName} criado com sucesso!`);
    client.release();
  } catch (error) {
    console.error('Erro ao criar o banco de dados:', error);
  } finally {
    pool.end();
  }
})();