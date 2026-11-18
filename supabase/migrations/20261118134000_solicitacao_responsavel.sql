BEGIN;

ALTER TABLE public.solicitacoes
  ADD COLUMN solic_criado_por_nome text,
  ADD COLUMN solic_atribuido_a uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN solic_atribuido_a_nome text;

CREATE INDEX solicitacoes_atribuido_a_idx
  ON public.solicitacoes (solic_atribuido_a)
  WHERE solic_atribuido_a IS NOT NULL;

-- O campo histórico registra e-mail nas OS atuais e pode conter UUID em registros antigos.
UPDATE public.solicitacoes AS os
SET solic_criado_por_nome = (
  SELECT COALESCE(
    NULLIF(btrim(usuario.raw_user_meta_data ->> 'name'), ''),
    NULLIF(btrim(usuario.raw_user_meta_data ->> 'full_name'), ''),
    usuario.email
  )
  FROM auth.users AS usuario
  WHERE usuario.id::text = btrim(os.solic_criado_por::text)
     OR lower(usuario.email) = lower(btrim(os.solic_criado_por::text))
  ORDER BY (usuario.id::text = btrim(os.solic_criado_por::text)) DESC, usuario.id
  LIMIT 1
)
WHERE os.solic_criado_por IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
