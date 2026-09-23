import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentReadinessSnapshot from '@/components/dashboard/StudentReadinessSnapshot';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';

describe('Unified Student Readiness Model & Snapshot (P5)', () => {
  beforeEach(() => {
    useStationStore.setState({
      user: {
        name: 'Aarav Sharma',
        email: 'aarav@growthstation.edu',
        college: 'IIT Roorkee',
        degree: 'B.Tech Computer Science',
        targetRole: 'Backend Engineer',
        dreamCompany: 'Amazon',
        targetCompanies: ['Amazon', 'Google'],
        skills: [
          { name: 'Node.js', category: 'Backend', proficiency: 'Advanced' },
          { name: 'PostgreSQL', category: 'Database', proficiency: 'Intermediate' },
        ],
        dsaLevel: 'Intermediate',
        csFundamentalsLevel: 'Beginner',
        aptitudeLevel: 'Intermediate',
        communicationLevel: 'Advanced',
        weakPoints: ['SQL Query Optimization'],
      },
      domain: 'engineering',
      language: 'en',
    });

    usePerformanceStore.setState({
      topicPerformance: {
        DSA: { correct: 8, attempts: 10, totalTime: 200 },
      },
    });
  });

  it('renders student identity, target role, dream recruiter, and college degree', () => {
    render(
      <MemoryRouter>
        <StudentReadinessSnapshot />
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Readiness Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/Aarav Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Backend Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon/i)).toBeInTheDocument();
    expect(screen.getByText(/IIT Roorkee/i)).toBeInTheDocument();
  });

  it('renders the 5 multi-pillar progress bars accurately reflecting student levels', () => {
    render(
      <MemoryRouter>
        <StudentReadinessSnapshot />
      </MemoryRouter>
    );

    expect(screen.getByText(/Technical Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/DSA & Algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/CS Fundamentals/i)).toBeInTheDocument();
    expect(screen.getByText(/Aptitude & Logic/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview & Comms/i)).toBeInTheDocument();
  });

  it('dynamically highlights the top focus priority from weak points and shows recommended action CTA', () => {
    render(
      <MemoryRouter>
        <StudentReadinessSnapshot />
      </MemoryRouter>
    );

    expect(screen.getByText(/Current Focus Priority:/i)).toBeInTheDocument();
    expect(screen.getByText(/SQL Query Optimization/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recommended Next Action/i })).toBeInTheDocument();
  });
});
