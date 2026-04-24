create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'learning', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learned_today text not null,
  leetcode_question text,
  blockers text,
  wins text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkin_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  sent_to_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_skills_user_created on public.skills (user_id, created_at desc);
create index if not exists idx_reflections_user_created on public.daily_reflections (user_id, created_at desc);
create index if not exists idx_checkin_tokens_lookup on public.checkin_tokens (token_hash, expires_at);

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.daily_reflections enable row level security;
alter table public.checkin_tokens enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "skills_select_own"
on public.skills
for select
using (auth.uid() = user_id);

create policy "skills_insert_own"
on public.skills
for insert
with check (auth.uid() = user_id);

create policy "skills_update_own"
on public.skills
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "skills_delete_own"
on public.skills
for delete
using (auth.uid() = user_id);

create policy "reflections_select_own"
on public.daily_reflections
for select
using (auth.uid() = user_id);

create policy "reflections_insert_own"
on public.daily_reflections
for insert
with check (auth.uid() = user_id);

create policy "tokens_select_own"
on public.checkin_tokens
for select
using (auth.uid() = user_id);

create policy "tokens_insert_own"
on public.checkin_tokens
for insert
with check (auth.uid() = user_id);

create policy "tokens_update_own"
on public.checkin_tokens
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
