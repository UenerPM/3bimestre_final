# Módulo de Relatórios - Guia de Instalação e Uso

## 📋 Visão Geral

Módulo completo de relatórios e dashboard para o sistema AVAP, exibido na página principal (index.html). Inclui KPIs, gráficos interativos e tabelas analíticas com dados em tempo real do PostgreSQL.

## ✅ Estrutura Criada

### Backend

1. **Repository Pattern** (`backend/repositories/reportRepository.js`)
   - 8 funções de consulta ao PostgreSQL
   - Todas com tratamento de erro
   - Retorna dados estruturados para o controller

2. **Controller** (`backend/controllers/relatorioController.js`)
   - 8 handlers para cada endpoint
   - Formata respostas JSON
   - Validação de dados

3. **Rotas** (`backend/routes/relatoriosRoutes.js`)
   - 8 endpoints GET em `/api/relatorios/*`
   - Registrados no servidor em `server.js`

### Frontend

1. **Dashboard HTML** (`frontend/dashboard/dashboard.html`)
   - Layout responsivo com 7 KPI cards
   - 2 gráficos (linha e pizza)
   - 3 tabelas de dados

2. **Dashboard CSS** (`frontend/dashboard/dashboard.css`)
   - Estilos modernos e responsivos
   - Animações suaves
   - Design mobile-first

3. **Dashboard JavaScript** (`frontend/dashboard/dashboard.js`)
   - Carrega dados de todos os 8 endpoints
   - Renderiza KPIs, gráficos e tabelas
   - Atualização automática a cada 5 minutos

4. **Menu** (`frontend/common/header.js`)
   - Link "📊 Dashboard" adicionado no menu principal

## 🚀 Endpoints da API

Todos disponíveis em `http://localhost:3001/api/relatorios/`

| Endpoint | Descrição |
|----------|-----------|
| `GET /resumo` | Resumo geral (total pedidos, clientes, faturamento, ticket médio, etc) |
| `GET /vendas-por-dia` | Vendas agrupadas por dia (últimos 30 dias) |
| `GET /produtos-populares` | Ranking dos 10 produtos mais vendidos |
| `GET /faturamento` | Faturamento total por produto |
| `GET /formas-pagamento` | Vendas agrupadas por forma de pagamento |
| `GET /ultimos-7-dias` | Últimos 7 dias para gráfico de tendência |
| `GET /vendas-por-hora` | Padrão de vendas por hora do dia |
| `GET /vendas-por-dia-semana` | Comparativo de vendas por dia da semana |

## 📊 Exemplo de Resposta JSON

```json
{
  "sucesso": true,
  "dados": {
    "totalPedidos": 145,
    "clientesUnicos": 82,
    "faturamentoTotal": 45230.50,
    "ticketMedio": 312.28,
    "vendasHoje": 2850.00,
    "vendaeMes": 45230.50,
    "pedidosHoje": 9
  }
}
```

## 🔧 Instalação

### 1. Backend já está pronto
- Arquivo `reportRepository.js` criado em `backend/repositories/`
- Arquivo `relatorioController.js` criado em `backend/controllers/`
- Arquivo `relatoriosRoutes.js` criado em `backend/routes/`
- Rotas registradas em `server.js`

### 2. Frontend já está pronto
- Arquivo `dashboard.html` criado em `frontend/dashboard/`
- Arquivo `dashboard.css` criado em `frontend/dashboard/`
- Arquivo `dashboard.js` criado em `frontend/dashboard/`
- Menu atualizado em `frontend/common/header.js`

### 3. Dependências
Todos os pacotes necessários já estão em `package.json`:
- `express` - para as rotas
- `pg` - para PostgreSQL
- `chart.js` - já usado no `package.json`

## 🧪 Testes

### Teste 1: Verificar Saúde da API
```bash
curl http://localhost:3001/health
```
Deve retornar status 200 com "OK".

