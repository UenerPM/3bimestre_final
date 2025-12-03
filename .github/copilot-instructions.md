## Visão rápida do repositório

Este repositório é um projeto didático (backend Node.js + frontend estático) para um sistema AVAP (Avaliação por Pares). Backend em Node.js/Express com acesso a PostgreSQL (via `pg`) e frontend estático servido da pasta `frontend/`.

Principais pastas:
- `backend/` – código do servidor Express, controllers, rotas e scripts auxiliares.
- `frontend/` – páginas HTML/CSS/JS estáticas usadas pelo projeto.
- `documentacao/` – scripts SQL e documentação do banco.

Ponto de entrada do servidor: `backend/server.js` (escuta na porta 3001 por padrão).

DB: A camada de acesso está em `backend/database.js` que exporta `query`, `transaction`, `getClient` e `testConnection`. O projeto usa `search_path` para fixar schemas (`peer, public`).

## Objetivo deste arquivo para agentes (20–50 linhas)

Fornecer instruções mínimas e específicas para trabalhar neste código:
- entender como o servidor é inicializado e como as rotas são registradas;
- onde encontrar controllers e rotas para adicionar ou modificar endpoints (`backend/controllers` e `backend/routes`);
- como usar a camada de acesso `database.query` e `database.transaction`/`getClient` nas alterações;
- comandos de execução locais e scripts de teste já incluídos.

### Arquitetura e fluxo de dados (resumo útil)
- O servidor configura middlewares (CORS custom, JSON parsing, cookies) e injeta a instância do DB em `req.db`.
- Rotas registradas em `server.js` importam arquivos de `backend/routes/*.js`. Cada rota delega a um controller em `backend/controllers`.
- Controllers usam `const { query } = require('../database')` e constroem SQL com parâmetros posicionais ($1, $2...). Retornam JSON e códigos HTTP apropriados (201, 204, 400, 404, 500).
- Para operações multi-step que precisam de transação, use `database.transaction(async (client) => { ... })` e execute queries via `client.query(...)`.

### Convenções do projeto (pontos importantes)
- Rotas: definidas em `backend/routes/<resource>Routes.js` e exportadas como `router`. As rotas usam path plural (ex: `/pessoa`, `/produto`).
- Controllers: cada arquivo em `backend/controllers` exporta funções expressivas (listar, criar, obter, atualizar, deletar). Nome das funções variam (ex: `listarPessoas`, `criarPessoa`).
- SQL: use parâmetros posicinais ($1, $2...) e sempre trate erros do banco. O projeto espera objetos JSON simples do frontend com nomes de campos que correspondem às colunas (ex: `nomeproduto`, `quantidadeemestoque`).
- Validação mínima: muitos controllers fazem validações ad-hoc; preserve esse estilo (checagens manuais antes do INSERT/UPDATE), e retorne mensagens de erro compatíveis com os padrões já existentes (ex: `{ error: 'Mensagem' }`).
- Logging: controllers usam `console.log`/`console.error` para depuração — manter formato semelhante facilita debugging local.

### Padrões e anti-padrões observados
- Padrão: injeção do objeto `db` em `req.db` (mas os controllers geralmente importam `database` diretamente); seja consistente: preferir importar `database` diretamente em novos controllers para ficar no padrão atual.
- Padrão: rotas RESTful simples (GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id`).
- Anti-padrão a evitar: alterar o comportamento público das rotas existentes (status codes e shape do JSON) sem atualizar frontend estático em `frontend/`.

### Comandos úteis / fluxo de desenvolvimento local
- Instalar dependências: `npm install` (ver `package.json`).
- Rodar servidor em dev: `npm run dev` (usa `nodemon server.js`).
- Rodar servidor normalmente: `npm start`.
- Testes manuais rápidos: `backend/testCRUD.js` e `backend/testPessoaCRUD.js` são scripts example que usam `node-fetch` — execute com `node backend/testCRUD.js` após iniciar o servidor.
- Health check: GET http://localhost:3001/health — usado para verificar conexão com PostgreSQL.

Observação de DB: `backend/createDatabase.js` cria o banco `avap2`. As credenciais e o DB default estão em `backend/database.js` (host, user, password, database). Alterações em produção devem tratar variáveis de ambiente — por enquanto o projeto codifica valores de dev.

### Exemplos concretos (código/arquivos de referência)
- Exemplo de controller que deve servir de modelo: `backend/controllers/produtoController.js` — segue fluxo: valida campos → `query(INSERT...)` → tratamento de erros específicos (`error.code === '23502'`, `23503`).
- Exemplo de rota: `backend/routes/produtoRoutes.js` — mostra o mapeamento padrão entre rota e controller.
- Exemplo de conexão/transactions: `backend/database.js` — use `transaction(...)` e `getClient()` quando precisar de controle manual de commits/rollbacks.

### Quando abrir PRs / como modificar com segurança
- Mantenha contratos de rota: se mudar shape de retorno ou status codes, atualize também `frontend/` (ex: `frontend/produto/produto.js`) e `backend/testCRUD.js`.
- Evite mudar a porta fixa (3001) sem necessidade; muitos scripts de teste hardcodeiam essa porta.

### Pontos de atenção de segurança e produção
- CORS está permissivo no servidor — não altere para 'allow all' sem considerar domínios específicos.
- Senhas/credentials do DB estão em `backend/database.js` (hardcoded). Em produção, migrar para variáveis de ambiente.

---

Se parte das instruções acima estiver incompleta ou se você quer que eu adicione exemplos de alteração (ex: criar nova rota + controller + frontend hookup), me diga qual recurso você quer modificar e eu gero um PR com o esqueleto e testes manuais.
