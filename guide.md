# BetterEveryday Checkpoint Guide

## What is implemented

- Google OAuth login flow (Supabase only) via [src/components/google-login-button.tsx](src/components/google-login-button.tsx) and callback route [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts).
- Authenticated dashboard at [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) with:
  - add skills,
  - update status (pending / learning / completed),
  - skill history list,
  - recent daily reflections,
  - basic analytics cards.
- GitHub analysis inside the dashboard that infers languages and skills from public repos.
- Server actions in [src/app/actions.ts](src/app/actions.ts) for skill CRUD-like updates and check-in submission.
- Public, tokenized daily check-in link at [src/app/check-in/[token]/page.tsx](src/app/check-in/[token]/page.tsx):
  - no login required,
  - single-use,
  - expires after 24 hours.
- Daily check-in email send endpoint at [src/app/api/daily-checkin/send/route.ts](src/app/api/daily-checkin/send/route.ts) protected by `CRON_SECRET`.
- Token and email helpers in [src/lib/checkin.ts](src/lib/checkin.ts).
- Supabase server/browser/admin clients in [src/lib/supabase](src/lib/supabase).
- Environment template in [.env.example](.env.example).

## Required setup steps

1. Create a Supabase project.
2. In Supabase Auth:
   - enable Google provider,
   - add redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback`.
3. Run SQL from [supabase/schema.sql](supabase/schema.sql).
4. Copy [.env.example](.env.example) to `.env.local` and fill values.
5. Start app with `npm run dev`.

## Migrations

- Baseline schema is in [supabase/schema.sql](supabase/schema.sql).
- Future edits should go in [supabase/migrations](supabase/migrations) as new SQL migration files.
- Keep `schema.sql` and the latest migration state aligned when making structural database changes.
- If you use the Supabase CLI, create new migrations instead of editing old applied ones.

### SMTP values for daily emails (Nodemailer)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CHECKIN_FROM_EMAIL`

### GitHub analysis

- Add a GitHub username in the dashboard.
- Optional: set `GITHUB_TOKEN` for higher API rate limits.
- Analysis uses public repository metadata to infer likely languages and skills.

## Daily email scheduling

Call this endpoint once daily from a scheduler (Supabase cron, GitHub Actions, or any cron service):

- `POST ${NEXT_PUBLIC_APP_URL}/api/daily-checkin/send`
- Header: `Authorization: Bearer ${CRON_SECRET}`

## Notes for future prompts

- Keep auth provider Google-only unless explicitly changed.
- Keep check-in links public but strictly token-bound and 24-hour expiry.
- Preserve RLS model in [supabase/schema.sql](supabase/schema.sql).
- Prefer extending [src/app/actions.ts](src/app/actions.ts) for dashboard mutations.
