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

### 8. Evidence-Based Job Readiness & Skill Alignment Engine (`src/components/readiness/JobReadinessCalculator.tsx`)
- Replaces naive "before/after" guessing widgets with an evidence-based preparation alignment model.
- Evaluates candidate skills against verified round structures and recruiter expectations for Tier 1 (Product & Core Tech), Tier 2 (Growth & Tech Services), Tier 3 (Enterprise & Mass Recruiters), Banking & Finance, and Civil Services.
- **5-Pillar Readiness Model**:
  - Technical Skill Match (30%)
  - Data Structures & Algorithms (25%)
  - CS Fundamentals / Core Domain (20%)
  - Aptitude & Logical Reasoning (15%)
  - Interview & Behavioral Command (10%)
- **Recruiter Syllabus Notice**: Explicit disclaimer that tiers classify recruitment syllabus intensity rather than moral rankings.
- **Graceful Fallback**: For unmodeled recruiters, avoids fabricating numbers and provides a "Request Syllabus Addition" button.

### 9. Diagnostic Learning & Recovery System (`src/components/quiz/QuizLearningReport.tsx`)
- Transforms quiz results from a basic score into an actionable recovery and learning engine.
- Matches missed questions to a structured curriculum (`src/data/learningCurriculum.ts`) identifying underlying misconceptions.
- Displays key mental models and cheat sheets to clarify common traps.
- Curates targeted high-yield resources with metadata: Source (NeetCode, GateSmashers, Striver, MDN), duration, level, and specific recommendation reasons.
- Interactive "Learn Concept" study sheet modal with prerequisites, conceptual breakdown, and immediate recovery drills.
- One-click "Focus Task" integration to add weak areas directly into profile priorities.

### 10. Connected Visual Roadmap (`src/components/roadmap/VisualRoadmap.tsx`)
- Replaces static text lists with an interactive subway/station journey track (`WeeklyPlan.tsx`).
- Connected milestones with distinct station markers, progress indicators, and prerequisite enforcement.
- Integrated deliverables checklist, video lessons, and modal quiz validation.
- Structures AI roadmap generations in `WeaknessDetector.tsx` into visual milestone cards.

### 11. Unified Student Readiness Cockpit (`src/components/dashboard/StudentReadinessSnapshot.tsx`)
- Mounted on the Home dashboard (`/dashboard`) as a cohesive student cockpit.
- Displays verified profile metadata (Target Role, Dream Company, Degree, College).
- Dynamically computes a multi-pillar readiness score and live progress bars from real store state and quiz metrics.
- Highlights current top focus priorities and recommends contextual next actions.

### 13. Realistic AI Video Mock Interview System (`/dashboard/mock-interview`)
- **Authentic Interview Simulation**: Replaces legacy text typing with a real-time spoken and visual interview session.
- **Pre-Interview Configuration**:
  - Automatically pre-filled with candidate academic baseline, target role, and target companies from the student profile.
  - Recruiter selection strictly grounded in `SUPPORTED_COMPANIES` (Tier 1, Tier 2, Tier 3, Banking, Civil Services) with clear disclaimers for unsupported recruiters.
  - Configurable interview focus (`Technical`, `HR / Behavioral`, `DSA`, `CS Fundamentals`, `Company-specific`, `Mixed`), difficulty (`Beginner`, `Intermediate`, `Advanced`), and duration (`Short` 8m, `Standard` 15m, `Extended` 25m).
- **Pre-Interview Device Check & Diagnostics (`src/components/interview/PreInterviewDeviceCheck.tsx`)**:
  - Live local camera mirror with aspect ratio framing.
  - Real-time Web Audio API frequency analyser and RMS volume meter for the microphone.
  - Hardware device enumeration (`enumerateDevices`) allowing camera and microphone selection.
  - Descriptive, non-blocking error handling for permission denial with retry workflows.
- **Dual-Feed Video Stage (`src/components/interview/InterviewVideoStage.tsx`)**:
  - Upper screen: Animated interviewer visual representation with active TTS voice, audio waveforms, listening status, and replay controls.
  - Lower screen: Mirrored student webcam feed, live speech-to-text transcript caption overlay, and mute/camera hardware toggles.
  - Spoken-first interaction via browser `SpeechRecognition` (STT) and `speechSynthesis` (TTS), with keyboard text input as an accessible fallback.
  - Session timer countdown and emergency pause/end controls.
