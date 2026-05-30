# BetterEveryday Checkpoint Guide

## What is implemented

- **Google OAuth login flow** (Supabase only) via [src/components/google-login-button.tsx](src/components/google-login-button.tsx) and callback route [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts).
- **Authenticated dashboard** at [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) with:
  - add skills,
  - update status (pending / learning / completed),
  - skill history list,
  - recent daily reflections,
  - **streak tracking (consecutive days with check-ins)**,
  - **weekly metrics (depth, consistency, variety scores)**.
- **Project tracking module** in dashboard with:
  - future projects backlog,
  - active project progress + stats updates,
  - learning notes per update,
  - complete project history timeline.
- **Universal Growth Customization**:
  - **Customizable check-in questions** (configured in settings and dynamically rendered on the check-in form).
  - **Custom Tracked Areas** (user-defined categories for skill gap analysis and keyword matching).
  - **Custom Review Context** (users define their own profile context, e.g. "pre-med student" or "jazz musician", which shapes the AI weekly feedback).
  - **Optional Integrations** (GitHub and LeetCode sync are optional toggles in settings, preventing developer-centric checks for general users).
- **Optional GitHub analysis** inside the dashboard that infers languages and skills from public repos.
- **Flexible Skill gap detection module** that combines:
  - GitHub activity signals (if connected),
  - LeetCode solved distribution + topic coverage (if connected),
  - Custom tracked areas match,
  - reflection/project text patterns,
  and returns weakness insights like avoidance streaks (e.g. "avoiding Jazz Theory for N days").
- **Streak system** that tracks consecutive days with completed check-ins:
  - increments on each day's checkin submission,
  - resets if a day is missed,
  - displays longest and current streak on dashboard.
- **Weekly brutal reviews** powered by LLM (Gemini or Groq):
  - runs automatically after week-end,
  - calculates depth/consistency/variety scores,
  - generates harsh, honest feedback via LLM guided by your custom focus context,
  - displays feedback prominently on dashboard,
  - persisted in `public.weekly_reviews` table.
- **Flexible weekly metrics calculation** in [src/lib/metrics.ts](src/lib/metrics.ts):
  - **Depth**: ratio of medium/hard problems solved vs easy (if LeetCode connected) or estimated from focus, active skills, and projects progress (if LeetCode is not connected).
  - **Consistency**: % of days with check-in submissions (target 100%).
  - **Variety**: count of unique topic areas touched/practiced.
- **Brutal Review generator** in [src/lib/brutal-review.ts](src/lib/brutal-review.ts):
  - uses Gemini or Groq LLM,
  - generates weekly reflection asking uncomfortable questions,
  - deterministic fallback if LLM fails,
  - embeds 1.01^365 vs 0.99^365 philosophy.
- **Enhanced daily check-in emails** sent at **11 PM Pakistani Time** via GitHub Actions:
  - includes current streak in subject/body,
  - shows yesterday's reflection for context,
  - uses GitHub Actions cron (UTC 16:00 = PKT 11 PM),
  - setup in [.github/workflows/daily-checkin-cron.yml](.github/workflows/daily-checkin-cron.yml).
- **Server actions** for skill CRUD, project updates, check-in submission, and settings updates.
- **Public, tokenized daily check-in link** at [src/app/check-in/[token]/page.tsx](src/app/check-in/[token]/page.tsx):
  - no login required,
  - single-use,
  - expires after 24 hours.
- **Daily check-in email send endpoint** at [src/app/api/daily-checkin/send/route.ts](src/app/api/daily-checkin/send/route.ts) protected by `CRON_SECRET`.
- Token and email helpers in [src/lib/checkin.ts](src/lib/checkin.ts).
- Supabase server/browser/admin clients in [src/lib/supabase](src/lib/supabase).
- Environment template in [.env.example](.env.example).

## Required setup steps

1. Create a Supabase project.
2. In Supabase Auth:
   - enable Google provider,
   - add redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback`.
3. Run SQL migrations:
   - Run SQL from [supabase/schema.sql](supabase/schema.sql)
   - Run SQL from [supabase/migrations/20260530_0003_user_settings.sql](supabase/migrations/20260530_0003_user_settings.sql)
4. Copy [.env.example](.env.example) to `.env.local` and fill values.
5. Start app with `npm run dev`.

## Migrations

- Baseline schema is in [supabase/schema.sql](supabase/schema.sql).
- Future edits should go in [supabase/migrations` as new SQL migration files.
- Keep `schema.sql` and the latest migration state aligned when making structural database changes.
- New migrations:
  - `supabase/migrations/20260424_0002_projects.sql`
  - `supabase/migrations/20260530_0003_user_settings.sql` (implements universal customization features).

### SMTP values for daily emails (Nodemailer)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CHECKIN_FROM_EMAIL`

### LLM configuration

Place the following in `.env.local`:

```
GEMINI_API_KEY=<your key from Google AI Studio>
GROQ_API_KEY=<your key from Groq Console>
LLM_PROVIDER=gemini  # or groq (default: gemini)
```

- **Gemini 2.0 Flash API** (default provider):
  - Used for initial harsh review generation.
  - Get free API key from [Google AI Studio](https://aistudio.google.com).
  - Model: `gemini-2.0-flash`.
  
- **Groq Mixtral 8x7b** (fallback provider):
  - Faster inference, used if Gemini fails.
  - Get free API key from [Groq Console](https://console.groq.com).
  - Model: `mixtral-8x7b-32768`.

- **Fallback Strategy**:
  - Try primary provider (Gemini by default).
  - If fails, try secondary provider.
  - If both fail, generate deterministic harsh review.

## Daily email scheduling

The system automatically triggers daily at **11 PM Pakistan Standard Time (PKT)** via GitHub Actions.

To manually test or adjust timing:

- Endpoint: `POST ${NEXT_PUBLIC_APP_URL}/api/daily-checkin/send`
- Header: `Authorization: Bearer ${CRON_SECRET}`
- GitHub Actions workflow: [.github/workflows/daily-checkin-cron.yml](.github/workflows/daily-checkin-cron.yml)
  - Cron: `0 16 * * *` (4 PM UTC = 11 PM PKT)
  - Sends check-in emails with streak badge + yesterday's reflection snippet
  - Error tracking per user, aggregated in response

To set up via GitHub Actions:

1. Push the repo to GitHub.
2. Go to Settings → Secrets and variables → Actions.
3. Add these repo secrets:
   - `SUPABASE_SERVICE_ROLE_KEY` (from [.env.local](.env.local))
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CHECKIN_FROM_EMAIL`
   - `CRON_SECRET` (from [.env.local](.env.local))
   - `NEXT_PUBLIC_APP_URL` (e.g., `https://yourdomain.com`)
   - `GEMINI_API_KEY`, `GROQ_API_KEY`, `LLM_PROVIDER`

4. The workflow will run automatically at 4 PM UTC daily.

## Notes for future prompts

- Keep auth provider Google-only unless explicitly changed.
- Keep check-in links public but strictly token-bound and 24-hour expiry.
- Preserve RLS model in [supabase/schema.sql](supabase/schema.sql).
- Prefer extending `src/app/actions` for dashboard mutations.
- Skill-gap detection is flexible: tracks user-defined areas matching reflection/project keywords, and optionally combines GitHub + LeetCode activity if enabled.
- Streak system is critical path: do not break the daily check-in → streak update flow.
- LLM provider abstraction allows swapping Gemini/Groq; always include fallback for resilience.
- Weekly metrics (Depth/Consistency/Variety) are computed server-side; dashboard displays them if `weekly_reviews` record exists.
