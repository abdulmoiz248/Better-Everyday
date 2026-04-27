alter table public.profiles
  add column if not exists leetcode_username text,
  add column if not exists leetcode_analysis jsonb,
  add column if not exists skill_gap_analysis jsonb,
  add column if not exists skill_gap_synced_at timestamptz;
