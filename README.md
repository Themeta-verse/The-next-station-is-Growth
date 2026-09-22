# Growth Station (STATION)

Official Repository: [https://github.com/Themeta-verse/The-next-station-is-Growth.git](https://github.com/Themeta-verse/The-next-station-is-Growth.git)

Growth Station is a placement preparation and career acceleration platform designed for students across Engineering, Commerce, and Arts / Civil Services domains. The platform provides localized learning paths, interactive quizzes, interview preparation, AI coaching, resume building, and placement tracking.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Installation
```bash
# 1. Clone the official repository
git clone https://github.com/Themeta-verse/The-next-station-is-Growth.git
cd The-next-station-is-Growth

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env

# 4. Start the development server
npm run dev
```

The application will be available at `http://localhost:8081/`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with HMR |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm test` | Runs Vitest automated test suite |
| `npm run preview` | Previews the production build locally |

---

## Environment Configuration

The application uses Vite environment variables (prefixed with `VITE_`). A template is provided in [`.env.example`](.env.example).

> [!IMPORTANT]
> Real Supabase credentials are required for live user registration and sign-in. The original developer sandbox (`pqjvqunyaxqaksbsvmem.supabase.co`) is expired/decommissioned upstream and does not resolve.

### Required Variables

Create a local `.env` file in the root directory:

```env
# Supabase Project URL (e.g., https://your-project-id.supabase.co)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous / Public Key (safe for browser exposure)
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# Supabase Project Identifier
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Setting Up Your Supabase Project

1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. In the Supabase dashboard, navigate to **Project Settings** &rarr; **API**.
3. Copy the **Project URL** and assign it to `VITE_SUPABASE_URL`.
4. Copy the **anon / public** API key and assign it to `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Under **SQL Editor**, execute the migration file located at:
   [`supabase/migrations/20260414010707_6323fb9d-2f1b-46ae-8213-337192a93e48.sql`](supabase/migrations/20260414010707_6323fb9d-2f1b-46ae-8213-337192a93e48.sql).
   This creates the required `public.profiles` table, Row Level Security policies, and trigger for auto-creating user profiles on signup.
6. Under **Authentication** &rarr; **URL Configuration**, set the Site URL to `http://localhost:8081` (or your production URL).

> [!CAUTION]
> **Security Reminder**: Never place your Supabase `service_role` secret in `.env` or frontend code. The `.gitignore` is configured to prevent committing any `.env` files.

---

## Authentication Architecture

### 1. Centralized Session Management (`AuthProvider`)
The application is wrapped in `<AuthProvider>` (`src/context/AuthContext.tsx`).
- On application mount, it retrieves the active session from `supabase.auth.getSession()`.
- It maintains real-time synchronization with Supabase via `supabase.auth.onAuthStateChange`.
- Sessions persist across page refreshes using browser `localStorage`.
- When an authenticated session is detected, the user's profile is loaded from `public.profiles` and synced with the global Zustand store (`useStationStore`).

### 2. Route Protection (`ProtectedRoute`)
Protected areas (`/dashboard/*` and `/onboarding`) are guarded by `<ProtectedRoute>` (`src/components/ProtectedRoute.tsx`):
- Unauthenticated visitors attempting to access `/dashboard` are redirected to `/auth` with the intended path saved in `location.state.from`.
- An authentication check loading state is presented while verifying sessions to eliminate screen flicker.
- Authenticated visitors on `/auth` are automatically redirected to their intended destination or `/dashboard`.

### 3. Consolidated Auth & Signup (`/auth` and `/login`)
- The authentication experience is consolidated into `src/pages/Auth.tsx` with `/login` acting as a backward-compatible alias.
- Sign Up supports full name, email, password, confirm password, password visibility toggles, and stream/domain selection (Engineering, Commerce, Arts).
- Robust client-side validation prevents invalid inputs, password mismatches, and duplicate registrations.
- Includes domain affirmation display, Hindi/English bilingual toggle, and responsive layouts.
- Technical network failures and unreachable host errors are intercepted by `formatAuthError()` in `src/integrations/supabase/client.ts`. Instead of displaying raw `"Failed to fetch"`, user-friendly diagnostic messages are presented.

### 4. Password Recovery Flow (`/forgot-password` & `/update-password`)
- **Step 1 (`/forgot-password`)**: User enters registered email; calls `supabase.auth.resetPasswordForEmail()` with dynamic localhost/production redirect URL (`/update-password`). Displays reassuring confirmation feedback without leaking account existence.
- **Step 2 (`/update-password`)**: Dedicated password update page allowing new password and confirm password inputs, visibility toggles, client-side validation, and executes `supabase.auth.updateUser({ password })`. Cleanly terminates recovery session and redirects to sign in.

### 5. Profile & Account Settings (`/settings` & `/profile`)
- **Profile Details**: View and update full name, college, city, specialization, and dream company. Saves directly to `public.profiles` and synchronizes with global `useStationStore`.
- **Change Password**: Dedicated security section with current password verification (via Supabase Auth re-authentication), new password confirmation, length checks, and update via `supabase.auth.updateUser()`.
- **Change Email**: Allows submitting a new email address via `supabase.auth.updateUser({ email })` with clear notice that verification links are dispatched by Supabase.
- **Sign Out**: Calls `supabase.auth.signOut()`, purges tokens, clears memory state, and redirects home.

### 6. Protected Routes (`/dashboard/*`, `/profile`, `/settings`)
- Direct access to `/profile` and `/settings` seamlessly redirects authenticated users to their corresponding dashboard views (`/dashboard/profile`, `/dashboard/settings`), while unauthenticated visitors are redirected to `/auth`.

### 7. Placement Readiness Diagnostic Hub (`/dashboard/readiness`)
- **Speedometer Progress Radial Gauge**: Interactive SVG radial progress gauge (0–100) dynamically synthesizing student readiness from historical test scores, mock interviews, and consistency streaks.
- **Dynamic Tier Categorization**: Automatically categorizes candidate readiness into *Foundation* (0-39%), *Developing* (40-64%), *Interview Ready* (65-84%), and *Tier 1 Campus Ready* (85-100%).
- **Domain Percentile Benchmark**: Calculates real-time student percentile position relative to peers in Engineering, Commerce, or Arts tracks.
- **4 Core Assessment Pillars**:
  - *Technical & Aptitude Acumen (Weight 40%)*: Tracks quiz performance with direct deep-links to quizzes.
  - *Interview & Communication Command (Weight 30%)*: Evaluates mock interview rehearsals and speech clarity.
  - *Preparation Habits & Consistency (Weight 20%)*: Factoring daily active streaks and completed weekly roadmap tasks.
  - *Target Company Alignment (Weight 10%)*: Benchmarks candidate competence against recruiter-specific syllabus requirements.
- **Target Company Clearance Probability Matrix**: Evaluates selection probability across recruiters like TCS, Infosys, Wipro, Google, and UPSC using tiered difficulty coefficients.
- **Interactive "What-If" Readiness Simulator**: Lets students preview real-time score gains by toggling target actions (+3 quizzes, +1 mock interview, 7-day streak, remediating weak points).
- **Verified Placement Readiness Credential**: Modal accreditation certificate preview with candidate name, institution, score breakdown, unique verification ID (`STN-PL-XXXXXX`), and browser print/PDF export.
- **Database Score Synchronization**: "Sync Profile" updates Supabase `public.profiles` (`score`) and updates leaderboard rankings.

### 8. AI Simulation & Resilience Engine (`src/lib/ai.ts`)
- Intelligent streaming and fallback simulation for `mock-interview`, `interview-prep`, `self-intro-feedback`, `self-intro-generate`, and company guides.
- Gracefully handles missing edge functions or rate limits without client crashes or blank screens.

---

## Technology Stack

- **Frontend Core**: React 18, Vite 5, TypeScript 5
- **Styling**: TailwindCSS 3.4, PostCSS, Lucide React icons
- **UI Components**: Radix UI primitives, Sonner (notifications), cmdk
- **State Management**: Zustand 5 (`useStationStore`, `usePerformanceStore`, `useLeaderboardStore`)
- **Server State & Caching**: TanStack React Query 5
- **Backend & Auth**: Supabase Auth, PostgreSQL, Supabase Realtime
- **Testing**: Vitest, React Testing Library, JSDOM

---

## Current Status & Development Notes

- **Placement Readiness Diagnostic Hub (Live & Complete)**:
  - Accessible at `/dashboard/readiness` and via the "Readiness Score" sidebar navigation.
  - Full SVG gauge, 4-pillar breakdown, company probability matrix, and interactive score simulator.
  - Verified Credential Modal with print/PDF export and unique certificate ID.
  - Real-time sync with Supabase `public.profiles` (`score`) and leaderboard ranking.
- **AI Resilience Engine (Live & Resilient)**:
  - Streaming fallback engine handles mock interview feedback, self-intro generation, and company prep.
- **Authentication & Onboarding (Production-Quality & Live)**:
  - Connected to active Supabase project (`https://unblvaxyxkbkxlhyiejf.supabase.co`).
  - Top-level `AuthProvider` and `useAuth()` implemented for reliable session persistence across page refreshes.
  - `ProtectedRoute` implemented for route guarding (`/dashboard/*`, `/profile`, `/settings`, and `/onboarding`).
  - Unified `/auth` and `/login` experience with client validation, confirm password, and stream selection.
  - Complete password recovery flow (`/forgot-password` and `/update-password`).
  - Multi-step interactive student onboarding flow (`/onboarding`) with live Supabase upsert.
  - Real-time leaderboard (`/dashboard/leaderboard`) with live PostgreSQL changes subscription.
  - Comprehensive error translation via `formatAuthError()`.
  - `.env` untracked and excluded in `.gitignore`; `.env.example` created with empty variable templates.
  - **35 automated unit tests passing** across 4 test suites; clean production build.
- **Supabase Dashboard & OAuth Configuration**:
  - In **Authentication > URL Configuration**, ensure the Redirect Allow List includes:
    - `http://localhost:8081/**`
    - `http://localhost:8080/**`
    - `https://*.trycloudflare.com/**`
  - In **Authentication > Providers > Email**, disable "Confirm email" during local testing to prevent hitting the default free-tier SMTP hourly rate limit.
  - In **Authentication > Providers > Google**, Google OAuth is enabled with Google Client ID & Secret, routing callbacks through `https://unblvaxyxkbkxlhyiejf.supabase.co/auth/v1/callback`.
- **Cloudflare Quick Tunnel Integration**:
  - Local Vite dev server runs with `allowedHosts: true` to seamlessly support dynamic Cloudflare tunnels (`*.trycloudflare.com`).
