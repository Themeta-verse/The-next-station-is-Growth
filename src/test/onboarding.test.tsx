import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import Onboarding from '@/pages/Onboarding';
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
  });
});
