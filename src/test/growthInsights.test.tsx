import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { generateGrowthInsights } from '@/services/growthInsightsEngine';
import GrowthInsights from '@/pages/dashboard/GrowthInsights';
import { useStationStore, type UserProfile } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';

describe('Growth Insights Engine & Component', () => {
  beforeEach(() => {
    useStationStore.setState({
      domain: 'engineering',
      language: 'en',
      user: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        domain: 'engineering',
        targetRole: 'Distributed Systems Engineer',
        dreamCompany: 'Google',
        skills: [
          {
            name: 'Data Structures & Algorithms',
            category: 'core',
            selfReportedLevel: 'Advanced',
            assessedLevel: 'Advanced',
            score: 88,
            confidence: 'high',
            evidence: ['Algorithms Diagnostic: 88%'],
          },
          {
            name: 'System Design & Architecture',
            category: 'system',
            selfReportedLevel: 'Beginner',
            assessedLevel: 'Beginner',
            score: 42,
            confidence: 'medium',
            evidence: ['Distributed Cache Quiz: 42%'],
          },
        ],
      },
    });

    usePerformanceStore.setState({
      topicPerformance: {
        'System Design & Architecture': {
          topic: 'System Design & Architecture',
          domain: 'engineering',
          correct: 4,
          incorrect: 6,
          totalTime: 400,
          lastAttemptDate: '2026-09-20',
          streak: 0,
        },
      },
      quizHistory: [
        {
          quizId: 'q1',
          title: 'System Design',
          topic: 'System Design & Architecture',
          domain: 'engineering',
          score: 40,
          totalQuestions: 10,
          completedAt: '2026-09-20',
          timeSpentSeconds: 300,
          accuracy: 40,
        },
      ],
      mockInterviewHistory: [
        {
          id: 'int-1',
          company: 'Google',
          role: 'Distributed Systems Engineer',
          domain: 'engineering',
          date: '2026-09-21',
          overallScore: 65,
          dimensions: {
            knowledgeAccuracy: 55,
            answerStructure: 70,
            technicalKnowledge: 55,
            clarityTone: 68,
            communicationDelivery: 72,
            problemSolving: 60,
          },
          feedback: 'Solid framing, needs deeper concurrency specifics.',
          strengths: ['Clear communication'],
          improvements: ['Shallow depth on concurrency primitives'],
          followUpNotes: 'Review mutexes and distributed locks.',
        },
      ],
    });
  });

  it('generates stream-specific insights for Engineering', () => {
    const user: UserProfile = {
      name: 'Alex Rivera',
      domain: 'engineering',
      targetRole: 'Distributed Systems Engineer',
      skills: [
        {
          name: 'Data Structures & Algorithms',
          category: 'core',
          selfReportedLevel: 'Advanced',
          assessedLevel: 'Advanced',
          score: 88,
          confidence: 'high',
          evidence: ['Algorithms Diagnostic: 88%'],
        },
      ],
    };

    const topicPerf = {
      'System Design & Architecture': {
        topic: 'System Design & Architecture',
        domain: 'engineering' as const,
        correct: 4,
        incorrect: 6,
        totalTime: 400,
        lastAttemptDate: '2026-09-20',
        streak: 0,
      },
    };

    const mockInterviews = [
      {
        id: 'int-1',
        company: 'Google',
        role: 'Distributed Systems Engineer',
        domain: 'engineering' as const,
        date: '2026-09-21',
        overallScore: 65,
        dimensions: {
          knowledgeAccuracy: 55,
          answerStructure: 70,
          technicalKnowledge: 55,
          clarityTone: 68,
          communicationDelivery: 72,
          problemSolving: 60,
        },
        feedback: 'Solid',
        strengths: ['Clear communication'],
        improvements: ['Deepen concurrency primitives'],
        followUpNotes: 'Focus on distributed lock implementations',
      },
    ];

    const report = generateGrowthInsights(user, topicPerf, [], mockInterviews, 'engineering');

    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.gaps.length).toBeGreaterThan(0);
    expect(report.hasSufficientData).toBe(true);

    const gap = report.gaps[0];
    expect(gap.concept).toBeDefined();
    expect(gap.evidence).toBeDefined();
    expect(gap.whyItMatters).toBeDefined();
    expect(gap.prescribedAction).toBeDefined();
    expect(gap.trend).toBeDefined();

    // Must cite empirical metrics
    expect(gap.evidence).toMatch(/40%|concurrency|questions/i);
  });

  it('strictly isolates Commerce domain and never references software/coding metrics', () => {
    const commerceUser: UserProfile = {
      name: 'Priya Mehta',
      domain: 'commerce',
      targetRole: 'Investment Banking Analyst',
      skills: [
        {
          name: 'Financial Accounting & Analysis',
          category: 'core',
          selfReportedLevel: 'Advanced',
          assessedLevel: 'Advanced',
          score: 88,
          confidence: 'high',
          evidence: ['DCF & LBO Assessment'],
        },
      ],
    };

    const topicPerf = {
      'Working Capital Analysis': {
        topic: 'Working Capital Analysis',
        domain: 'commerce' as const,
        correct: 3,
        incorrect: 5,
        totalTime: 360,
        lastAttemptDate: '2026-09-22',
        streak: 0,
      },
    };

    const report = generateGrowthInsights(commerceUser, topicPerf, [], [], 'commerce');

    const allText = JSON.stringify(report).toLowerCase();
    expect(allText).not.toContain('dsa');
    expect(allText).not.toContain('leetcode');
    expect(allText).not.toContain('git repository');
    expect(allText).not.toContain('algorithmic');

    // Should include corporate/financial terminology
    expect(report.gaps.length).toBeGreaterThan(0);
    expect(report.gaps[0].concept).toContain('Working Capital Analysis');
  });

  it('strictly isolates Arts domain and never references software/coding metrics', () => {
    const artsUser: UserProfile = {
      name: 'Aarav Shastri',
      domain: 'arts',
      targetRole: 'Policy Analyst',
      skills: [
        {
          name: 'Constitutional Governance',
          category: 'core',
          selfReportedLevel: 'Advanced',
          assessedLevel: 'Advanced',
          score: 90,
          confidence: 'high',
          evidence: ['Constitutional Articles Review'],
        },
      ],
    };

    const topicPerf = {
      'Public Administration & Governance': {
        topic: 'Public Administration & Governance',
        domain: 'arts' as const,
        correct: 2,
        incorrect: 4,
        totalTime: 300,
        lastAttemptDate: '2026-09-21',
        streak: 0,
      },
    };

    const report = generateGrowthInsights(artsUser, topicPerf, [], [], 'arts');

    const allText = JSON.stringify(report).toLowerCase();
    expect(allText).not.toContain('dsa');
    expect(allText).not.toContain('coding');
    expect(allText).not.toContain('financial accounting');

    expect(report.gaps.length).toBeGreaterThan(0);
    expect(report.gaps[0].concept).toContain('Public Administration & Governance');
  });

  it('handles empty telemetry gracefully without inventing fake data', () => {
    const emptyUser: UserProfile = {
      name: 'New Student',
      domain: 'engineering',
      targetRole: 'Frontend Developer',
      skills: [],
    };

    const report = generateGrowthInsights(emptyUser, {}, [], [], 'engineering');

    expect(report.hasSufficientData).toBe(false);
    expect(report.strengths.length).toBe(0);
    expect(report.gaps.length).toBe(0);
    expect(report.missingDataExplanation).toMatch(/diagnostic data|baseline/i);
  });

  it('renders GrowthInsights dashboard page with active telemetry', () => {
    render(
      <MemoryRouter>
        <GrowthInsights />
      </MemoryRouter>
    );

    expect(screen.getByText(/GROWTH INSIGHTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Improvement Zone/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Strengths/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Data Structures & Algorithms/i).length).toBeGreaterThan(0);
  });
});
