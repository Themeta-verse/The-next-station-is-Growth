import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import Onboarding from '@/pages/Onboarding';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStationStore } from '@/store/useStationStore';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import * as AuthContextModule from '@/context/AuthContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
    })),
    removeChannel: vi.fn(),
  },
  formatAuthError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

describe('Onboarding & Progress Synchronization (CHUNK 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStationStore.setState({
      score: 0,
      tasksDone: 0,
      streak: 1,
      domain: 'engineering',
      user: null,
      language: 'en',
    });
  });

  describe('useStationStore state & metrics', () => {
    it('initializes with default metrics and updates via setStats', () => {
      const state = useStationStore.getState();
      expect(state.score).toBe(0);
      expect(state.tasksDone).toBe(0);
      expect(state.streak).toBe(1);

      state.setStats({ score: 250, tasksDone: 5, streak: 3 });
      const updated = useStationStore.getState();
      expect(updated.score).toBe(250);
      expect(updated.tasksDone).toBe(5);
      expect(updated.streak).toBe(3);
    });

    it('completeTask increments tasksDone, updates weeklyGoalProgress and increases score', () => {
      const state = useStationStore.getState();
      state.completeTask();
      const updated = useStationStore.getState();
      expect(updated.tasksDone).toBe(1);
      expect(updated.score).toBe(10);
      expect(updated.weeklyGoalProgress).toBe(5);
    });
  });

  describe('useLeaderboardStore syncFromSupabase', () => {
    it('merges Supabase profiles, calculates ranks, and marks myEntry for the current user', () => {
      const mockProfiles = [
        { id: 'user-1', name: 'Aarav Sharma', score: 2400, tasks_done: 10, streak: 4, city: 'Mumbai' },
        { id: 'user-2', name: 'Priya Patel', score: 2800, tasks_done: 15, streak: 7, city: 'Pune' },
      ];

      useLeaderboardStore.getState().syncFromSupabase(mockProfiles, 'user-1', 'engineering', 'Mumbai');
      const state = useLeaderboardStore.getState();

      expect(state.entries.length).toBeGreaterThanOrEqual(2);
      // Top user should be user-2 with score 2800
      expect(state.entries[0].username).toBe('Priya Patel');
      expect(state.entries[0].totalScore).toBe(2800);
      expect(state.entries[0].currentRank).toBe(1);

      // Current user should be marked as self with (You)
      expect(state.myEntry).not.toBeNull();
      expect(state.myEntry?.userId).toBe('self');
      expect(state.myEntry?.totalScore).toBe(2400);
      expect(state.myEntry?.username).toContain('(You)');
    });
  });

  describe('Onboarding component UI & flow', () => {
    const mockAuthContext = (overrides = {}) => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-user-id', email: 'student@example.com', user_metadata: { name: 'Deepak' } } as unknown as User,
        session: {} as unknown as Session,
        isLoading: false,
        isAuthenticated: true,
        hasCompletedOnboarding: false,
        isPasswordRecovery: false,
        signOut: vi.fn(),
        refreshProfile: vi.fn().mockResolvedValue(true),
        updateProfile: vi.fn().mockResolvedValue({ error: null }),
        updatePassword: vi.fn().mockResolvedValue({ error: null }),
        updateEmail: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        recordProgress: vi.fn().mockResolvedValue(undefined),
        ...overrides,
      });
    };

    it('renders Step 0 Personal Details', () => {
      mockAuthContext();
      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>
      );

      expect(screen.getByText(/Personal & College Details/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Mumbai, Pune, Bangalore/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., IIT Bombay, COEP/i)).toBeInTheDocument();
    });

    it('blocks navigation with an error message when city or college is empty', () => {
      mockAuthContext();
      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>
      );

      const continueBtn = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueBtn);

      expect(screen.getByText(/Please enter your city or locality/i)).toBeInTheDocument();
    });

    it('proceeds to Step 1 (Academic Details) when Step 0 is valid', async () => {
      mockAuthContext();
      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>
      );

      const cityInput = screen.getByPlaceholderText(/e.g., Mumbai, Pune, Bangalore/i);
      const collegeInput = screen.getByPlaceholderText(/e.g., IIT Bombay, COEP/i);

      fireEvent.change(cityInput, { target: { value: 'Bangalore' } });
      fireEvent.change(collegeInput, { target: { value: 'BMS College of Engineering' } });

      const continueBtn = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/Academic & Domain Track/i)).toBeInTheDocument();
      });
    });

    it('A: Completed onboarding + "Take Baseline Diagnostic" navigates to /dashboard/baseline', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
      mockAuthContext({ updateProfile: mockUpdateProfile });

      // Pre-populate store with valid profile data
      useStationStore.setState({
        user: {
          name: 'Deepak',
          state: 'KA',
          city: 'Bangalore',
          college: 'BMS College of Engineering',
          domain: 'engineering',
          degree: 'B.Tech / B.E.',
          specialization: 'Computer Science',
          year: '3rd Year',
          semester: 'Semester 5',
          graduationYear: '2026',
          preparingFor: 'On-Campus Placements',
          targetRole: 'Software Development Engineer',
          targetJobType: 'Full-time Role',
          dreamCompany: 'Google',
          targetCompanies: ['Google', 'TCS'],
          dreamJob: 'Software Development Engineer',
          targetSalary: '15-25 LPA',
          timeline: '6',
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        },
      });

      render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/baseline" element={<div>Baseline Assessment Screen</div>} />
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Advance through all 5 steps to Step 5
      for (let s = 0; s < 5; s++) {
        const nextBtn = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(nextBtn);
      }

      // We are now at Step 5 (Projects, Target Recruiters & Package)
      expect(screen.getByText(/Projects, Target Recruiters & Package/i)).toBeInTheDocument();

      // Click "Complete Profile Setup"
      const completeBtn = screen.getByRole('button', { name: /Complete Profile Setup/i });
      fireEvent.click(completeBtn);

      // Verify completion modal appears
      await waitFor(() => {
        expect(screen.getByText(/Profile Calibrated Successfully!/i)).toBeInTheDocument();
      });

      // Click "Take Baseline Diagnostic" button
      const takeAssessmentBtn = screen.getByRole('button', { name: /Take Baseline Diagnostic/i });
      fireEvent.click(takeAssessmentBtn);

      // Verify navigation to /dashboard/baseline
      await waitFor(() => {
        expect(screen.getByText('Baseline Assessment Screen')).toBeInTheDocument();
      });
    });

    it('B: Completed onboarding + "Skip & Proceed to Dashboard" navigates to /dashboard', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
      mockAuthContext({ updateProfile: mockUpdateProfile });

      useStationStore.setState({
        user: {
          name: 'Deepak',
          state: 'KA',
          city: 'Bangalore',
          college: 'BMS College of Engineering',
          domain: 'engineering',
          degree: 'B.Tech / B.E.',
          specialization: 'Computer Science',
          year: '3rd Year',
          semester: 'Semester 5',
          graduationYear: '2026',
          preparingFor: 'On-Campus Placements',
          targetRole: 'Software Development Engineer',
          targetJobType: 'Full-time Role',
          dreamCompany: 'Google',
          targetCompanies: ['Google', 'TCS'],
          dreamJob: 'Software Development Engineer',
          targetSalary: '15-25 LPA',
          timeline: '6',
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        },
      });

      render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/baseline" element={<div>Baseline Assessment Screen</div>} />
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      for (let s = 0; s < 5; s++) {
        const nextBtn = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(nextBtn);
      }

      const completeBtn = screen.getByRole('button', { name: /Complete Profile Setup/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Profile Calibrated Successfully!/i)).toBeInTheDocument();
      });

      const skipBtn = screen.getByRole('button', { name: /Skip & Proceed to Dashboard/i });
      fireEvent.click(skipBtn);

      await waitFor(() => {
        expect(screen.getByText('Dashboard Screen')).toBeInTheDocument();
      });
    });

    it('C: Completed onboarding + browser refresh does not redirect back to /onboarding', () => {
      // Simulate state after browser refresh when profile has onboarding_completed = true
      mockAuthContext({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: true,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Authenticated Dashboard</div>} />
              <Route path="/dashboard/baseline" element={<div>Authenticated Baseline</div>} />
              <Route path="/onboarding" element={<div>Onboarding Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Student stays on dashboard and is NOT redirected to /onboarding
      expect(screen.getByText('Authenticated Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
    });

    it('D: Incomplete onboarding still correctly redirects dashboard attempts to /onboarding', () => {
      mockAuthContext({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Authenticated Dashboard</div>} />
              <Route path="/onboarding" element={<div>Onboarding Step 1 Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Incomplete onboarding redirects to /onboarding
      expect(screen.getByText('Onboarding Step 1 Page')).toBeInTheDocument();
      expect(screen.queryByText('Authenticated Dashboard')).not.toBeInTheDocument();
    });

    it('E: Profile persistence failure shows error and DOES NOT pretend onboarding completed', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({
        error: new Error('Failed to persist profile: database connection refused'),
      });
      mockAuthContext({ updateProfile: mockUpdateProfile });

      useStationStore.setState({
        user: {
          name: 'Deepak',
          state: 'KA',
          city: 'Bangalore',
          college: 'BMS College of Engineering',
          domain: 'engineering',
          degree: 'B.Tech / B.E.',
          specialization: 'Computer Science',
          year: '3rd Year',
          semester: 'Semester 5',
          graduationYear: '2026',
          preparingFor: 'On-Campus Placements',
          targetRole: 'Software Development Engineer',
          targetJobType: 'Full-time Role',
          dreamCompany: 'Google',
          targetCompanies: ['Google', 'TCS'],
          dreamJob: 'Software Development Engineer',
          targetSalary: '15-25 LPA',
          timeline: '6',
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        },
      });

      render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <Onboarding />
        </MemoryRouter>
      );

      for (let s = 0; s < 5; s++) {
        const nextBtn = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(nextBtn);
      }

      const completeBtn = screen.getByRole('button', { name: /Complete Profile Setup/i });
      fireEvent.click(completeBtn);

      // Verify that error is shown
      await waitFor(() => {
        expect(screen.getByText(/Failed to persist profile/i)).toBeInTheDocument();
      });

      // Completion modal MUST NOT be shown
      expect(screen.queryByText(/Profile Calibrated Successfully!/i)).not.toBeInTheDocument();
    });

    it('F: Auth & store state updates correctly with all onboarding fields', async () => {
      let passedUpdates: Record<string, unknown> | null = null;
      const mockUpdateProfile = vi.fn().mockImplementation((updates) => {
        passedUpdates = updates;
        return Promise.resolve({ error: null });
      });
      mockAuthContext({ updateProfile: mockUpdateProfile });

      useStationStore.setState({
        user: {
          name: 'Deepak',
          state: 'KA',
          city: 'Bangalore',
          college: 'BMS College of Engineering',
          domain: 'engineering',
          degree: 'B.Tech / B.E.',
          specialization: 'Computer Science',
          year: '3rd Year',
          semester: 'Semester 5',
          graduationYear: '2026',
          preparingFor: 'On-Campus Placements',
          targetRole: 'Software Development Engineer',
          targetJobType: 'Full-time Role',
          dreamCompany: 'Google',
          targetCompanies: ['Google', 'TCS'],
          dreamJob: 'Software Development Engineer',
          targetSalary: '15-25 LPA',
          timeline: '6',
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        },
      });

      render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <Onboarding />
        </MemoryRouter>
      );

      for (let s = 0; s < 5; s++) {
        const nextBtn = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(nextBtn);
      }

      const completeBtn = screen.getByRole('button', { name: /Complete Profile Setup/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
      });

      expect(passedUpdates).not.toBeNull();
      expect(passedUpdates?.onboarding_completed).toBe(true);
      expect(passedUpdates?.city).toBe('Bangalore');
      expect(passedUpdates?.college).toBe('BMS College of Engineering');
      expect(passedUpdates?.degree).toBe('B.Tech / B.E.');
      expect(passedUpdates?.specialization).toBe('Computer Science');
      expect(passedUpdates?.target_role).toBe('Software Development Engineer');
      expect(passedUpdates?.target_companies).toEqual(['Google', 'TCS']);
      expect(passedUpdates?.target_salary).toBe('15-25 LPA');
    });
  });
});