- **Conversational Interview Engine (`src/services/interviewEngine.ts`)**:
  - Dynamically builds AI prompts incorporating candidate degree, domain, known skills, baseline proficiencies, and company syllabus expectations.
  - Evaluates student's spoken transcript to dynamically generate follow-up questions (probing deeper into stated complexities, challenging assumptions, or asking practical scenarios) rather than following a static list.
- **Multi-Dimensional Interview Report (`src/components/interview/InterviewReportView.tsx`)**:
  - Scores candidate performance across 6 explicit dimensions: Technical Depth, Problem Solving, Communication Clarity, Answer Structure (STAR), Company Fit, and Composure/Fluency.
  - Quantifies measurable verbal signals: Words Per Minute (WPM), total words spoken, session duration, and filler word frequency (`um`, `uh`, `like`, `basically`).
  - Question-by-question breakdown featuring verbatim transcripts, strengths, missing points, technical corrections, and exemplar model answers.
- **Closed Learning Loop Integration**:
  - Automatically identifies preparation gaps and weak concepts from interview answers.
  - One-click "Save Weakness" synchronizes directly to `useStationStore.addWeakPoint()` and the Weakness Detector.
  - "Study Concept" launches curated educational sheets (`src/data/learningCurriculum.ts`) with mental models and external resources (NeetCode, Striver, GateSmashers, MDN).
  - Persists session audits to `usePerformanceStore.saveMockInterviewSession()` and updates overall readiness scores (+80 XP progress).
- **Privacy & Security**:
  - Video and audio streams are processed locally in the browser and **never recorded or stored** on external servers.
  - Hardware tracks are stopped immediately upon session exit or component unmount.

---

## Phase 4: Adaptive Learning, Evidence-Based Resources & Visual Roadmap

Phase 4 establishes an adaptive, evidence-based learning cycle that transforms diagnostic assessment gaps into verified skill mastery:

### 1. Curated Learning Resources Metadata Model (`src/data/learningCurriculum.ts`)
- **Authoritative Curation Only**: No random search links, SEO affiliate content, or unverified claims.
- **Resource Metadata Schema**:
  - `sourceType`: `'official_doc'` (PostgreSQL, Python, MDN), `'institution'` (MIT OpenCourseWare, NPTEL), `'industry_standard'` (NeetCode, Striver A2Z, GateSmashers), `'verified_educator'`.
  - `provider`, `estimatedMinutes`, `lastVerified`, `language`, `prerequisites`, and `completionCriteria`.
- Covers core curriculum across Engineering (DSA, DBMS, OS, Networking, Distributed Systems), Commerce (Financial Accounting, Cost Accounting, Banking), and General Studies (Indian Polity, Quantitative Aptitude).

### 2. Weak-Point Structured Learning Path Engine (`src/services/learningPathEngine.ts`)
- Generates a pedagogically sound 5-phase mastery path for any detected weak point:
  1. **Phase 1 — Prerequisites First**: Review foundation building blocks before attempting the advanced topic.
  2. **Phase 2 — Core Concept Study**: Deep mental model and authoritative reference.
  3. **Phase 3 — Invariants & Common Traps**: Diagnostic analysis explaining *why* students make specific errors.
  4. **Phase 4 — Practice Drills**: Targeted problem sets ordered from standard patterns to edge cases.
  5. **Phase 5 — Reassessment Checkpoint**: Timed diagnostic questions to verify conceptual retention.
- Reassessment logic evaluates attempts against a **&ge; 75% threshold**. Achieving &ge; 75% elevates student assessed competency level and clears the weak point.

### 3. Diagnostic Learning & Recovery Report (`src/components/quiz/QuizLearningReport.tsx`)
- Structured concept recovery cards replacing generic quiz summaries:
  - Assessed question vs student selected answer vs correct answer with reasoning.
  - Visible "Why You Missed It / Common Trap" root-cause explanations.
  - Subtopic prerequisite chain ("What to Study").
  - Badged authoritative resources with source type and time estimate.
  - Interactive **Verification Checkpoint Modal**: students answer targeted diagnostic questions; scoring &ge; 75% immediately calls `updateSkillEvidence` in `useStationStore` and marks the weak point as resolved.

### 4. Personalized Daily Focus (`src/components/dashboard/TodaysFocus.tsx` & `src/services/skillGapEngine.ts`)
- Dynamically prioritized daily tasks derived from actual student gaps, target company, and target role:
  - Explicit priority tiers: `HIGH PRIORITY` (Active Weak Points), `PRACTICE` (Targeted Drills), `COMPANY PREP` (Recruiter Checkpoints), `COMMUNICATION` (AI Video Interview), `FOUNDATION`.
  - Visible diagnostic reasons explaining *why* each task was assigned.
  - Accurate time estimates for planning daily study sessions.

