import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import PlacementScore from '@/pages/dashboard/PlacementScore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useStationStore } from '@/store/useStationStore';
import * as AuthContextModule from '@/context/AuthContext';
import { streamChat } from '@/lib/ai';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
  formatAuthError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

describe('Placement Readiness Diagnostic Hub & AI Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStationStore.setState({
      score: 150,
      tasksDone: 4,
      streak: 3,
      domain: 'engineering',
      targetCompany: 'TCS',
      user: {
        id: 'test-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        domain: 'engineering',
      },
    });

    usePerformanceStore.setState({
      quizHistory: [
        {
          id: 'q1',
          date: new Date().toISOString(),
          category: 'Data Structures',
          score: 85,
          total: 100,
          timeSpent: 300,
        },
      ],
      mockSessions: [
        {
          id: 'm1',
          date: new Date().toISOString(),
          role: 'Frontend Engineer',
          overallScore: 80,
          metrics: {
            confidence: 80,
            clarity: 82,
            technicalAccuracy: 78,
            pacing: 80,
          },
          feedback: ['Great structural explanation'],
        },
      ],
      weaknesses: [
        {
          topic: 'Dynamic Programming',
          frequency: 2,
          lastTested: new Date().toISOString(),
          severity: 'high',
        },
      ],
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'test-user-id', email: 'jane@example.com' } as unknown as User,
      session: { user: { id: 'test-user-id', email: 'jane@example.com' } } as unknown as Session,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  describe('PlacementScore Component Rendering', () => {
    it('renders the Diagnostic Hub header, domain badge, and gauge', () => {
      render(
        <MemoryRouter>
          <PlacementScore />
        </MemoryRouter>
      );

      expect(screen.getByText(/Placement Readiness Diagnostic/i)).toBeInTheDocument();
      expect(screen.getByText(/Campus Hiring Readiness Diagnostic/i)).toBeInTheDocument();
      expect(screen.getByText(/Readiness Index/i)).toBeInTheDocument();
    });

    it('displays the 4 Core Assessment Pillars with weighted percentages', () => {
      render(
        <MemoryRouter>
          <PlacementScore />
        </MemoryRouter>
      );

      expect(screen.getByText(/Technical & Aptitude Acumen/i)).toBeInTheDocument();
      expect(screen.getByText(/Weight: 40%/i)).toBeInTheDocument();

      expect(screen.getByText(/Interview & Communication/i)).toBeInTheDocument();
      expect(screen.getByText(/Weight: 30%/i)).toBeInTheDocument();

      expect(screen.getByText(/Preparation Habits & Consistency/i)).toBeInTheDocument();
      expect(screen.getByText(/Weight: 20%/i)).toBeInTheDocument();

      expect(screen.getByText(/Dream Company Alignment/i)).toBeInTheDocument();
      expect(screen.getByText(/Weight: 10%/i)).toBeInTheDocument();
    });

    it('renders the Target Company Clearance Probability Matrix', () => {
      render(
        <MemoryRouter>
          <PlacementScore />
        </MemoryRouter>
      );

      expect(screen.getByText(/Target Company Clearance Probability/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TCS/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Infosys/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Google/i).length).toBeGreaterThanOrEqual(1);
    });

    it('interacts with the Readiness Simulator checkboxes and updates projected score', () => {
      render(
        <MemoryRouter>
          <PlacementScore />
        </MemoryRouter>
      );

      expect(screen.getByText(/Placement Score Simulator/i)).toBeInTheDocument();
      const quizToggle = screen.getByLabelText(/Complete 3 Domain Quizzes/i);
      expect(quizToggle).not.toBeChecked();

      fireEvent.click(quizToggle);
      expect(quizToggle).toBeChecked();
    });

    it('opens and closes the Verified Placement Readiness Credential Modal', () => {
      render(
        <MemoryRouter>
          <PlacementScore />
        </MemoryRouter>
      );

      const certificateBtn = screen.getByRole('button', { name: /View Certificate/i });
      fireEvent.click(certificateBtn);

      expect(screen.getByText(/Verified Placement Readiness Credential/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeBtn);

      expect(screen.queryByText(/Verified Placement Readiness Credential/i)).not.toBeInTheDocument();
    });
  });

  describe('AI Resilience & Fallback Engine (src/lib/ai.ts)', () => {
    it('provides fallback streaming response gracefully when backend is unavailable', async () => {
      let received = '';
      let isDone = false;

      await streamChat({
        messages: [{ role: 'user', content: 'What is the interview pattern for TCS?' }],
        mode: 'company-prep',
        context: { domain: 'engineering', company: 'TCS' },
        onDelta: (chunk) => {
          received += chunk;
        },
        onDone: () => {
          isDone = true;
        },
      });

      await waitFor(() => expect(isDone).toBe(true));
      expect(received.length).toBeGreaterThan(15);
      expect(received).toContain('TCS');
    });

    it('provides intelligent fallback evaluation for mock-interview', async () => {
      let received = '';
      let isDone = false;

      await streamChat({
        messages: [{ role: 'user', content: 'Evaluate my last answer about React reconciliation' }],
        mode: 'mock-interview',
        context: { domain: 'engineering', company: 'Google' },
        onDelta: (chunk) => {
          received += chunk;
        },
        onDone: () => {
          isDone = true;
        },
      });

      await waitFor(() => expect(isDone).toBe(true));
      expect(received).toContain('CONFIDENCE:');
      expect(received).toContain('CLARITY:');
      expect(received).toContain('NEXT QUESTION:');
    });

    it('generates customized self-introduction stream', async () => {
      let received = '';
      let isDone = false;

      await streamChat({
        messages: [{ role: 'user', content: 'Create a self-introduction' }],
        mode: 'self-intro-generate',
        context: { domain: 'engineering', company: 'Infosys', userName: 'Jane Doe' },
        onDelta: (chunk) => {
          received += chunk;
        },
        onDone: () => {
          isDone = true;
        },
      });

      await waitFor(() => expect(isDone).toBe(true));
      expect(received).toContain('Jane Doe');
      expect(received).toContain('Infosys');
    });

    it('generates ATS resume diagnostic report in fallback mode', async () => {
      let received = '';
      let isDone = false;

      await streamChat({
        messages: [{ role: 'user', content: 'Analyze this resume' }],
        mode: 'resume-analysis',
        context: { domain: 'engineering', company: 'TCS' },
        onDelta: (chunk) => {
          received += chunk;
        },
        onDone: () => {
          isDone = true;
        },
      });

      await waitFor(() => expect(isDone).toBe(true));
      expect(received).toContain('ATS Match Score');
      expect(received).toContain('Core Strengths');
      expect(received).toContain('Areas for Optimization');
    });

    it('generates 2-week remediation roadmap for weak topics', async () => {
      let received = '';
      let isDone = false;

      await streamChat({
        messages: [{ role: 'user', content: 'Create a 2-week roadmap for my weak areas' }],
        mode: 'interview-prep',
        context: { domain: 'engineering', company: 'Google' },
        onDelta: (chunk) => {
          received += chunk;
        },
        onDone: () => {
          isDone = true;
        },
      });

      await waitFor(() => expect(isDone).toBe(true));
      expect(received).toContain('2-Week Targeted Remediation Plan');
      expect(received).toContain('Week 1: Fundamental Reconstruction');
      expect(received).toContain('Week 2: Speed Optimization');
    });

    it('safely computes placement score even when localStorage mock session is malformed', () => {
      localStorage.setItem('station_mock_sessions', '{invalid json');
      const score = usePerformanceStore.getState().getPlacementScore(5, 10);
      expect(score).toBeDefined();
      expect(typeof score.total).toBe('number');
      expect(score.total).toBeGreaterThan(0);
      localStorage.removeItem('station_mock_sessions');
    });
  });
});
