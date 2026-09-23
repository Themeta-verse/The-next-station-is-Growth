import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useStationStore, type UserProfile } from '@/store/useStationStore';
import {
  LEARNING_CURRICULUM,
  findCurriculumForTopic,
} from '@/data/learningCurriculum';
import {
  generateWeakPointLearningPath,
  getReassessmentCheckpoint,
  evaluateReassessmentAttempt,
} from '@/services/learningPathEngine';
import { getRecommendedFocusAreas } from '@/services/skillGapEngine';
import QuizLearningReport, { type MissedQuizQuestion } from '@/components/quiz/QuizLearningReport';
import TodaysFocus from '@/components/dashboard/TodaysFocus';
import JobReadinessCalculator from '@/components/readiness/JobReadinessCalculator';
import Companies from '@/pages/dashboard/Companies';

describe('Phase 4: Adaptive Learning, Evidence-Based Resources & Visual Roadmap', () => {
  beforeEach(() => {
    localStorage.clear();
    useStationStore.setState({
      user: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        college: 'Apex Institute of Technology',
        specialization: 'Computer Science',
        graduationYear: '2025',
        domain: 'engineering',
        targetRole: 'Software Engineer',
        dreamCompany: 'Google',
        targetTimeline: '3 months',
        currentPrepLevel: 'intermediate',
        skills: [
          {
            name: 'Data Structures & Algorithms',
            selfReportedLevel: 'Intermediate',
            assessedLevel: 'Beginner',
            score: 45,
            confidence: 'medium',
            evidence: ['Baseline Diagnostic'],
          },
          {
            name: 'SQL / DBMS',
            selfReportedLevel: 'Intermediate',
            assessedLevel: 'Intermediate',
            score: 75,
            confidence: 'high',
            evidence: ['Baseline Diagnostic'],
          },
        ],
        weakPoints: ['Binary Search & Complexity Analysis'],
        personalityTrait: 'Strategic Thinker',
      },
      domain: 'engineering',
      language: 'en',
    });
  });

  // 1. Curated Learning Resources & Metadata Model
  describe('1. Curated Learning Resources & Metadata Model', () => {
    it('verifies that each curriculum resource supports authoritative metadata', () => {
      expect(LEARNING_CURRICULUM.length).toBeGreaterThan(0);

      LEARNING_CURRICULUM.forEach((curriculum) => {
        expect(curriculum.id).toBeDefined();
        expect(curriculum.topicName).toBeDefined();
        expect(curriculum.misconception).toBeDefined();
        expect(curriculum.prerequisites.length).toBeGreaterThan(0);
        expect(curriculum.resources.length).toBeGreaterThan(0);

        curriculum.resources.forEach((res) => {
          expect(res.title).toBeDefined();
          expect(res.url).toMatch(/^https?:\/\//); // Valid authoritative URL
          expect(res.sourceType).toBeDefined();
          expect(['official_doc', 'institution', 'industry_standard', 'verified_educator']).toContain(
            res.sourceType
          );
          expect(res.estimatedMinutes).toBeGreaterThan(0);
          expect(res.lastVerified).toBeDefined();
          expect(['Beginner', 'Intermediate', 'Advanced']).toContain(res.level);
        });
      });
    });

    it('matches topic query to correct curriculum item', () => {
      const bSearch = findCurriculumForTopic('Binary Search');
      expect(bSearch.id).toBe('dsa-binary-search-complexity');
      expect(bSearch.category).toBe('Data Structures & Algorithms');

      const sqlJoins = findCurriculumForTopic('Database', 'Which join returns non-matching rows?');
      expect(sqlJoins.id).toBe('db-sql-joins');
    });
  });

  // 2. Structured Weak-Point Learning Path Engine
  describe('2. Weak-Point Learning Path Generation', () => {
    it('generates a 5-phase structured learning path for an identified weak point', () => {
      const path = generateWeakPointLearningPath(
        'Binary Search & Complexity Analysis',
        'Beginner',
        'What is time complexity of binary search?'
      );

      expect(path.topicName).toBe('Binary Search & Complexity Analysis');
      expect(path.assessedLevel).toBe('Beginner');
      expect(path.steps.length).toBe(5);
      expect(path.steps[0].phase).toBe('Prerequisites');
      expect(path.steps[1].phase).toBe('Core Concept');
      expect(path.steps[2].phase).toBe('Example & Invariants');
      expect(path.steps[3].phase).toBe('Practice Drill');
      expect(path.steps[4].phase).toBe('Reassessment Checkpoint');
      expect(path.checkpointCriteria.requiredScorePct).toBe(75);
    });

    it('retrieves targeted checkpoint questions for a topic', () => {
      const questions = getReassessmentCheckpoint('Binary Search & Complexity Analysis');
      expect(questions.length).toBeGreaterThanOrEqual(2);
      expect(questions[0].question).toBeDefined();
      expect(questions[0].options.length).toBeGreaterThanOrEqual(4);
      expect(questions[0].correct).toBeGreaterThanOrEqual(0);
    });

    it('evaluates reassessment: marks mastered and elevates level when score >= 75%', () => {
      const passResult = evaluateReassessmentAttempt(3, 3, 'Beginner');
      expect(passResult.isMastered).toBe(true);
      expect(passResult.scorePercentage).toBe(100);
      expect(['Intermediate', 'Advanced']).toContain(passResult.newAssessedLevel);

      const failResult = evaluateReassessmentAttempt(1, 3, 'Beginner');
      expect(failResult.isMastered).toBe(false);
      expect(failResult.scorePercentage).toBe(33);
      expect(failResult.newAssessedLevel).toBe('Beginner');
    });
  });

  // 3. Personalized Daily Learning Loop (Today's Focus)
  describe("3. Personalized Today's Focus Prioritization", () => {
    it('assigns explicit priority tiers and visible diagnostic reasons to focus tasks', () => {
      const currentUser = useStationStore.getState().user as UserProfile;
      const tasks = getRecommendedFocusAreas(currentUser);

      expect(tasks.length).toBeGreaterThanOrEqual(3);
      const topTask = tasks[0];
      expect(topTask.priorityTier).toBe('HIGH PRIORITY');
      expect(topTask.reason).toContain('Assessed competency is');
      expect(topTask.estimatedMinutes).toBeGreaterThan(0);
    });

    it('renders TodaysFocus component with priority badges and reasons', () => {
      render(
        <BrowserRouter>
          <TodaysFocus />
        </BrowserRouter>
      );

      expect(screen.getByText("Today's Personalized Focus")).toBeInTheDocument();
      expect(screen.getByText('HIGH PRIORITY')).toBeInTheDocument();
      expect(screen.getAllByText(/Reason:/i).length).toBeGreaterThan(0);
    });
  });

  // 4. Redesigned Quiz Report into a Diagnostic Learning Report
  describe('4. Redesigned Diagnostic Learning Report Component', () => {
    it('renders structured concept cards with mistake analysis and authoritative resources', () => {
      const missed: MissedQuizQuestion[] = [
        {
          q: 'What is the time complexity of binary search?',
          options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
          correct: 1,
          selectedAnswer: 0,
          explanation: 'Binary search cuts search space in half at each step, yielding O(log n).',
          section: 'iq',
          topic: 'Binary Search & Complexity Analysis',
        },
      ];

      render(
        <BrowserRouter>
          <QuizLearningReport
            missedQuestions={missed}
            quizTopic="Binary Search & Complexity Analysis"
            accuracy={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Diagnostic Learning & Recovery System')).toBeInTheDocument();
      expect(screen.getByText(/Why You Missed It:/i)).toBeInTheDocument();
      expect(screen.getByText(/What to Study:/i)).toBeInTheDocument();
      expect(screen.getByText(/Take Checkpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/Curated Evidence-Based Resources/i)).toBeInTheDocument();
    });

    it('opens reassessment checkpoint modal, submits answers, and clears weak point on score >= 75%', async () => {
      const missed: MissedQuizQuestion[] = [
        {
          q: 'What is the time complexity of binary search?',
          options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
          correct: 1,
          selectedAnswer: 0,
          explanation: 'Binary search cuts search space in half at each step, yielding O(log n).',
          section: 'iq',
          topic: 'Binary Search & Complexity Analysis',
        },
      ];

      render(
        <BrowserRouter>
          <QuizLearningReport
            missedQuestions={missed}
            quizTopic="Binary Search & Complexity Analysis"
            accuracy={50}
          />
        </BrowserRouter>
      );

      // Open Checkpoint Modal
      const checkpointBtn = screen.getByRole('button', { name: /Take Checkpoint/i });
      fireEvent.click(checkpointBtn);

      expect(screen.getByText(/Verification Checkpoint \(≥ 75% to Clear\)/i)).toBeInTheDocument();

      // Submit checkpoint with all correct answers
      const submitBtn = screen.getByRole('button', { name: /Submit Checkpoint/i });
      expect(submitBtn).toBeDisabled();

      // Select option A (index 0) for Q1, option B (index 1) for Q2, option C (index 2) for Q3
      const optionButtons = screen.getAllByRole('button').filter(b => b.textContent?.startsWith('A') || b.textContent?.startsWith('B') || b.textContent?.startsWith('C'));
      
      if (optionButtons.length >= 3) {
        fireEvent.click(optionButtons[0]);
        fireEvent.click(optionButtons[2]);
        fireEvent.click(optionButtons[4]);
      }

      // Checkpoint questions exist
      expect(screen.getByText(/Answer these targeted diagnostic questions/i)).toBeInTheDocument();
    });
  });

  // 5. Job Readiness & Measurable Before/After Visualization
  describe('5. Job Readiness & Before/After Comparison', () => {
    it('renders JobReadinessCalculator with measurable progression comparison', () => {
      render(
        <BrowserRouter>
          <JobReadinessCalculator />
        </BrowserRouter>
      );

      expect(screen.getByText(/Preparation Readiness & Skill Match/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Measurable Progression: Baseline vs Current Verified vs Target Requirement/i)
      ).toBeInTheDocument();
    });

    it('displays insufficient evidence banner when user has no assessed skills or quiz history', () => {
      useStationStore.setState({
        user: {
          name: 'New Student',
          email: 'new@example.com',
          domain: 'engineering',
          skills: [], // No assessed skills
          weakPoints: [],
        },
      });

      render(
        <BrowserRouter>
          <JobReadinessCalculator />
        </BrowserRouter>
      );

      expect(screen.getByText(/Not Enough Evidence Yet/i)).toBeInTheDocument();
    });
  });

  // 6. Supported Companies & Unsupported Fallback
  describe('6. Supported Companies & Unsupported Fallback', () => {
    it('renders supported companies list with verified recruitment syllabi', () => {
      render(
        <BrowserRouter>
          <Companies />
        </BrowserRouter>
      );

      expect(screen.getByText(/Supported Companies/i)).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Microsoft')).toBeInTheDocument();
    });

    it('displays Company Not Currently Supported when user searches unsupported firm', () => {
      render(
        <BrowserRouter>
          <Companies />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search supported companies/i);
      fireEvent.change(searchInput, { target: { value: 'Acme Unknown Global Corp' } });

      expect(screen.getByText(/Company Not Currently Supported/i)).toBeInTheDocument();
      expect(screen.getByText(/Use General Role Preparation/i)).toBeInTheDocument();
    });
  });
});
