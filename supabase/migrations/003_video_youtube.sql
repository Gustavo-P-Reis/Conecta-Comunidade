-- ============================================================================
-- CONECTA COMUNIDADE - MIGRAÇÃO 003: vídeo de apresentação do evento (ID do YouTube)
--
-- Incremental e re-executável: só ADICIONA uma coluna anulável, uma restrição e uma
-- permissão por coluna. Não apaga, não recria e não altera nenhum dado, tabela ou policy
-- existente (inclui as da classificação regional: migrações 001 e 002).
-- Compatível com o código ANTIGO e com o NOVO (a coluna é opcional), então pode ser
-- aplicada ANTES de publicar o código novo.
--
-- Guarda SOMENTE o ID do vídeo (11 caracteres), nunca o arquivo nem a URL original.
--
-- Como aplicar: painel do Supabase > SQL Editor > New query > colar tudo > Run.
-- Ordem recomendada: (1) esta migração; (2) publicar o código novo na Vercel; (3) testar.
-- ============================================================================

-- 0) Pré-condição: a tabela events precisa existir (schema.sql e policies.sql já aplicados).
do $$
begin
  if to_regclass('public.events') is null then
    raise exception 'Tabela public.events não encontrada. Rode schema.sql e policies.sql antes desta migração.';
  end if;
end
$$;

-- 1) Coluna nova, ANULÁVEL: eventos existentes ficam com NULL (sem vídeo).
alter table public.events add column if not exists youtube_video_id text;

-- 2) Restrição: NULL (sem vídeo) ou um ID de exatamente 11 caracteres [A-Za-z0-9_-].
--    Criada somente se ainda não existir. Eventos antigos (NULL) continuam válidos.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_youtube_video_id_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_youtube_video_id_check
      check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$');
  end if;
end
$$;

-- 3) Permissão por coluna. O policies.sql libera o UPDATE do papel "authenticated"
--    coluna a coluna; sem este grant, salvar/remover o vídeo na edição falharia com
--    "permission denied". (GRANT é idempotente.)
--    INSERT não precisa de grant: o policies.sql só revoga UPDATE; o INSERT continua por
--    tabela (confirme com a consulta de conferência abaixo). As policies de RLS são por
--    linha e já cobrem a coluna nova.
grant update (youtube_video_id) on public.events to authenticated;

-- 4) Pede à API do Supabase (PostgREST) para recarregar o schema e enxergar a coluna nova.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- CONFERÊNCIA (somente leitura) - rode DEPOIS, em uma consulta separada:
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'events'
--      and column_name = 'youtube_video_id';                  -- 1 linha: text, YES
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint where conname = 'events_youtube_video_id_check';   -- 1 linha
--
--   select column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'events'
--      and grantee = 'authenticated' and privilege_type = 'UPDATE'
--      and column_name = 'youtube_video_id';                  -- 1 linha
--
--   select has_table_privilege('authenticated', 'public.events', 'INSERT');  -- true
--
--   select count(*) as total, count(youtube_video_id) as com_video
--     from public.events;       -- com_video = 0 até alguém cadastrar um vídeo
-- ----------------------------------------------------------------------------
-- REVERTER (só se necessário; NÃO apaga a coluna nem dados):
--   alter table public.events drop constraint if exists events_youtube_video_id_check;
--   revoke update (youtube_video_id) on public.events from authenticated;
-- Se reverter, volte também ao código anterior. A coluna pode ficar sem uso
-- (removê-la apagaria os vídeos já cadastrados).
-- ----------------------------------------------------------------------------