### 5. Connected Visual Milestone Roadmap (`src/components/roadmap/VisualRoadmap.tsx`)
- Horizontal stage pipeline visualization: `START` &rarr; `FOUNDATION` &rarr; `CORE SKILLS` &rarr; `ROLE SKILLS` &rarr; `COMPANY PREP` &rarr; `MOCK INTERVIEW` &rarr; `JOB READY`.
- Milestone cards with key topic status breakdown: `✓` (Mastered), `⚠` (Weak Point Detected), `○` (Pending).
- Milestone lock state with explicit prerequisite indicators (`Requires: [prerequisite]`).
- Expandable stations with actionable deliverables and toggleable completion tracking.

### 6. Evidence-Based Company Preparation & Progression Comparison
- **Company Preparation (`src/pages/dashboard/Companies.tsx`)**:
  - Grounded strictly in `SUPPORTED_COMPANIES` with verified role expectations and screening rounds.
  - Unknown company queries display "Company Not Currently Supported" and offer graceful guidance without fabricating odds.
- **Measurable Progression (`src/components/readiness/JobReadinessCalculator.tsx`)**:
  - Displays "Not Enough Evidence Yet" banner for new students with no assessment data.
  - Multi-dimensional progression grid comparing **Baseline Assessed** vs **Current Verified** vs **Target Requirement** across technical match, algorithmic problem solving, CS core principles, aptitude, and interview communication.

---

## Technology Stack

- **Frontend Core**: React 18, Vite 5, TypeScript 5
- **Styling**: TailwindCSS 3.4, PostCSS, Lucide React icons
- **UI Components**: Radix UI primitives, Sonner (notifications), cmdk
- **State Management**: Zustand 5 (`useStationStore`, `usePerformanceStore`, `useLeaderboardStore`)
- **Server State & Caching**: TanStack React Query 5
- **Backend & Auth**: Supabase Auth, PostgreSQL, Supabase Realtime
- **Speech & Media**: Web Speech Recognition (STT), Web Speech Synthesis (TTS), Web Audio API Analyser, MediaStream API
- **Testing**: Vitest, React Testing Library, JSDOM

---

## Current Status & Development Notes

- **Automated Test Suite**:
  - **92 automated unit tests passing** across 13 test suites (`example.test.ts`, `profile.test.tsx`, `auth.test.tsx`, `errorBoundary.test.tsx`, `onboarding.test.tsx`, `readiness.test.tsx`, `jobReadiness.test.tsx`, `learningPlan.test.tsx`, `roadmap.test.tsx`, `readinessSnapshot.test.tsx`, `mockInterview.test.tsx`, `studentIntelligence.test.tsx`, `adaptiveLearning.test.tsx`).
  - Strict TypeScript type-checking (`tsc --noEmit`) passes with 0 errors.
  - Production Vite bundle builds cleanly in ~12s.
- **Database Personalization Migration**:
  - Located at `supabase/migrations/20260415000000_student_profile_personalization.sql`.
  - Safely extends `public.profiles` with `degree`, `semester`, `graduation_year`, `target_role`, `target_companies`, `skills`, `dsa_level`, `cs_fundamentals_level`, `aptitude_level`, and `communication_level`.
- **Fault-Tolerant UX & Error Boundary**:
  - Global `<ErrorBoundary>` catches render anomalies and provides one-click recovery.
  - Decoupled `onAuthStateChange` eliminates deadlock/infinite loading states.
- **Supabase Dashboard & OAuth Configuration**:
  - In **Authentication > URL Configuration**, ensure the Redirect Allow List includes:
    - `http://localhost:8081/**`
    - `http://localhost:8080/**`
    - `https://*.trycloudflare.com/**`
  - In **Authentication > Providers > Email**, disable "Confirm email" during local testing to prevent hitting the default free-tier SMTP hourly rate limit.
  - In **Authentication > Providers > Google**, Google OAuth is enabled with Google Client ID & Secret, routing callbacks through `https://unblvaxyxkbkxlhyiejf.supabase.co/auth/v1/callback`.
- **Cloudflare Quick Tunnel Integration**:
  - Local Vite dev server runs with `allowedHosts: true` to seamlessly support dynamic Cloudflare tunnels (`*.trycloudflare.com`).
