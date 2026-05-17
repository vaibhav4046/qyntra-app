-- Qyntra Supabase schema
-- Run this in Supabase SQL editor: https://supabase.com/dashboard/project/afqtlwasbxpmkbpsdoyw/sql

-- =====================================================
-- EXTENSIONS
-- =====================================================
create extension if not exists "uuid-ossp";
-- pgvector for embeddings (optional, enable when ready for semantic search)
-- create extension if not exists vector;

-- =====================================================
-- PROFILES (one row per signed-in user)
-- =====================================================
create table if not exists public.profiles (
  id text primary key,                  -- NextAuth user id (provider:sub)
  email text unique,
  name text,
  image text,
  provider text,                        -- google | notion | github | slack | linkedin
  demo_mode boolean default false,      -- when true, /api/chat falls back to demo data
  onboarded boolean default false,      -- skipped or completed wizard
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- CONNECTORS (per user)
-- =====================================================
create table if not exists public.connectors (
  id uuid primary key default uuid_generate_v4(),
  user_id text references public.profiles(id) on delete cascade,
  provider text not null,               -- drive | notion | gmail | slack | github | linkedin | desktop | arxiv
  is_on boolean default false,
  access_token text,                    -- encrypted via Vault (use Supabase Vault in prod)
  refresh_token text,
  item_count integer default 0,
  last_sync timestamptz,
  created_at timestamptz default now(),
  unique (user_id, provider)
);

-- =====================================================
-- FILES (per-user knowledge nodes)
-- =====================================================
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id text references public.profiles(id) on delete cascade,
  source text not null,                 -- drive | notion | gmail | slack | github | linkedin | desktop | manual
  source_id text,                       -- external id from provider
  source_url text,
  kind text default 'DOC',              -- PAGE | DOC | ENTITY | CLAIM | EMAIL | THREAD
  title text,
  summary text,
  content text,                         -- raw text body
  tags text[],
  -- embedding vector(1536),            -- enable when pgvector extension is on
  last_modified timestamptz,
  created_at timestamptz default now()
);

create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_source_idx on public.files(source);

-- =====================================================
-- MESSAGES (chat history)
-- =====================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  user_id text references public.profiles(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_user_id_idx on public.messages(user_id, created_at desc);

-- =====================================================
-- ROW-LEVEL SECURITY
-- =====================================================
alter table public.profiles    enable row level security;
alter table public.connectors  enable row level security;
alter table public.files       enable row level security;
alter table public.messages    enable row level security;

-- API server uses service_role key → bypasses RLS.
-- Browser uses anon key + JWT with user_id claim → policies below enforce isolation.

-- Profiles: user can read/update only their own row
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select
  using (auth.jwt() ->> 'sub' = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
  using (auth.jwt() ->> 'sub' = id);

-- Connectors: user sees only their own
drop policy if exists "connectors self all" on public.connectors;
create policy "connectors self all" on public.connectors for all
  using (auth.jwt() ->> 'sub' = user_id);

-- Files: user sees only their own
drop policy if exists "files self all" on public.files;
create policy "files self all" on public.files for all
  using (auth.jwt() ->> 'sub' = user_id);

-- Messages: user sees only their own
drop policy if exists "messages self all" on public.messages;
create policy "messages self all" on public.messages for all
  using (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- TRIGGER: bump updated_at on profile changes
-- =====================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =====================================================
-- OAUTH_STATES (temporary CSRF / state storage for custom OAuth flows)
-- =====================================================
create table if not exists public.oauth_states (
  state text primary key,
  provider text not null,
  user_id text references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists oauth_states_user_id_idx on public.oauth_states(user_id);
create index if not exists oauth_states_created_at_idx on public.oauth_states(created_at);

-- Auto-cleanup old states after 10 minutes
create or replace function public.delete_old_oauth_states()
returns trigger language plpgsql as $$
begin
  delete from public.oauth_states where created_at < now() - interval '10 minutes';
  return new;
end $$;

drop trigger if exists oauth_states_cleanup on public.oauth_states;
create trigger oauth_states_cleanup
  after insert on public.oauth_states
  execute function public.delete_old_oauth_states();
