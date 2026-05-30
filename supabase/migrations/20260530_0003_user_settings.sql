-- User settings table for customizable check-in fields, tracked areas, and review context
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checkin_fields jsonb not null default '[
    {"id": "learned", "label": "What did you learn today?", "type": "textarea", "required": true},
    {"id": "practice", "label": "What did you practice?", "type": "text", "required": false},
    {"id": "wins", "label": "What went well?", "type": "textarea", "required": false},
    {"id": "blockers", "label": "Any blockers or challenges?", "type": "textarea", "required": false}
  ]'::jsonb,
  tracked_areas jsonb not null default '[]'::jsonb,
  review_context text not null default '',
  timezone text not null default 'UTC',
  integrations jsonb not null default '{"github": false, "leetcode": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add custom_fields column to daily_reflections for flexible check-in data
alter table public.daily_reflections
  add column if not exists custom_fields jsonb default '{}'::jsonb;

-- RLS for user_settings
alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "user_settings_insert_own"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "user_settings_update_own"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
