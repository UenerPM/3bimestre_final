const { query } = require('../database');

/**
 * Repository para consultas de relatórios
 * Todas as funções retornam dados estruturados do banco PostgreSQL
 */

// Resumo geral: vendas dia, mês, total de pedidos, clientes únicos, ticket médio
async function getResumo() {
  try {
    const resultado = await query(`
      SELECT 
        COUNT(DISTINCT pd.idpedido) as total_pedidos,
        COUNT(DISTINCT pd.clientepessoacpfpessoa) as clientes_unicos,
        COALESCE(SUM(pg.valortotalpagamento), 0) as faturamento_total,
        COALESCE(AVG(pg.valortotalpagamento), 0) as ticket_medio,
        COALESCE(SUM(CASE WHEN DATE(pd.datadopedido) = CURRENT_DATE THEN pg.valortotalpagamento ELSE 0 END), 0) as vendas_hoje,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', pd.datadopedido)::date = DATE_TRUNC('month', CURRENT_DATE)::date THEN pg.valortotalpagamento ELSE 0 END), 0) as vendas_mes,
        COUNT(DISTINCT CASE WHEN DATE(pd.datadopedido) = CURRENT_DATE THEN pd.idpedido END) as pedidos_hoje
      FROM pedido pd
      LEFT JOIN pagamento pg ON pd.idpedido = pg.pedidoidpedido
    `);
    return resultado.rows[0] || {};
  } catch (err) {
    console.error('Erro ao buscar resumo:', err);
    throw new Error('Erro ao buscar resumo de vendas');
  }
}

// Vendas agrupadas por dia (últimos 30 dias)
async function getVendasPorDia() {
  try {
    const resultado = await query(`
      SELECT 
        DATE(pd.datadopedido) as data,
        TO_CHAR(DATE(pd.datadopedido), 'DD/MM/YYYY') as data_formatada,
        COUNT(pd.idpedido) as numero_pedidos,
        COALESCE(SUM(pg.valortotalpagamento), 0) as total_vendas
      FROM pedido pd
      LEFT JOIN pagamento pg ON pd.idpedido = pg.pedidoidpedido
      WHERE DATE(pd.datadopedido) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(pd.datadopedido)
      ORDER BY DATE(pd.datadopedido) DESC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar vendas por dia:', err);
    throw new Error('Erro ao buscar vendas por dia');
  }
}

// Produtos mais vendidos (ranking)
async function getProdutosMaisVendidos(limite = 10) {
  try {
    const resultado = await query(`
      SELECT 
        p.idproduto,
        p.nomeproduto,
        SUM(php.quantidade) as quantidade_vendida,
        COALESCE(SUM(php.quantidade * php.precounitario), 0) as faturamento,
        ROUND(COALESCE(AVG(php.precounitario), 0), 2) as preco_medio
      FROM produto p
      LEFT JOIN pedidohasproduto php ON p.idproduto = php.produtoidproduto
      LEFT JOIN pedido pd ON php.pedidoidpedido = pd.idpedido
      GROUP BY p.idproduto, p.nomeproduto
      HAVING SUM(php.quantidade) > 0
      ORDER BY quantidade_vendida DESC
      LIMIT $1
    `, [limite]);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar produtos mais vendidos:', err);
    throw new Error('Erro ao buscar ranking de produtos');
  }
}

// Faturamento por produto
async function getFaturamento() {
  try {
    const resultado = await query(`
      SELECT 
        p.idproduto,
        p.nomeproduto,
        COALESCE(SUM(php.quantidade * php.precounitario), 0) as total_faturado,
        SUM(php.quantidade) as total_unidades
      FROM produto p
      LEFT JOIN pedidohasproduto php ON p.idproduto = php.produtoidproduto
      GROUP BY p.idproduto, p.nomeproduto
      ORDER BY total_faturado DESC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar faturamento:', err);
    throw new Error('Erro ao buscar faturamento por produto');
  }
}

// Vendas por forma de pagamento
async function getVendasPorFormaPagamento() {
  try {
    const resultado = await query(`
      SELECT 
        fp.idformapagamento,
        fp.nomeformapagamento,
        COUNT(DISTINCT pg.pedidoidpedido) as numero_transacoes,
        COALESCE(SUM(pg.valortotalpagamento), 0) as total_pago,
        COALESCE(ROUND(AVG(pg.valortotalpagamento), 2), 0) as valor_medio
      FROM formadepagamento fp
      LEFT JOIN pagamento pg ON fp.idformapagamento = pg.forma_pagamento_id
      GROUP BY fp.idformapagamento, fp.nomeformapagamento
      ORDER BY total_pago DESC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar vendas por forma de pagamento:', err);
    throw new Error('Erro ao buscar vendas por forma de pagamento');
  }
}

// Últimos 7 dias (para gráfico)
async function getUltimos7Dias() {
  try {
    const resultado = await query(`
      SELECT 
        DATE(pd.datadopedido) as data,
        TO_CHAR(DATE(pd.datadopedido), 'DD/MM') as data_label,
        EXTRACT(DOW FROM DATE(pd.datadopedido)) as dia_semana,
        COUNT(pd.idpedido) as numero_pedidos,
        COALESCE(SUM(pg.valortotalpagamento), 0) as total_vendas
      FROM pedido pd
      LEFT JOIN pagamento pg ON pd.idpedido = pg.pedidoidpedido
      WHERE DATE(pd.datadopedido) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(pd.datadopedido)
      ORDER BY DATE(pd.datadopedido) ASC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar últimos 7 dias:', err);
    throw new Error('Erro ao buscar histórico dos últimos 7 dias');
  }
}

// Vendas por hora do dia (análise de padrão)
async function getVendasPorHora() {
  try {
    const resultado = await query(`
      SELECT 
        EXTRACT(HOUR FROM pd.datadopedido) as hora,
        COUNT(pd.idpedido) as numero_pedidos,
        COALESCE(SUM(pg.valortotalpagamento), 0) as total_vendas
      FROM pedido pd
      LEFT JOIN pagamento pg ON pd.idpedido = pg.pedidoidpedido
      WHERE DATE(pd.datadopedido) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM pd.datadopedido)
      ORDER BY hora ASC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar vendas por hora:', err);
    throw new Error('Erro ao buscar vendas por hora');
  }
}

// Vendas por dia da semana
async function getVendasPorDiaSemana() {
  try {
    const resultado = await query(`
      SELECT 
        EXTRACT(DOW FROM DATE(pd.datadopedido))::int as dia_semana,
        CASE 
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 0 THEN 'Domingo'
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 1 THEN 'Segunda'
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 2 THEN 'Terça'
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 3 THEN 'Quarta'
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 4 THEN 'Quinta'
          WHEN EXTRACT(DOW FROM DATE(pd.datadopedido))::int = 5 THEN 'Sexta'
          ELSE 'Sábado'
        END as nome_dia,
        COUNT(pd.idpedido) as numero_pedidos,
        COALESCE(SUM(pg.valortotalpagamento), 0) as total_vendas
      FROM pedido pd
      LEFT JOIN pagamento pg ON pd.idpedido = pg.pedidoidpedido
      WHERE DATE(pd.datadopedido) >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY EXTRACT(DOW FROM DATE(pd.datadopedido))
      ORDER BY dia_semana ASC
    `);
    return resultado.rows;
  } catch (err) {
    console.error('Erro ao buscar vendas por dia da semana:', err);
    throw new Error('Erro ao buscar vendas por dia da semana');
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
