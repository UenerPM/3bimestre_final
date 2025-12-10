const reportRepository = require('../repositories/reportRepository');

/**
 * Controller para endpoints de relatórios
 * Retorna dados JSON formatados para o dashboard
 */

// GET /api/relatorios/resumo
async function getResumo(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getResumo({ startDate, endDate });
    res.status(200).json({
      sucesso: true,
      dados: {
        totalPedidos: parseInt(data.total_pedidos || 0),
        clientesUnicos: parseInt(data.clientes_unicos || 0),
        faturamentoTotal: parseFloat(data.faturamento_total || 0),
        ticketMedio: parseFloat(data.ticket_medio || 0),
        vendasHoje: parseFloat(data.vendas_hoje || 0),
        vendaeMes: parseFloat(data.vendas_mes || 0),
        pedidosHoje: parseInt(data.pedidos_hoje || 0)
      }
    });
  } catch (err) {
    console.error('Erro no controller getResumo:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter resumo de vendas'
    });
  }
}

// GET /api/relatorios/vendas-por-dia
async function getVendasPorDia(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getVendasPorDia({ startDate, endDate });
    const formatado = data.map(row => ({
      data: row.data,
      dataFormatada: row.data_formatada,
      numeroPedidos: parseInt(row.numero_pedidos || 0),
      totalVendas: parseFloat(row.total_vendas || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getVendasPorDia:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter vendas por dia'
    });
  }
}

// GET /api/relatorios/produtos-populares
async function getProdutosMaisVendidos(req, res) {
  try {
    const limite = req.query.limite || 10;
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getProdutosMaisVendidos(parseInt(limite), { startDate, endDate });
    const formatado = data.map(row => ({
      idProduto: parseInt(row.idproduto || row.idProduto || 0),
      nomeProduto: row.nomeproduto || row.nomeProduto || '',
      quantidadeVendida: parseInt(row.quantidade_vendida || 0),
      faturamento: parseFloat(row.faturamento || 0),
      precoMedio: parseFloat(row.preco_medio || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getProdutosMaisVendidos:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter produtos populares'
    });
  }
}

// GET /api/relatorios/faturamento
async function getFaturamento(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getFaturamento({ startDate, endDate });
    const formatado = data.map(row => ({
      idProduto: parseInt(row.idproduto || row.idProduto || 0),
      nomeProduto: row.nomeproduto || row.nomeProduto || '',
      totalFaturado: parseFloat(row.total_faturado || 0),
      totalUnidades: parseInt(row.total_unidades || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getFaturamento:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter faturamento'
    });
  }
}

// GET /api/relatorios/formas-pagamento
async function getVendasPorFormaPagamento(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getVendasPorFormaPagamento({ startDate, endDate });
    const formatado = data.map(row => ({
      idFormaPagamento: parseInt(row.idformapagamento || row.idFormaPagamento || 0),
      nomeFormaPagamento: row.nomeformapagamento || row.nomeFormaPagamento || '',
      numeroTransacoes: parseInt(row.numero_transacoes || 0),
      totalPago: parseFloat(row.total_pago || 0),
      valorMedio: parseFloat(row.valor_medio || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getVendasPorFormaPagamento:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter vendas por forma de pagamento'
    });
  }
}

// GET /api/relatorios/ultimos-7-dias
async function getUltimos7Dias(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportRepository.getUltimos7Dias({ startDate, endDate });
    const formatado = data.map(row => ({
      data: row.data,
      dataLabel: row.data_label,
      diaSemana: parseInt(row.dia_semana || 0),
      numeroPedidos: parseInt(row.numero_pedidos || 0),
      totalVendas: parseFloat(row.total_vendas || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getUltimos7Dias:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter dados dos últimos 7 dias'
    });
  }
}

// GET /api/relatorios/vendas-por-hora
async function getVendasPorHora(req, res) {
  try {
    const data = await reportRepository.getVendasPorHora();
    const formatado = data.map(row => ({
      hora: parseInt(row.hora || 0),
      numeroPedidos: parseInt(row.numero_pedidos || 0),
      totalVendas: parseFloat(row.total_vendas || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getVendasPorHora:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter vendas por hora'
    });
  }
}

// GET /api/relatorios/vendas-por-dia-semana
async function getVendasPorDiaSemana(req, res) {
  try {
    const data = await reportRepository.getVendasPorDiaSemana();
    const formatado = data.map(row => ({
      diaSemana: parseInt(row.dia_semana || 0),
      nomeDia: row.nome_dia || '',
      numeroPedidos: parseInt(row.numero_pedidos || 0),
      totalVendas: parseFloat(row.total_vendas || 0)
    }));
    res.status(200).json({
      sucesso: true,
      dados: formatado
    });
  } catch (err) {
    console.error('Erro no controller getVendasPorDiaSemana:', err);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter vendas por dia da semana'
    });
  }
}

module.exports = {
  getResumo,
  getVendasPorDia,
  getProdutosMaisVendidos,
  getFaturamento,
  getVendasPorFormaPagamento,
  getUltimos7Dias,
  getVendasPorHora,
  getVendasPorDiaSemana
};
