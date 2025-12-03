/**
 * Dashboard - Script para carregar e exibir relatórios
 * Faz requisições aos endpoints da API de relatórios
 * e popula os KPIs, gráficos e tabelas
 */

const API_BASE_URL = 'http://localhost:3001/api/relatorios';

// Instâncias dos gráficos
let chartUltimos7 = null;
let chartFormasPagamento = null;

/**
 * Formata número como moeda brasileira
 */
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Faz requisição à API
 */
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.sucesso) {
      throw new Error(data.erro || 'Erro ao buscar dados');
    }
    return data.dados;
  } catch (error) {
    console.error(`Erro ao buscar ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Carrega e exibe o resumo geral (KPIs)
 */
async function carregarResumo() {
  try {
    console.log('Carregando resumo...');
    const dados = await fetchAPI('/resumo');
    
    // Atualiza KPIs
    document.getElementById('kpi-total-pedidos').textContent = 
      dados.totalPedidos || 0;
    document.getElementById('kpi-clientes').textContent = 
      dados.clientesUnicos || 0;
    document.getElementById('kpi-faturamento').textContent = 
      formatarMoeda(dados.faturamentoTotal || 0);
    document.getElementById('kpi-ticket-medio').textContent = 
      formatarMoeda(dados.ticketMedio || 0);
    document.getElementById('kpi-vendas-hoje').textContent = 
      formatarMoeda(dados.vendasHoje || 0);
    document.getElementById('kpi-vendas-mes').textContent = 
      formatarMoeda(dados.vendaeMes || 0);
    document.getElementById('kpi-pedidos-hoje').textContent = 
      dados.pedidosHoje || 0;
    
    console.log('✓ Resumo carregado');
  } catch (error) {
    console.error('Erro ao carregar resumo:', error);
  }
}

/**
 * Carrega e exibe o gráfico dos últimos 7 dias
 */
async function carregarUltimos7Dias() {
  try {
    console.log('Carregando últimos 7 dias...');
    const dados = await fetchAPI('/ultimos-7-dias');
    
    if (!dados || dados.length === 0) {
      console.warn('Nenhum dado para últimos 7 dias');
      return;
    }

    // Prepara dados para o gráfico
    const labels = dados.map(d => d.dataLabel);
    const values = dados.map(d => d.totalVendas);

    // Destroy gráfico anterior se existir
    if (chartUltimos7) {
      chartUltimos7.destroy();
    }

    // Cria novo gráfico
    const ctx = document.getElementById('chart-ultimos-7').getContext('2d');
    chartUltimos7 = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vendas (R$)',
          data: values,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              }
            }
          }
        }
      }
    });

    console.log('✓ Gráfico últimos 7 dias carregado');
  } catch (error) {
    console.error('Erro ao carregar últimos 7 dias:', error);
  }
}

/**
 * Carrega e exibe o gráfico de formas de pagamento
 */
async function carregarFormasPagamento() {
  try {
    console.log('Carregando formas de pagamento...');
    const dados = await fetchAPI('/formas-pagamento');
    
    if (!dados || dados.length === 0) {
      console.warn('Nenhum dado para formas de pagamento');
      return;
    }

    // Prepara dados para o gráfico
    const labels = dados.map(d => d.nomeFormaPagamento);
    const values = dados.map(d => d.totalPago);
    const cores = [
      '#3498db', '#2ecc71', '#f39c12', '#e74c3c',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];

    // Destroy gráfico anterior se existir
    if (chartFormasPagamento) {
      chartFormasPagamento.destroy();
    }

    // Cria novo gráfico de pizza
    const ctx = document.getElementById('chart-formas-pagamento').getContext('2d');
    chartFormasPagamento = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: cores.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = formatarMoeda(context.parsed);
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });

    console.log('✓ Gráfico formas de pagamento carregado');
  } catch (error) {
    console.error('Erro ao carregar formas de pagamento:', error);
  }
}

/**
 * Carrega e exibe a tabela de produtos populares
 */
async function carregarProdutosPopulares() {
  try {
    console.log('Carregando produtos populares...');
    const dados = await fetchAPI('/produtos-populares?limite=10');
    
    const tbody = document.getElementById('tbody-produtos-populares');
    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading">Nenhum produto vendido</td></tr>';
      console.warn('Nenhum produto popular');
      return;
    }

    dados.forEach(produto => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(produto.nomeProduto || '')}</td>
        <td>${produto.quantidadeVendida || 0} un.</td>
        <td>${formatarMoeda(produto.faturamento || 0)}</td>
        <td>${formatarMoeda(produto.precoMedio || 0)}</td>
      `;
      tbody.appendChild(row);
    });

    console.log('✓ Produtos populares carregados');
  } catch (error) {
    console.error('Erro ao carregar produtos populares:', error);
    const tbody = document.getElementById('tbody-produtos-populares');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Erro ao carregar</td></tr>';
  }
}

/**
 * Carrega e exibe a tabela de vendas por dia
 */
async function carregarVendasPorDia() {
  try {
    console.log('Carregando vendas por dia...');
    const dados = await fetchAPI('/vendas-por-dia');
    
    const tbody = document.getElementById('tbody-vendas-por-dia');
    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum dado de vendas</td></tr>';
      console.warn('Nenhuma venda por dia');
      return;
    }

    dados.forEach(venda => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${venda.dataFormatada || ''}</td>
        <td>${venda.numeroPedidos || 0}</td>
        <td>${formatarMoeda(venda.totalVendas || 0)}</td>
      `;
      tbody.appendChild(row);
    });

    console.log('✓ Vendas por dia carregadas');
  } catch (error) {
    console.error('Erro ao carregar vendas por dia:', error);
    const tbody = document.getElementById('tbody-vendas-por-dia');
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Erro ao carregar</td></tr>';
  }
}

/**
 * Carrega e exibe a tabela de faturamento
 */
async function carregarFaturamento() {
  try {
    console.log('Carregando faturamento...');
    const dados = await fetchAPI('/faturamento');
    
    const tbody = document.getElementById('tbody-faturamento');
    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum produto faturado</td></tr>';
      console.warn('Nenhum faturamento');
      return;
    }

    dados.forEach(fatura => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(fatura.nomeProduto || '')}</td>
        <td>${formatarMoeda(fatura.totalFaturado || 0)}</td>
        <td>${fatura.totalUnidades || 0} un.</td>
      `;
      tbody.appendChild(row);
    });

    console.log('✓ Faturamento carregado');
  } catch (error) {
    console.error('Erro ao carregar faturamento:', error);
    const tbody = document.getElementById('tbody-faturamento');
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Erro ao carregar</td></tr>';
  }
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Carrega todos os dados do dashboard
 */
async function carregarTodosDados() {
  try {
    console.log('🔄 Iniciando carregamento do dashboard...');
    
    // Executa todas as requisições em paralelo
    await Promise.all([
      carregarResumo(),
      carregarUltimos7Dias(),
      carregarFormasPagamento(),
      carregarProdutosPopulares(),
      carregarVendasPorDia(),
      carregarFaturamento()
    ]);

    console.log('✅ Dashboard carregado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao carregar dashboard:', error);
  }
}

/**
 * Inicializa o dashboard quando a página carrega
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard inicializado');
  carregarTodosDados();

  // Recarrega os dados a cada 5 minutos (opcional)
  setInterval(carregarTodosDados, 5 * 60 * 1000);
});
