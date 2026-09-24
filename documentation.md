# Growth Station — Documentation

## Purpose

Growth Station (branded "STATION" / "GROWTH STATION") is a placement- and
interview-preparation web app for students. It provides stream-specific
study content, skill quizzes, interview practice (including mock/video
interviews), readiness scoring, company/job information, a knowledge vault,
resume help, and social/leaderboard features.

## Three streams and domain compatibility

The store (`src/store/useStationStore.ts`) defines:

- `Domain = 'science' | 'commerce' | 'arts'` (default `domain` is `'science'`)
- `domainConfig` keys: `science`, `commerce`, `arts`

The Auth UI exposes the stream selector as **Engineering / Commerce / Arts**
(`src/pages/Auth.tsx`, `['engineering', 'commerce', 'arts']`).

Compatibility mapping (existing, intentional — do not rename or redesign):

| UI stream   | `domainConfig` entry | Notes                                    |
|-------------|----------------------|------------------------------------------|
| Engineering | `science`            | Engineering is represented by `science`. |
| Commerce    | `commerce`           | Direct match.                            |
| Arts        | `arts`               | Direct match.                            |

Consequence: any indexed lookup such as `domainConfig[domain]`,
`domainConfig[d]`, or `domainIcons[domain]` can be `undefined` when the
runtime value is `'engineering'` (no `science`→`engineering` entry exists in
`domainConfig`) or `'science'` (no `science` key exists in Auth's
`domainIcons`, whose keys are `engineering | commerce | arts`).

## Authentication architecture

- Provider: Supabase (`src/integrations/supabase/client.ts`, `supabase.auth`).
- `src/context/AuthContext.tsx` (`AuthProvider` / `useAuth`) owns the session:
  initial `supabase.auth.getSession()`, `onAuthStateChange` subscription,
  profile sync (`syncUserProfile`), `signInWithGoogle` (OAuth), `signOut`.
- Email/password flows live in the pages: `src/pages/Auth.tsx` (shared
  login/signup form), `src/pages/Login.tsx`, `src/pages/SignUp.tsx`
  (re-exports `Auth` with `defaultMode="signup"`).
- Password recovery: `src/pages/ForgotPassword.tsx`,
  `src/pages/UpdatePassword.tsx`.
- Do not modify Supabase, AuthContext, or authentication logic when fixing
  UI crashes.

## Landing → Auth → Onboarding → Dashboard flow

1. Landing (`src/pages/Landing.tsx`, route `/`): stream selection and
   **Get Started** buttons call `navigate('/signup', { state: { domain, mode: 'signup' } })`.
2. Signup (`/signup` → `SignUp.tsx` → `Auth defaultMode="signup"`) and
   signin (`/login`, `/auth`): `Auth.tsx` reads `defaultMode`, path, nav
   state, and `?mode=` to pick signup vs login mode.
3. Onboarding (`src/pages/Onboarding.tsx`, route `/onboarding`, protected):
   collects profile (name, city, college, domain, skills, goals) into the
   station store / Supabase profile.
4. Dashboard (`/dashboard/*`, protected): `src/pages/Dashboard.tsx` renders
   `AppSidebar` + `<Outlet/>` for the active section.

## Protected routes

`src/components/ProtectedRoute.tsx` guards `/onboarding` and `/dashboard/*`
(current worktree: `<ProtectedRoute redirectTo="/login" />`). Crashes inside
route components are caught by `src/components/ErrorBoundary.tsx` — if the
ErrorBoundary UI appears instead of the page, check the browser console for
the underlying `TypeError` (file/line/expression) rather than redesigning.

## Dashboard architecture

- Layout: `src/pages/Dashboard.tsx` = `SidebarProvider` + `AppSidebar` +
  content `<Outlet/>`.
- Section pages (`src/pages/dashboard/`): `Home`, `WeeklyPlan`, `Quizzes`,
  `InterviewPrep`, `SpeechPractice`, `MockInterview` (also serves
  `live-interview`, `interview-simulator`), `GrowthInsights` (also serves
  `weakness`), `PlacementScore` (`readiness`), `CompanyPrep`, `Last7Days`,
  `Vault`, `Social`, `Resume`, `Profile`, `SettingsPage`,
  `BaselineAssessment`, `Companies`, `Jobs`, `Leaderboard`.
- Engines/services (`src/services/`): `interviewEngine`,
  `growthInsightsEngine`, `skillGapEngine`, `learningPathEngine`,
  `speechService`; AI via `src/lib/ai.ts` (`streamChat`); company/curriculum
  data in `src/data/` (`companyPreparationData`, `learningCurriculum`).

