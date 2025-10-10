-- Migração: alterar FK em PagamentoHasFormaPagamento para ON DELETE CASCADE
-- Execute este script como um usuário com privilégios adequados (psql ou via ferramenta de administração)

BEGIN;

-- Remover constraint atual (nome no dump: pagamentohasformapagamento_formapagamentoidformapagamento_fkey)
ALTER TABLE IF EXISTS "PagamentoHasFormaPagamento" DROP CONSTRAINT IF EXISTS pagamentohasformapagamento_formapagamentoidformapagamento_fkey;

-- Recriar constraint com ON DELETE CASCADE
ALTER TABLE IF EXISTS "PagamentoHasFormaPagamento"
    ADD CONSTRAINT pagamentohasformapagamento_formapagamentoidformapagamento_fkey
    FOREIGN KEY ("FormaPagamentoIdFormaPagamento") REFERENCES "FormaDePagamento"("idFormaPagamento") ON DELETE CASCADE;

COMMIT;
