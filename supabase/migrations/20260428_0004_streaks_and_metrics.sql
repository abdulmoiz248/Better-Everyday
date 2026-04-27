-- Add streak tracking and weekly review to profiles
alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists streak_last_updated timestamptz,
  add column if not exists last_weekly_review_date timestamptz;

-- New table for weekly review data
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  total_hours numeric,
  problems_solved integer,
  skills_improved text[],
  missed_days integer,
  depth_score numeric,
  consistency_score numeric,
  variety_score numeric,
  brutal_reflection text,
  llm_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start_date)
);

create index if not exists idx_weekly_reviews_user_created on public.weekly_reviews (user_id, created_at desc);

alter table public.weekly_reviews enable row level security;

create policy "weekly_reviews_select_own"
on public.weekly_reviews
for select
using (auth.uid() = user_id);

create policy "weekly_reviews_insert_own"
on public.weekly_reviews
for insert
with check (auth.uid() = user_id);

create policy "weekly_reviews_update_own"
on public.weekly_reviews
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
