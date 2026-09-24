# Growth Station — Feature Inventory

Practical inventory of features as they exist in source
(`C:\Global Hackathon\Railway_Stations\src`). Route paths are from
`src/App.tsx`. Nothing listed here is a placeholder unless marked.

## Landing (`/`)

- Stream showcase (Engineering / Commerce / Arts) with per-stream selection.
- **Get Started** buttons → `/signup` with `{ domain, mode: 'signup' }` nav state.
- Sign-in entry points → `/login`.

## Get Started

- Existing buttons on Landing; navigates to `/signup`, passing the selected
  domain and signup mode. Do not modify button or routing.

## Sign Up (`/signup`)

- `src/pages/SignUp.tsx` re-exports the shared `Auth` component with
  `defaultMode="signup"`.
- Signup form: full name, email, password + confirm, stream/domain selector
  (Engineering / Commerce / Arts grid), Google OAuth button, language
  (EN/हिंदी) toggle, affirmation panel.

## Sign In (`/login`, `/auth`)

- Shared `Auth` component in login mode; email + password, Google OAuth,
  forgot-password link, toggle to signup. No Auth.tsx runtime error after
  the crash-prevention fixes.

## Password recovery

- `/forgot-password` (`ForgotPassword.tsx`), `/update-password`
  (`UpdatePassword.tsx`).

## Onboarding (`/onboarding`, protected)

- Multi-step profile setup: personal info, college, stream, skills (+
  proficiency), experience, goals; writes to station store and Supabase
  profile; redirects to `/dashboard` on completion.

## Dashboard (`/dashboard/*`, protected)

- Layout (`Dashboard.tsx`): sidebar + content outlet.
- Home (`/dashboard`, `Home.tsx`): greeting, stats, readiness metrics,
  today's focus, quick quiz, AI analysis of weak points.
- Weekly Plan (`weekly`), Last 7 Days (`last-7-days`, learning plan &
  history), Baseline Assessment (`baseline`).

## Sidebar (`AppSidebar.tsx`)

- Brand header with stream tag badge; four collapsible sections
  (Core Intelligence, Interview Hub, Skill Development, Career Ladder);
  logout via AuthContext `signOut`.

## Core Intelligence

- Home, Growth Insights, Readiness Score, Weekly Plan, Leaderboard pages.

## Interview Hub (`/dashboard/interview`, `/speech`, `/company-prep`, `/mock-interview`)

- Speech Practice (`SpeechPractice.tsx` + `speechService`).
- Interview Prep (`InterviewPrep.tsx` + `interviewEngine`).
- Company Mock (`CompanyPrep.tsx` + `companyPreparationData`).
- Live Interview (`MockInterview.tsx`, also `live-interview` and
  `interview-simulator` routes).

## Skill Development

- Skill Quizzes (`quizzes`), Baseline Assessment (`baseline`),
  Learning Plan & History (`last-7-days`), Improvement Zone (`weakness` →
  `GrowthInsights`).

## Readiness (`/dashboard/readiness`)

- `PlacementScore.tsx` plus readiness snapshot / job-readiness calculator
  components and `skillGapEngine`.

## Growth Insights (`/dashboard/growth-insights`, `/dashboard/weakness`)

- `GrowthInsights.tsx` + `growthInsightsEngine.ts`, weakness detection.

## Science / Engineering stream

- Represented by the existing `science` entry in `domainConfig`
  (labels, affirmations, quiz types, todos, vault topics, companies).
  Auth shows it as "Engineering"; code falls back to
  `domainConfig.science` where the lookup would be undefined.

## Commerce stream

- `commerce` entry in `domainConfig`; banking/finance quizzes, todos,
  companies (SBI, HDFC, ICICI, RBI, NABARD, Kotak).

## Arts stream

- `arts` entry in `domainConfig`; civil-services content (IAS/IPS/IFS/IRS,
  State PCS), polity/history/geography topics.

## Science Command / Art Stream

- Not present in source (no matches in `src/`). Treated as absent, not as
  features. Stream-specific behavior lives in `domainConfig` + dashboard
  pages.

## Files / Vault (`/dashboard/vault`)

- `Vault.tsx`, listed in sidebar as Knowledge Vault; topics per stream from
  `domainConfig`.

## Resume (`/dashboard/resume`)

- `Resume.tsx` resume builder page.

## Companies (`/dashboard/companies`) / Jobs (`/dashboard/jobs`)

- `Companies.tsx`, `Jobs.tsx`, backed by `companyPreparationData`.

## Leaderboard (`/dashboard/leaderboard`) / Social (`/dashboard/social`)

- `Leaderboard.tsx`, `Social.tsx` (peer network).

## Profile (`/dashboard/profile`) / Settings (`/dashboard/settings`)

- `Profile.tsx`, `SettingsPage.tsx` (stream, theme, language).

## Mock Interview details

- `MockInterview.tsx` orchestrates practice + live flows.
- Camera/device check: `PreInterviewDeviceCheck.tsx`.
- Video stage: `InterviewVideoStage.tsx`.
- Reports: `InterviewReportView.tsx`, quiz learning reports.

## Existing Growth Station functionality (other)

- Focus timer (`FocusTimer.tsx`), theme switcher, chatbot (`ChatBot.tsx`),
  error boundary, protected routing, Supabase-backed progress sync,
  performance store (`usePerformanceStore`), test suites under `src/test/`.

## Known crash-prevention rules

- `domainConfig[domain]` / `domainConfig[d]` must safely fall back to
  `domainConfig.science` where appropriate (affirmations, labels, tags,
  companies), with final fallbacks (`?? d`, `?? ''`) so nothing renders
  `undefined`.
- `domainIcons[domain]` in Auth falls back to `domainIcons.engineering`.
- Verify with `npx tsc --noEmit` (must pass) and a fresh/incognito reload
  of the existing `http://localhost:8080` server.