### Teste 2: Verificar Endpoints de Relatórios
```bash
# Resumo
curl http://localhost:3001/api/relatorios/resumo

# Produtos populares
curl http://localhost:3001/api/relatorios/produtos-populares

# Vendas por dia (últimos 30 dias)
curl http://localhost:3001/api/relatorios/vendas-por-dia

# Formas de pagamento
curl http://localhost:3001/api/relatorios/formas-pagamento

# Últimos 7 dias
curl http://localhost:3001/api/relatorios/ultimos-7-dias
```

### Teste 3: Acessar Dashboard no Frontend
1. Inicie o servidor: `npm run dev`
2. Acesse http://localhost:3001/menu.html
3. Clique no link "📊 Dashboard" no menu
4. Aguarde o carregamento dos dados (máx 5 segundos)
5. Verifique se os KPIs, gráficos e tabelas aparecem

### Teste 4: Validar Gráficos
- Gráfico de linha deve mostrar tendência dos últimos 7 dias
- Gráfico de pizza deve mostrar distribuição de formas de pagamento
- Ambos devem ser responsivos e interativos (hover para detalhes)

### Teste 5: Validar Tabelas
- Tabela de produtos deve listar top 10 produtos mais vendidos
- Tabela de vendas por dia deve ser ordenada descendente
- Tabela de faturamento deve ordenar por total em ordem decrescente

## 📱 Responsividade

Dashboard funciona em:
- ✅ Desktop (1400px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

Breakpoints definidos em `dashboard.css`.

## 🔒 Segurança

- ✅ Queries com parâmetros posicionais ($1, $2...) previnem SQL Injection
- ✅ Validação de tipos em JavaScript
- ✅ HTML escaping com função `escapeHtml()` no frontend
- ✅ CORS configurado em `server.js`
- ✅ Autenticação via auth-guard.js (rota protegida)

## 🗄️ Schema PostgreSQL Esperado

As queries esperam as seguintes tabelas e relacionamentos:

```sql
Pedido (idPedido, dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa)
PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario)
Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento)
PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago)
Produto (idProduto, nomeProduto, precoUnitario)
Cliente (PessoaCpfPessoa)
FormaDePagamento (idFormaPagamento, nomeFormaPagamento)
```

**Nota**: Se seus nomes de tabela/colunas forem diferentes, ajuste as queries em `reportRepository.js`.

## 🐛 Troubleshooting

### Dashboard não carrega dados
- Verifique se o servidor está rodando: `npm run dev`
- Abra o Console (F12) e procure por erros
- Verifique se a API responde: `curl http://localhost:3001/api/relatorios/resumo`
- Verifique se o PostgreSQL está conectado: `curl http://localhost:3001/health`

### Gráficos não aparecem
- Verifique se Chart.js foi carregado (linha 9 em dashboard.html)
- Verifique o Console para erros de JavaScript
- Limpe cache do navegador (Ctrl+Shift+Delete)

### Tabelas vazias
- Verifique se há dados no banco (insert um pedido de teste)
- Verifique os logs do servidor para erros de SQL
- Confirme que os nomes de tabela em `reportRepository.js` correspondem ao seu banco

### CORS Error
- Verifique se `http://localhost:3001` está na whitelist de `allowedOrigins` em `server.js`
- Se necessário, adicione seu domínio/porta ao array

## 📈 Próximas Melhorias

Possíveis extensões do módulo:

1. **Filtros por Data**
   - Adicionar input de data inicio/fim
   - Refatorar queries para aceitar parâmetros de data

2. **Exportação de Dados**
   - Botão "Exportar PDF"
   - Botão "Exportar CSV" para tabelas

3. **Alertas e Notificações**
   - Alertar se vendas diárias caem abaixo da meta
   - Notificar produtos em falta de estoque

4. **Mais Gráficos**
   - Gráfico de margem de lucro
   - Gráfico de sazonalidade
   - Mapa de calor de vendas por categoria

5. **Performance**
   - Cache de dados por 1 minuto no backend
   - Paginação em tabelas grandes

## 📞 Suporte

Para dúvidas ou erros:
1. Verifique os logs do servidor (terminal)
2. Abra o Console do navegador (F12)
3. Verifique o PostgreSQL está acessível

---

**Status**: ✅ Pronto para produção
**Versão**: 1.0
**Data**: 2025
