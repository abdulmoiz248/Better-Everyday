# BetterEveryday

A personal growth operating system built with **Next.js 16**, **Supabase**, and optional developer integrations.

BetterEveryday helps users track daily progress, maintain streaks, run skill/project workflows, detect growth gaps, and receive weekly AI-generated “brutal reviews” based on real activity data.

---

## Core Idea

BetterEveryday is built around one principle:

- **Small daily actions compound** (`1.01^365` vs `0.99^365`).

The product turns this principle into a full loop:

1. Log daily check-ins.
2. Track skills and projects.
3. Detect consistency and blind spots.
4. Generate weekly hard-truth feedback.
5. Repeat with better focus.

---

## What the App Does

### 1) Authentication and User Access
- Google OAuth sign-in via Supabase Auth.
- Protected dashboard routes.
- Public token-based check-in links (single-use, 24-hour expiry).

### 2) Daily Check-in System
- Users can request check-in links by email.
- Daily cron endpoint sends reminders automatically.
- Check-in submissions:
  - validate token,
  - store reflection,
  - mark token used,
  - update streak metrics.

### 3) Skill Tracking
- Add and update skills with status:
  - `pending`
  - `learning`
  - `completed`
- Skill data is used for dashboard stats and analytics.

### 4) Project Tracking
- Manage project lifecycle:
  - `future`
  - `active`
  - `completed`
- Log progress updates with notes, learnings, and stats.

### 5) Weekly Review + Metrics
- Weekly metrics are computed from activity:
  - **Depth** (challenge/focus quality)
  - **Consistency** (check-in frequency)
  - **Variety** (topic diversity)
- AI generates a direct weekly review using Gemini or Groq.
- Fallback deterministic review is generated if LLM calls fail.

### 6) Skill-Gap Analysis
- Combines signals from:
  - skills,
  - daily reflections,
  - project updates,
  - optional GitHub and LeetCode data.
- Detects possible avoidance patterns and weak areas.
- Returns prioritized insights + recommendations.

### 7) User Customization
- Fully customizable check-in fields.
- Custom tracked areas and aliases.
- Personalized review context for AI feedback.
- Optional integration toggles (GitHub / LeetCode).
- Configurable timezone setting.

---

## Architecture Overview

### Frontend / App Layer
- **Next.js App Router** in `src/app`.
- Server components for dashboards and data fetch.
- Server Actions for authenticated mutations.
- Client components for interactive editors/forms.

### Backend / Data Layer
- **Supabase Postgres** with Row Level Security (RLS).
- Supabase server/admin clients in `src/lib/supabase`.
- SQL schema + migrations in `/supabase`.

### Automation Layer
- GitHub Actions workflow (`.github/workflows/daily-checkin-cron.yml`) runs:
  - daily check-in reminder emails,
  - weekly review generation.

### Intelligence Layer
- `src/lib/metrics.ts` for weekly metric scoring.
- `src/lib/skill-gap.ts` for weakness detection.
- `src/lib/brutal-review.ts` for LLM review generation.

---

## Repository Structure

```text
src/
  app/
    actions.ts                    # core server actions
    actions/
      settings.ts                 # settings persistence actions
      weekly-review.ts            # weekly review compute/save
    api/
      daily-checkin/send/route.ts # cron-triggered email sender
      weekly-review/generate/route.ts # user/admin review generation
    auth/                         # OAuth callback + signout
    check-in/[token]/page.tsx     # public check-in form
    dashboard/                    # app pages (overview, skills, projects, etc.)
  components/                     # reusable UI components
  lib/
    brutal-review.ts              # LLM feedback + fallback
    checkin.ts                    # token + email logic
    github.ts                     # GitHub profile analysis
    leetcode.ts                   # LeetCode profile analysis
    metrics.ts                    # weekly score calculations
    skill-gap.ts                  # gap/coverage analysis
    supabase/                     # supabase client config
    types.ts                      # shared type contracts

supabase/
  schema.sql                      # baseline schema + RLS policies
  migrations/                     # incremental SQL migrations

.github/workflows/
  daily-checkin-cron.yml          # scheduling automation
```

---

## Data Model (High Level)

Core tables:

- `profiles`
- `skills`
- `daily_reflections`
- `checkin_tokens`
- `projects`
- `project_updates`
- `weekly_reviews`
- `user_settings`

Security model:

- RLS is enabled for user-owned data tables.
- Access policies enforce `auth.uid() = user_id` for normal app operations.
- Admin operations use service role where required (cron/background operations).

---

## Environment Variables

Create a local env file (`.env.local`) and set:

### Required Core
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

### Email (for check-in delivery)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CHECKIN_FROM_EMAIL`

### AI Review Providers
- `LLM_PROVIDER` (`gemini` default, optional `groq`)
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

### Optional Developer Integration
- `GITHUB_TOKEN` (improves GitHub API limits)

---

## Local Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Configure Supabase project and Google OAuth provider.
3. Apply SQL schema/migrations from `/supabase`.
4. Add env variables in `.env.local`.
5. Run development server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`.

---

## Scripts

- `npm run dev` – Start local dev server.
- `npm run build` – Create production build.
- `npm run start` – Run production server.
- `npm run lint` – Run ESLint.

---

## Core Product Flows

### Flow A: Daily Check-in
1. User receives email link.
2. Opens tokenized form.
3. Submits custom check-in fields.
4. App stores reflection + consumes token.
5. Streak is incremented/reset based on recency.

### Flow B: Weekly Review
1. User triggers review (or cron runs weekly job).
2. System fetches week activity data.
3. Metrics are calculated.
4. AI generates direct feedback.
5. Review is upserted into `weekly_reviews`.

### Flow C: Analytics and Gaps
1. User syncs optional integrations.
2. App aggregates internal + external signals.
3. Skill-gap engine creates insights + recommendations.
4. Dashboard surfaces bottlenecks and next actions.

---

## API Endpoints

### `POST /api/daily-checkin/send`
- Purpose: send daily check-in emails to users.
- Auth: requires ****** from `CRON_SECRET`.

### `POST /api/weekly-review/generate`
- Purpose: generate weekly review for current authenticated user.

### `PUT /api/weekly-review/generate`
- Purpose: cron/admin batch generation for all users.
- Auth: requires ****** from `CRON_SECRET`.

---

## GitHub Actions Automation

Workflow file:
- `/home/runner/work/Better-Everyday/Better-Everyday/.github/workflows/daily-checkin-cron.yml`

Schedules:
- Daily check-in emails: `0 16 * * *` (11 PM PKT).
- Weekly review generation: `0 4 * * 1` (Monday 9 AM PKT).

Required GitHub Actions secrets mirror env variables used by cron jobs.

---

## Notes and Constraints

- Google sign-in is the primary auth flow.
- Check-in links are intentionally public but cryptographically token-bound and expiring.
- Weekly review language is intentionally strict/harsh by design.
- Integrations are optional so the app also works for non-developer growth use cases.

---

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (Auth + Postgres + RLS)
- Nodemailer
- Gemini / Groq APIs
- GitHub Actions

---

## Future Improvements (Suggested)

- Add `.env.example` template to standardize onboarding.
- Add automated tests for streak and token lifecycle logic.
- Add observability/alerting around cron endpoints.
- Add retry/backoff strategy for LLM provider outages.
