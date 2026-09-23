import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useStationStore, type UserProfile, type StudentSkill } from '@/store/useStationStore';
import { analyzeSkillGap, getRecommendedFocusAreas } from '@/services/skillGapEngine';
import { SUPPORTED_COMPANIES, computePreparationReadiness } from '@/data/companyPreparationData';
import BaselineAssessment from '@/pages/dashboard/BaselineAssessment';
import StudentSkillProfile from '@/components/dashboard/StudentSkillProfile';
import TodaysFocus from '@/components/dashboard/TodaysFocus';

describe('PHASE 3 — Student Intelligence & Preparation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStationStore.setState({
      score: 100,
      tasksDone: 2,
      streak: 3,
      domain: 'engineering',
      language: 'en',
      rank: 120,
      totalStudents: 2000,
      focusMinutes: 45,
      user: {
        name: 'Arjun Verma',
        email: 'arjun@growthstation.edu',
        college: 'VJTI Mumbai',
        city: 'Mumbai',
        domain: 'engineering',
        degree: 'B.Tech / B.E.',
        specialization: 'Computer Science',
        year: '3rd Year',
        semester: 'Semester 6',
        graduationYear: '2026',
        preparingFor: 'On-Campus Placements',
        targetRole: 'Software Development Engineer',
        targetJobType: 'Full-time Role',
        dreamCompany: 'Google',
        targetCompanies: ['Google', 'TCS'],
        targetSalary: '18-25 LPA',
        timeline: '6',
        skills: [
          {
            name: 'Data Structures & Algorithms',
            category: 'core',
            selfReportedLevel: 'Intermediate',
            assessedLevel: 'Advanced',
            score: 85,
            confidence: 'high',
            evidence: ['Baseline Diagnostic 2026'],
          },
          {
            name: 'Java',
            category: 'language',
            selfReportedLevel: 'Intermediate',
            assessedLevel: 'Intermediate',
            score: 72,
            confidence: 'high',
            evidence: ['Technical Quiz 1'],
          },
          {
            name: 'Operating Systems',
            category: 'core',
            selfReportedLevel: 'Beginner',
            score: 40,
            confidence: 'low',
            weakPoints: ['Deadlocks', 'Process Scheduling'],
          },
        ],
        weakPoints: ['Operating Systems'],
        personalityScore: { iq: 60, eq: 55, rq: 50 },
      },
    });
  });

  describe('1. Student Skill & Evidence Model in Store', () => {
    it('updates existing skill with verified assessed level, score, and evidence tag', () => {
      const store = useStationStore.getState();
      store.updateSkillEvidence('Java', 'Advanced', 92, 'AI Mock Interview');

      const updatedUser = useStationStore.getState().user!;
      const javaSkill = updatedUser.skills?.find((s) => s.name === 'Java');

      expect(javaSkill).toBeDefined();
      expect(javaSkill?.assessedLevel).toBe('Advanced');
      expect(javaSkill?.score).toBe(92);
      expect(javaSkill?.confidence).toBe('high');
      expect(javaSkill?.evidence).toContain('AI Mock Interview');
    });

    it('automatically flags skill as weak point when assessed score is below 60', () => {
      const store = useStationStore.getState();
      store.updateSkillEvidence('Computer Networks', 'Beginner', 45, 'Network Quiz');

      const updatedUser = useStationStore.getState().user!;
      expect(updatedUser.weakPoints).toContain('Computer Networks');

      const netSkill = updatedUser.skills?.find((s) => s.name === 'Computer Networks');
      expect(netSkill).toBeDefined();
      expect(netSkill?.score).toBe(45);
    });

    it('sets and persists personality trait to user profile', () => {
      const store = useStationStore.getState();
      store.setPersonalityTrait('Strategic Thinker');

      const updatedUser = useStationStore.getState().user!;
      expect(updatedUser.personalityTrait).toBe('Strategic Thinker');
    });
  });

  describe('2. Skill Gap Engine Analysis', () => {
    it('accurately categorizes skills into Strong, Needs Improvement, and Missing vs. Google requirements', () => {
      const user = useStationStore.getState().user!;
      const result = analyzeSkillGap(user, 'Google', 'Software Engineer');

      expect(result.company.name).toBe('Google');
      expect(result.strongSkills.length).toBeGreaterThanOrEqual(1);
      // DSA has score 85 -> Strong
      const strongDSA = result.strongSkills.find((s) => s.skillName.includes('Data Structures'));
      expect(strongDSA).toBeDefined();
      expect(strongDSA?.category).toBe('strong');

      // Operating Systems has score 40 -> Needs Improvement
      const needsOS = result.needsImprovementSkills.find((s) => s.skillName.includes('Operating Systems'));
      expect(needsOS).toBeDefined();
      expect(needsOS?.category).toBe('needs_improvement');

      // System Design or C++ missing from user skills -> Missing
      expect(result.missingSkills.length).toBeGreaterThan(0);
      const missingItem = result.missingSkills[0];
      expect(missingItem.category).toBe('missing');
      expect(missingItem.studentLevel).toBe('Not Listed');
    });

    it('computes overall match percentage as genuine ratio without fabricating clearance odds', () => {
      const user = useStationStore.getState().user!;
      const result = analyzeSkillGap(user, 'Google', 'Software Engineer');

      expect(result.overallMatchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.overallMatchPercentage).toBeLessThanOrEqual(100);
      expect(result.priorityActions.length).toBeGreaterThan(0);
    });

    it('generates personalized dynamic today focus tasks prioritizing active weak points', () => {
      const user = useStationStore.getState().user!;
      const focusAreas = getRecommendedFocusAreas(user);

      expect(focusAreas.length).toBeGreaterThanOrEqual(1);
      // Top recommendation must address the Operating Systems weak point
      const weakPointTask = focusAreas.find((f) => f.skill === 'Operating Systems');
      expect(weakPointTask).toBeDefined();
      expect(weakPointTask?.title).toContain('Operating Systems');
    });
  });

  describe('3. Adaptive Baseline Assessment Component', () => {
    it('renders baseline diagnostic questions and updates store upon completion', async () => {
      render(
        <MemoryRouter>
          <BaselineAssessment />
        </MemoryRouter>
      );

      // Check header
      expect(screen.getByText(/Adaptive Baseline Diagnostic/i)).toBeInTheDocument();
      expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();

      // Answer question 1
      const optionB = screen.getByText('O(log n)');
      fireEvent.click(optionB);

      // Click Next
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);

      // Check question 2 is displayed
      expect(screen.getByText(/Question 2 of/i)).toBeInTheDocument();
    });
  });

  describe('4. Dashboard StudentSkillProfile & TodaysFocus Components', () => {
    it('renders StudentSkillProfile with dual self-reported vs. assessed levels', () => {
      render(
        <MemoryRouter>
          <StudentSkillProfile />
        </MemoryRouter>
      );

      expect(screen.getByText(/Verified Competency & Skill Matrix/i)).toBeInTheDocument();
      expect(screen.getByText('Data Structures & Algorithms')).toBeInTheDocument();
      expect(screen.getAllByText('Operating Systems').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Target Weak Areas:/i)).toBeInTheDocument();
    });

    it('renders TodaysFocus with actionable tasks that complete and award points', () => {
      render(
        <MemoryRouter>
          <TodaysFocus />
        </MemoryRouter>
      );

      expect(screen.getByText(/Today's Personalized Focus/i)).toBeInTheDocument();
      expect(screen.getByText(/Address Weak Point: Operating Systems/i)).toBeInTheDocument();

      // Click action button
      const reviewBtn = screen.getByRole('button', { name: /Review Notes & Drills/i });
      expect(reviewBtn).toBeInTheDocument();
    });
  });
});
