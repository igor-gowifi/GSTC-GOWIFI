BEGIN;

ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS solic_agendamento_responsavel_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS solic_agendamento_responsavel_nome text;

CREATE INDEX IF NOT EXISTS solicitacoes_agendamento_responsavel_idx
  ON public.solicitacoes (solic_agendamento_responsavel_id)
  WHERE solic_agendamento_responsavel_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
