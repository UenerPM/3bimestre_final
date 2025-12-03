const http = require('http');

const BASE_URL = 'http://localhost:3001/api/relatorios';

function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testarEndpoints() {
  console.log('🧪 Iniciando testes dos endpoints de relatórios...\n');

  const endpoints = [
    { path: '/resumo', nome: 'Resumo Geral' },
    { path: '/vendas-por-dia', nome: 'Vendas por Dia' },
    { path: '/produtos-populares', nome: 'Produtos Populares' },
    { path: '/faturamento', nome: 'Faturamento' },
    { path: '/formas-pagamento', nome: 'Formas de Pagamento' },
    { path: '/ultimos-7-dias', nome: 'Últimos 7 Dias' },
    { path: '/vendas-por-hora', nome: 'Vendas por Hora' },
    { path: '/vendas-por-dia-semana', nome: 'Vendas por Dia da Semana' }
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchAPI(`${BASE_URL}${endpoint.path}`);

      if (res.status === 200 && res.data.sucesso) {
        console.log(`✅ ${endpoint.nome}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Dados retornados: ${Array.isArray(res.data.dados) ? res.data.dados.length : 'objeto'}`);
        if (Array.isArray(res.data.dados) && res.data.dados.length > 0) {
          console.log(`   Primeira linha: ${JSON.stringify(res.data.dados[0]).substring(0, 100)}...`);
        } else if (typeof res.data.dados === 'object') {
          console.log(`   Dados: ${JSON.stringify(res.data.dados).substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${endpoint.nome}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Resposta: ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.nome}`);
      console.log(`   Erro: ${error.message}`);
    }
    console.log();
  }

  console.log('✅ Testes finalizados!');
  console.log('💡 Dica: Acesse http://localhost:3001/dashboard/dashboard.html para ver o dashboard completo');
  process.exit(0);
}

testarEndpoints().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
