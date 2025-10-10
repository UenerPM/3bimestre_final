const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '21514518',
  database: 'avap2',
  ssl: false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Search path a ser aplicado nas conexões (padroniza schema usado nas queries)
const searchPath = 'peer, public';


// Pool de conexões para melhor performance
const pool = new Pool({
  ...dbConfig,
  max: 10,
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso!');

    // Definir o search_path
    await client.query('SET search_path TO ' + searchPath);
    client.release();
    return true;
  } catch (err) {
    console.error('Erro ao conectar com o PostgreSQL:', err);
    return false;
  }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    // Definir o search_path antes de executar a query
    await client.query('SET search_path TO ' + searchPath);
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO ' + searchPath);

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Retorna um client do pool com search_path configurado para uso manual (transações customizadas)
const getClient = async () => {
  const client = await pool.connect();
  await client.query('SET search_path TO ' + searchPath);
  return client;
};

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  testConnection
};