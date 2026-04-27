create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  github_username text,
  github_analysis jsonb,
  github_synced_at timestamptz,
  leetcode_username text,
  leetcode_analysis jsonb,
  skill_gap_analysis jsonb,
  skill_gap_synced_at timestamptz,
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

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'future' check (status in ('future', 'active', 'completed')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  current_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  update_note text not null,
  learned text,
  stats text,
  progress_percent integer check (progress_percent >= 0 and progress_percent <= 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_skills_user_created on public.skills (user_id, created_at desc);
create index if not exists idx_reflections_user_created on public.daily_reflections (user_id, created_at desc);
create index if not exists idx_checkin_tokens_lookup on public.checkin_tokens (token_hash, expires_at);
create index if not exists idx_projects_user_created on public.projects (user_id, created_at desc);
create index if not exists idx_project_updates_user_created on public.project_updates (user_id, created_at desc);
create index if not exists idx_project_updates_project_created on public.project_updates (project_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.daily_reflections enable row level security;
alter table public.checkin_tokens enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;

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

create policy "projects_select_own"
on public.projects
for select
using (auth.uid() = user_id);

create policy "projects_insert_own"
on public.projects
for insert
with check (auth.uid() = user_id);

create policy "projects_update_own"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "projects_delete_own"
on public.projects
for delete
using (auth.uid() = user_id);

create policy "project_updates_select_own"
on public.project_updates
for select
using (auth.uid() = user_id);

create policy "project_updates_insert_own"
on public.project_updates
for insert
with check (auth.uid() = user_id);

create policy "project_updates_update_own"
on public.project_updates
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "project_updates_delete_own"
on public.project_updates
for delete
using (auth.uid() = user_id);
