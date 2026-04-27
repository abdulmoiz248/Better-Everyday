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

create index if not exists idx_projects_user_created on public.projects (user_id, created_at desc);
create index if not exists idx_project_updates_user_created on public.project_updates (user_id, created_at desc);
create index if not exists idx_project_updates_project_created on public.project_updates (project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.project_updates enable row level security;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

drop policy if exists "project_updates_select_own" on public.project_updates;
drop policy if exists "project_updates_insert_own" on public.project_updates;
drop policy if exists "project_updates_update_own" on public.project_updates;
drop policy if exists "project_updates_delete_own" on public.project_updates;

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
