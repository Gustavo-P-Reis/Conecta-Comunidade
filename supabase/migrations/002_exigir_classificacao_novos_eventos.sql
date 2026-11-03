-- ============================================================================
-- CONECTA COMUNIDADE - MIGRAÇÃO 002: exigir classificação em NOVOS eventos  (PARTE 2 de 2)
--
-- REFORÇO OPCIONAL no banco. Rode SOMENTE DEPOIS de:
--   (a) aplicar a migração 001; e
--   (b) publicar o código novo e confirmar que criar um evento funciona.
-- Motivo: o código antigo não envia cidade/região; com esta policy ativa, ele não
-- conseguiria publicar eventos.
--
-- O que faz: cria UMA policy RESTRITIVA, só para INSERT do papel "authenticated", que
-- recusa evento novo sem cidade. Policies restritivas somam-se (AND) às permissivas já
-- existentes, então a regra "só insere como si mesmo" (user_id = auth.uid()) continua valendo.
-- Junto com o CHECK da 001, "cidade preenchida" já garante uma combinação cidade/região válida.
--
-- O que NÃO afeta: leitura, UPDATE, DELETE, eventos antigos (continuam com cidade nula),
-- triggers e funções admin (security definer), o SQL Editor/seed (papel postgres) e a
-- service_role (ignoram RLS). A validação do app (Zod) continua sendo a primeira barreira;
-- esta policy só impede que alguém pule o app e insira direto pela API.
-- Re-executável: só cria se ainda não existir; nenhuma policy existente é alterada.
-- ============================================================================

do $$
begin
  if to_regclass('public.events') is null then
    raise exception 'Tabela public.events não encontrada.';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'events'
      and column_name in ('city', 'region')
  ) < 2 then
    raise exception 'Colunas city/region não encontradas. Rode a migração 001 antes desta.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_geo_check'
      and conrelid = 'public.events'::regclass
  ) then
    raise exception 'Restrição events_geo_check não encontrada. Rode a migração 001 antes desta.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Novos eventos exigem classificação geográfica'
  ) then
    create policy "Novos eventos exigem classificação geográfica"
      on public.events
      as restrictive
      for insert
      to authenticated
      with check (city is not null);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- CONFERÊNCIA (somente leitura):
--   select policyname, permissive, cmd, roles from pg_policies
--    where schemaname = 'public' and tablename = 'events' order by policyname;
--   -- a nova policy aparece como RESTRICTIVE / INSERT; as demais continuam iguais.
-- ----------------------------------------------------------------------------
-- REVERTER (remove só esta policy, sem tocar em dados):
--   drop policy if exists "Novos eventos exigem classificação geográfica" on public.events;
-- ----------------------------------------------------------------------------
