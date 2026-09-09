-- ============================================================================
-- CONECTA COMUNIDADE — SCHEMA
-- Execute este arquivo primeiro no SQL Editor do Supabase (Project > SQL Editor).
-- Depois execute policies.sql e, opcionalmente, seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — espelha auth.users com os dados que a aplicação usa
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público de cada usuário, criado automaticamente no cadastro.';

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  category text not null check (
    category in (
      'cultura', 'esportes', 'educacao', 'musica',
      'acoes_sociais', 'meio_ambiente', 'lazer', 'outros'
    )
  ),
  event_date date not null,
  event_time time not null,
  location text not null,
  neighborhood text not null,
  address text,
  is_free boolean not null default true,
  price numeric(10, 2) check (price is null or price > 0),
  image_url text,
  capacity integer check (capacity is null or capacity > 0),
  organizer_name text not null,
  contact text,
  status text not null default 'published' check (status in ('published', 'removed')),
  interest_count integer not null default 0,
  favorite_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_required_when_paid check (is_free = true or price is not null)
);

create index events_category_idx on public.events (category);
create index events_event_date_idx on public.events (event_date);
create index events_user_id_idx on public.events (user_id);
create index events_status_idx on public.events (status);
create index events_neighborhood_idx on public.events (neighborhood);

comment on table public.events is 'Eventos comunitários publicados pelos usuários.';
comment on column public.events.interest_count is 'Contador desnormalizado, mantido pelo trigger handle_interest_change.';
comment on column public.events.favorite_count is 'Contador desnormalizado, mantido pelo trigger handle_favorite_change.';

-- ----------------------------------------------------------------------------
-- interests ("Tenho interesse")
-- ----------------------------------------------------------------------------
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index interests_event_id_idx on public.interests (event_id);

-- ----------------------------------------------------------------------------
-- favorites
-- ----------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index favorites_event_id_idx on public.favorites (event_id);

-- ----------------------------------------------------------------------------
-- reports (denúncias)
-- ----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  reason text not null check (
    reason in (
      'informacao_falsa', 'spam', 'conteudo_inadequado',
      'evento_inexistente', 'outro'
    )
  ),
  description text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);
create index reports_event_id_idx on public.reports (event_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Cria automaticamente um profile quando um novo usuário se cadastra no
-- Supabase Auth. O nome vem do metadata enviado no signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém updated_at sempre atualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Mantém events.interest_count sincronizado com a tabela interests
create or replace function public.handle_interest_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.events set interest_count = interest_count + 1 where id = new.event_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.events set interest_count = greatest(interest_count - 1, 0) where id = old.event_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_interest_change
  after insert or delete on public.interests
  for each row execute function public.handle_interest_change();

-- Mantém events.favorite_count sincronizado com a tabela favorites
create or replace function public.handle_favorite_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.events set favorite_count = favorite_count + 1 where id = new.event_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.events set favorite_count = greatest(favorite_count - 1, 0) where id = old.event_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_favorite_change
  after insert or delete on public.favorites
  for each row execute function public.handle_favorite_change();
