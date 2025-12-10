-- Migration: add 'ativo' column to funcionario for soft-delete
BEGIN;

ALTER TABLE funcionario
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- Ensure existing rows are marked as active
UPDATE funcionario SET ativo = true WHERE ativo IS NULL;

COMMIT;
