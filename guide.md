# BetterEveryday Checkpoint Guide

## What is implemented

- Google OAuth login flow (Supabase only) via [src/components/google-login-button.tsx](src/components/google-login-button.tsx) and callback route [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts).
- Authenticated dashboard at [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) with:
  - add skills,
  - update status (pending / learning / completed),
  - skill history list,
  - recent daily reflections,
  - **streak tracking (consecutive days with check-ins)**,
  - **weekly analytics (depth, consistency, variety scores)**.
- Project tracking module in dashboard with:
  - future projects backlog,
  - active project progress + stats updates,
  - learning notes per update,
  - complete project history timeline.
- GitHub analysis inside the dashboard that infers languages and skills from public repos.
- Skill gap detection module in dashboard that combines:
  - GitHub activity signals,
  - LeetCode solved distribution + topic coverage,
  - reflection/project text patterns,
  and returns weakness insights like avoidance streaks (e.g. graphs not practiced for N days).
- **Streak system** that tracks consecutive days with completed check-ins:
  - increments on each day's checkin submission,
  - resets if a day is missed,
  - displays longest and current streak on dashboard.
- **Weekly brutal reviews** powered by LLM (Gemini or Groq):
  - runs automatically after week-end,
  - calculates depth/consistency/variety scores,
  - generates harsh, honest feedback via LLM,
  - displays feedback prominently on dashboard,
  - persisted in `public.weekly_reviews` table.
- **Daily metrics calculation** in [src/lib/metrics.ts](src/lib/metrics.ts):
  - Depth: ratio of medium/hard problems solved vs easy,
  - Consistency: % of days with check-in submissions,
  - Variety: count of unique topic areas touched.
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
- New migration added: [supabase/migrations/20260424_0002_projects.sql](supabase/migrations/20260424_0002_projects.sql).

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

### LeetCode + skill-gap analysis

- Add a LeetCode username in the same dashboard analysis form (optional but recommended).
- LeetCode analysis uses public GraphQL endpoints and does not require a private API key.
- Skill-gap analysis is persisted in `profiles.skill_gap_analysis` and includes:
  - tracked area coverage (`Dynamic Programming`, `Graphs`, `System Design`),
  - difficulty-mix checks (easy-heavy warning),
  - topic-coverage checks (e.g. low DP exposure),
  - concrete recommendations.
- Refresh action updates GitHub + LeetCode analysis (when usernames are saved) and recomputes the skill-gap output.

### Streak system

- Automatically tracks consecutive days with completed check-ins
- Increments on each day's `submitDailyCheckin()` call
- Resets to 1 if a day is skipped
- Persisted in `profiles.current_streak` and `profiles.longest_streak`
- Updated in UTC so check-in before midnight UTC preserves the streak

### Weekly brutal reviews (LLM-powered)

- Configured in [src/lib/brutal-review.ts](src/lib/brutal-review.ts)
- Runs after user completes weekly reflection form or via scheduled trigger
- Computes three weekly metrics:
  - **Depth**: % of medium/hard problems solved (target 40-60%)
  - **Consistency**: % of days with check-in submissions (target 100%)
  - **Variety**: count of unique topic areas practiced
- Generates harsh, honest weekly feedback via Gemini or Groq LLM
- Asks uncomfortable questions: "Why did you waste time?", "What are you avoiding?", "Really a priority?"
- Persisted in `weekly_reviews` table with `llm_feedback` field
- Fallback: If both LLM providers fail, generates deterministic harsh review
- Philosophy: 1.01^365 = 37.8x growth vs 0.99^365 = 0.03x decay

### LLM configuration

Place the following in `.env.local`:

```
GEMINI_API_KEY=<your key from Google AI Studio>
GROQ_API_KEY=<your key from Groq Console>
LLM_PROVIDER=gemini  # or groq (default: gemini)
```

- **Gemini 2.0 Flash API** (default provider):
  - Used for initial harsh review generation
  - Get free API key from [Google AI Studio](https://aistudio.google.com)
  - Model: `gemini-2.0-flash`
  
- **Groq Mixtral 8x7b** (fallback provider):
  - Faster inference, used if Gemini fails
  - Get free API key from [Groq Console](https://console.groq.com)
  - Model: `mixtral-8x7b-32768`

- **Fallback Strategy**:
  - Try primary provider (Gemini by default)
  - If fails, try secondary provider
  - If both fail, generate deterministic harsh review

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

1. Push the repo to GitHub
2. Go to Settings → Secrets and variables → Actions
3. Add these repo secrets:
   - `SUPABASE_SERVICE_ROLE_KEY` (from [.env.local](.env.local))
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CHECKIN_FROM_EMAIL`
   - `CRON_SECRET` (from [.env.local](.env.local))
   - `NEXT_PUBLIC_APP_URL` (e.g., `https://yourdomain.com`)
   - `GEMINI_API_KEY`, `GROQ_API_KEY`, `LLM_PROVIDER`

4. The workflow will run automatically at 4 PM UTC daily

## Notes for future prompts

- Keep auth provider Google-only unless explicitly changed.
- Keep check-in links public but strictly token-bound and 24-hour expiry.
- Preserve RLS model in [supabase/schema.sql](supabase/schema.sql).
- Prefer extending [src/app/actions.ts](src/app/actions.ts) for dashboard mutations.
- Skill-gap detection is deterministic (GitHub + LeetCode + reflection signals) now enhanced with LLM-based harsh weekly reviews.
- Streak system is critical path: do not break the daily check-in → streak update flow.
- LLM provider abstraction allows swapping Gemini/Groq; always include fallback for resilience.
- Weekly metrics (Depth/Consistency/Variety) are computed server-side; dashboard displays them if `weekly_reviews` record exists.
