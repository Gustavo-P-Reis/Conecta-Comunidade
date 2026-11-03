-- ============================================================================
-- CONECTA COMUNIDADE - MIGRAÇÃO 001: cidade e região dos eventos  (PARTE 1 de 2)
--
-- Incremental e re-executável: só ADICIONA duas colunas, uma restrição e uma
-- permissão por coluna. Não apaga, não recria e não altera nenhum dado, tabela
-- ou policy existente. Compatível com o código ANTIGO e com o NOVO (as colunas
-- são opcionais), então pode ser aplicada ANTES de publicar o código novo.
--
-- Como aplicar: painel do Supabase > SQL Editor > New query > colar tudo > Run.
-- Ordem recomendada: (1) esta migração; (2) publicar o código novo na Vercel;
--                    (3) opcionalmente, a 002 (reforço no banco).
-- ============================================================================

-- 0) Pré-condição: a tabela events precisa existir (schema.sql e policies.sql já aplicados).
do $$
begin
  if to_regclass('public.events') is null then
    raise exception 'Tabela public.events não encontrada. Rode schema.sql e policies.sql antes desta migração.';
  end if;
end
$$;

-- 1) Colunas novas, ANULÁVEIS: eventos antigos ficam com NULL ("Não informada").
--    city   : 'sao_paulo' ou 'outra'
--    region : só quando city = 'sao_paulo'
alter table public.events add column if not exists city text;
alter table public.events add column if not exists region text;

-- 2) Restrição de integridade (criada somente se ainda não existir).
--    Aceita: (a) eventos antigos, sem cidade e sem região;
--            (b) São Paulo com uma das 5 regiões;
--            (c) "Outra cidade" sem região.
--    Cada ramo começa com "city is not null" de propósito: um CHECK só recusa quando
--    a expressão é FALSA (NULL passa), então isso evita aceitar, por exemplo, uma
--    região preenchida sem cidade.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_geo_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_geo_check check (
        (city is null and region is null)
        or (
          city is not null and city = 'sao_paulo'
          and region is not null
          and region in ('centro', 'zona_norte', 'zona_sul', 'zona_leste', 'zona_oeste')
        )
        or (city is not null and city = 'outra' and region is null)
      );
  end if;
end
$$;

-- 3) Permissão por coluna. O policies.sql libera o UPDATE do papel "authenticated"
--    coluna a coluna; sem este grant, editar cidade/região falharia com "permission denied".
--    (GRANT é idempotente.)
grant update (city, region) on public.events to authenticated;

-- 4) Pede à API do Supabase (PostgREST) para recarregar o schema e enxergar as colunas novas.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- CONFERÊNCIA (somente leitura) - rode DEPOIS, em uma consulta separada:
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'events'
--      and column_name in ('city', 'region');                 -- 2 linhas, ambas YES
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint where conname = 'events_geo_check';   -- 1 linha
--
--   select column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'events'
--      and grantee = 'authenticated' and privilege_type = 'UPDATE'
--      and column_name in ('city', 'region');                 -- 2 linhas
--
--   select count(*) as total, count(city) as com_cidade, count(region) as com_regiao
--     from public.events;      -- com_cidade e com_regiao = 0 até alguém classificar
-- ----------------------------------------------------------------------------
-- REVERTER (só se necessário; NÃO apaga colunas nem dados):
--   alter table public.events drop constraint if exists events_geo_check;
--   revoke update (city, region) on public.events from authenticated;
-- Se reverter, volte também ao código anterior. As colunas podem ficar sem uso
-- (removê-las apagaria a classificação já feita).
-- ----------------------------------------------------------------------------