## Sidebar architecture

`src/components/AppSidebar.tsx` renders the brand header (logo +
`config.tag` badge, where
`config = domainConfig[domain] ?? domainConfig.science`) and four
collapsible sections:

- Core Intelligence: Home, Growth Insights, Readiness Score, Weekly Plan,
  Leaderboard.
- Interview Hub: Speech Practice, Interview Prep, Company Mock,
  Live Interview.
- Skill Development: Skill Quizzes, Baseline Assessment,
  Learning Plan & History, Improvement Zone.
- Career Ladder: Job Openings, Top Companies, Resume Builder,
  Knowledge Vault, Peer Network.

## Feature areas (source-verified)

- Interview Hub: `InterviewPrep`, `SpeechPractice`, `CompanyPrep`,
  `MockInterview` + `src/components/interview/` (`PreInterviewDeviceCheck`
  camera/device check, `InterviewVideoStage`, `InterviewReportView`).
- Skill Development: `Quizzes`, `BaselineAssessment`, `Last7Days`
  (learning plan & history), `WeaknessDetector`/`GrowthInsights`.
- Readiness: `PlacementScore` (`/dashboard/readiness`), readiness snapshot
  and job-readiness calculator components.
- Files/Vault: `Vault.tsx` ("Knowledge Vault" in sidebar).
- Growth Insights: `GrowthInsights.tsx` + `growthInsightsEngine`.
- Companies/Jobs/Resume/Social/Leaderboard/Profile/Settings: dedicated
  dashboard pages as routed in `src/App.tsx`.
- "Science Command" and "Art Stream": these names do **not** exist anywhere
  in `src/` (verified by search). Do not document them as real features;
  stream-specific content lives in `domainConfig` and the dashboard pages.

## Current runtime safety rules

Because the UI uses `'engineering'` while `domainConfig` uses `'science'`:

- `domainConfig[domain]` / `domainConfig[d]` must use optional chaining with
  a fallback to `domainConfig.science` (and finally `?? d`, `?? ''`, or
  `?? user.domain` as appropriate) wherever the lookup can be undefined.
- `domainIcons[domain]` in `Auth.tsx` must fall back to
  `domainIcons.engineering` (science has no icon key).
- Fix only the crashing expression; never redesign, never add fake config
  entries, never rename domains, never touch auth/routing/ErrorBoundary.

## Fresh/incognito domain-state issue (verified)

On a fresh/incognito session the store default `domain` is `'science'`,
while a returning session may carry `'engineering'`. Both values crash
different lookups, which is why crashes reproduce in fresh sessions but not
necessarily in existing ones. Always test auth in a fresh/incognito session.

## Exact Auth crash history and fixes

1. `Auth.tsx` affirmation line: `domainConfig.science.affirmation`
   crashed when the science entry was unreachable → fixed with
   `domainConfig[domain]?.affirmation(Hi) ?? domainConfig.science?.affirmation(Hi) ?? ''`.
2. `Auth.tsx` domain-button labels (`domainConfig[d].label(Hi)`) crashed for
   `d === 'engineering'` → fixed with `domainConfig[d]?.label(Hi) ?? d`
   (two places: branding panel and signup domain selector).
3. `Home.tsx`: `const config = domainConfig[domain]` → `config.label`
   crashed → fixed with
   `domainConfig[domain as keyof typeof domainConfig] ?? domainConfig.science`.
4. `AppSidebar.tsx`: same pattern → `config.tag` crashed → same fix.
5. `Auth.tsx` icon: `const Icon = domainIcons[domain]` was `undefined` for
   `domain === 'science'`, causing
   `Element type is invalid ... Check the render method of Auth` →
   fixed with
   `domainIcons[domain as keyof typeof domainIcons] ?? domainIcons.engineering`.

## TypeScript verification process

After any fix, run `npx tsc --noEmit` from `C:\Global Hackathon\Railway_Stations`.
It must exit 0. Fix only type errors caused by the change.

## Existing-server / no-new-server rule

The app runs at `http://localhost:8080`. Never run `npm run dev`, never
start another Vite server (port 8081 incidents), never change ports, never
restart the existing server. Reload the existing instance to verify.

## Restore / rollback safety rules

- History inspection is read-only (`git status/log/reflog/branch/diff`).
- Last verified complete commit: `6ad0407` ("feat: add stream intelligence
  and stabilize auth"). The `backup-before-latest-sync` branch is older and
  smaller — not a restore target.
- Never restore/rollback without explicit approval, and never with
  uncommitted changes present unless they are confirmed to be purely the
  broken changes. Report the working-tree state first.
