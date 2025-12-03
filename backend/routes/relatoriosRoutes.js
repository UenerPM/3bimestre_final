const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

/**
 * Rotas de Relatórios
 * GET /api/relatorios/resumo - resumo geral de vendas
 * GET /api/relatorios/vendas-por-dia - vendas agrupadas por dia (últimos 30 dias)
 * GET /api/relatorios/produtos-populares - ranking de produtos mais vendidos
 * GET /api/relatorios/faturamento - faturamento por produto
 * GET /api/relatorios/formas-pagamento - vendas por forma de pagamento
 * GET /api/relatorios/ultimos-7-dias - últimos 7 dias para gráfico
 * GET /api/relatorios/vendas-por-hora - vendas por hora do dia
 * GET /api/relatorios/vendas-por-dia-semana - vendas por dia da semana
 */

// Resumo geral
router.get('/resumo', relatorioController.getResumo);

// Vendas por dia
router.get('/vendas-por-dia', relatorioController.getVendasPorDia);

// Produtos populares
router.get('/produtos-populares', relatorioController.getProdutosMaisVendidos);

// Faturamento
router.get('/faturamento', relatorioController.getFaturamento);

// Formas de pagamento
router.get('/formas-pagamento', relatorioController.getVendasPorFormaPagamento);

// Últimos 7 dias
router.get('/ultimos-7-dias', relatorioController.getUltimos7Dias);

// Vendas por hora
router.get('/vendas-por-hora', relatorioController.getVendasPorHora);

// Vendas por dia da semana
router.get('/vendas-por-dia-semana', relatorioController.getVendasPorDiaSemana);

module.exports = router;
