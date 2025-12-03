# CRUD Pessoa — Consolidação Cliente + Funcionário

Resumo rápido

- O CRUD `pessoa` agora unifica as funcionalidades de Cliente e Funcionário no frontend.
- As páginas antigas `frontend/cliente/*` e `frontend/funcionario/*` foram transformadas em stubs que redirecionam para `frontend/pessoa/pessoa.html`.
- O `header` foi atualizado para não mostrar links separados de Cliente/Funcionário; use `Pessoa` no menu.

Motivação e impacto

- Evita duplicação de código e inconsistências entre CRUDs.
- Mantém compatibilidade: as páginas antigas redirecionam para evitar 404s até que referências externas sejam atualizadas.

Arquivos principais alterados

- `frontend/pessoa/pessoa.html` — CRUD unificado (listagem, buscar por CPF, incluir, alterar, excluir).
- `frontend/pessoa/pessoa.js` — Lógica principal do CRUD Pessoa.
- `frontend/common/header.js` — Menu atualizado (Cliente/Funcionário consolidados em Pessoa).
- `frontend/cliente/*` e `frontend/funcionario/*` — convertidos em páginas/stubs e CSS reduzido para compatibilidade.

Boas práticas e próximos passos (backend)

1. Backend: recomenda-se expor endpoints consolidados sob `/pessoa` e adaptar `cliente`/`funcionario` para trabalhar com recursos derivados (por exemplo, `funcionario` pode continuar existindo como relação/role vinculada a uma `pessoa`).
2. Deprecate os endpoints `/cliente` e `/funcionario` apenas após garantir que não há consumidores externos.
3. Migrar validações e regras específicas (ex: salário, cargo) para endpoints especializados que referenciem `pessoa` por CPF.
4. Atualizar documentação da API (routes/controllers) indicando as novas rotas e payloads.

Como reverter (se necessário)

- Restaurar os arquivos originais a partir do controle de versão (git). Os stubs não removem dados; apenas redirecionam o usuário.

Notas técnicas

- O frontend `pedido` foi atualizado para usar `/pessoa` como fonte de pessoas para os selects de cliente/funcionário.
- Mantivemos redirecionamentos leves para minimizar risco em deploys.

Contato

Se desejar, eu posso continuar e:
- Atualizar backend (controllers/routes) para consolidar permanentemente `/cliente` e `/funcionario` em `/pessoa`.
- Remover completamente os arquivos antigos quando todos os consumidores estiverem atualizados.
