-- ============================================================================
-- CONECTA COMUNIDADE — POLÍTICAS DE SEGURANÇA (RLS)
-- Execute depois de schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: verifica se um usuário é administrador, sem causar recursão de RLS
-- (por isso é security definer — ele mesmo ignora RLS ao consultar profiles).
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated, anon;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.interests enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "Usuários veem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins veem todos os perfis"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Reforço no nível de coluna: mesmo que alguém chame a API diretamente
-- (fora da UI), só é possível atualizar nome e avatar — nunca "role" ou
-- "email". A promoção a administrador só é feita manualmente no banco
-- (ver README, seção "Tornar um usuário administrador").
revoke update on public.profiles from authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
create policy "Qualquer pessoa vê eventos publicados"
  on public.events for select
  using (status = 'published');

create policy "Autores veem os próprios eventos"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Admins veem todos os eventos"
  on public.events for select
  using (public.is_admin(auth.uid()));

create policy "Usuários autenticados criam eventos"
  on public.events for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Autores editam os próprios eventos"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Autores excluem os próprios eventos"
  on public.events for delete
  using (auth.uid() = user_id);

create policy "Admins excluem qualquer evento"
  on public.events for delete
  using (public.is_admin(auth.uid()));

-- Reforço no nível de coluna: o autor pode editar o conteúdo do evento, mas
-- não pode alterar diretamente "status" (moderação) nem os contadores
-- "interest_count"/"favorite_count" (mantidos só pelos triggers). Isso evita
-- que alguém infle artificialmente a popularidade do próprio evento via API.
revoke update on public.events from authenticated;
grant update (
  title, description, category, event_date, event_time, location,
  neighborhood, address, is_free, price, image_url, capacity,
  organizer_name, contact
) on public.events to authenticated;

-- Ações de moderação (mudar "status") passam pelas functions admin_* abaixo,
-- que rodam como security definer e por isso não dependem desse grant.

-- ----------------------------------------------------------------------------
-- interests
-- ----------------------------------------------------------------------------
create policy "Usuários veem os próprios interesses"
  on public.interests for select
  using (auth.uid() = user_id);

create policy "Usuários registram interesse próprio"
  on public.interests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuários removem o próprio interesse"
  on public.interests for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- favorites
-- ----------------------------------------------------------------------------
create policy "Usuários veem os próprios favoritos"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Usuários favoritam para si mesmos"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuários removem o próprio favorito"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- reports
-- ----------------------------------------------------------------------------
create policy "Usuários autenticados podem denunciar"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins veem denúncias"
  on public.reports for select
  using (public.is_admin(auth.uid()));

-- Denúncias são atualizadas só pelas functions admin_* (security definer),
-- então nenhuma policy de UPDATE é necessária aqui.

-- ============================================================================
-- FUNCTIONS ADMINISTRATIVAS (security definer)
-- Usadas pelo painel /admin — cada uma verifica is_admin() internamente,
-- então continuam seguras mesmo chamadas fora da UI.
-- ============================================================================

create or replace function public.admin_remove_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem remover eventos.';
  end if;

  update public.events set status = 'removed' where id = p_event_id;
end;
$$;

create or replace function public.admin_resolve_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem resolver denúncias.';
  end if;

  update public.reports set status = 'resolved' where id = p_report_id;
end;
$$;

grant execute on function public.admin_remove_event(uuid) to authenticated;
grant execute on function public.admin_resolve_report(uuid) to authenticated;

-- ============================================================================
-- STORAGE — bucket de imagens dos eventos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "Leitura pública das imagens de eventos"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "Usuários autenticados enviam imagens de eventos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

create policy "Usuários atualizam as próprias imagens de eventos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-images' and owner = auth.uid());

create policy "Usuários excluem as próprias imagens de eventos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images' and owner = auth.uid());
