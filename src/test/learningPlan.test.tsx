import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizLearningReport, { type MissedQuizQuestion } from '@/components/quiz/QuizLearningReport';
import { findCurriculumForTopic, LEARNING_CURRICULUM } from '@/data/learningCurriculum';
import { useStationStore } from '@/store/useStationStore';

describe('Quiz Learning & Recovery System (P3)', () => {
  beforeEach(() => {
    useStationStore.setState({
      user: {
        name: 'Curriculum Tester',
        email: 'tester@growthstation.edu',
        college: 'BITS Pilani',
        city: 'Pilani',
        weakPoints: [],
      },
      language: 'en',
    });
  });

  it('correctly maps various quiz topics and question keywords to structured curriculum items', () => {
    const dsaCurriculum = findCurriculumForTopic('DSA', 'What is the time complexity of binary search?');
    expect(dsaCurriculum.id).toBe('dsa-binary-search-complexity');
    expect(dsaCurriculum.resources.length).toBeGreaterThan(0);

    const dbCurriculum = findCurriculumForTopic('Database', 'SQL JOIN that returns all rows from both tables?');
    expect(dbCurriculum.id).toBe('db-sql-joins');

    const netCurriculum = findCurriculumForTopic('Networking', 'Which protocol does HTTPS use for encryption?');
    expect(netCurriculum.id).toBe('networking-sysdesign-protocols');

    const aptCurriculum = findCurriculumForTopic('Aptitude', 'Compound interest on 10000 at 10% for 2 years?');
    expect(aptCurriculum.id).toBe('aptitude-arithmetic');
  });

  it('renders celebratory mastery state when 100% questions are answered correctly', () => {
    render(
      <QuizLearningReport
        missedQuestions={[]}
        quizTopic="DSA"
        accuracy={100}
      />
    );

    expect(screen.getByText(/Diagnostic Learning & Recovery System/i)).toBeInTheDocument();
    expect(screen.getByText(/Mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/Perfect Session! No Conceptual Gaps Found/i)).toBeInTheDocument();
  });

  it('renders identified conceptual gaps, mistake analysis, and curated resources for missed questions', () => {
    const mockMissed: MissedQuizQuestion[] = [
      {
        q: 'What is the time complexity of binary search?',
        topic: 'DSA',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correct: 1,
        selectedAnswer: 0,
        explanation: 'Binary search divides the search space in half each time.',
        section: 'iq',
      },
    ];

    render(
      <QuizLearningReport
        missedQuestions={mockMissed}
        quizTopic="DSA"
        accuracy={75}
      />
    );

    // Diagnostic summary
    expect(screen.getByText(/1 Gaps Diagnosed/i)).toBeInTheDocument();
    expect(screen.getByText(/Binary Search & Complexity Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Common Trap:/i)).toBeInTheDocument();

    // Session mistake analysis
    expect(screen.getByText(/Session Mistake Analysis:/i)).toBeInTheDocument();
    expect(screen.getByText(/What is the time complexity of binary search\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/O\(n\)/i).length).toBeGreaterThanOrEqual(1); // user's wrong answer
    expect(screen.getAllByText(/O\(log n\)/i).length).toBeGreaterThanOrEqual(1); // correct answer

    // Recommended resources
    expect(screen.getByText(/Recommended High-Yield Preparation Resources:/i)).toBeInTheDocument();
    expect(screen.getByText(/NeetCode/i)).toBeInTheDocument();
  });

  it('opens interactive study sheet modal when "Learn Concept" is clicked and shows formulas and drills', () => {
    const mockMissed: MissedQuizQuestion[] = [
      {
        q: 'SQL JOIN that returns all rows from both tables?',
        topic: 'Database',
        options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'],
        correct: 2,
        selectedAnswer: 1,
        explanation: 'FULL OUTER JOIN returns all rows from both tables.',
        section: 'rq',
      },
    ];

    render(
      <QuizLearningReport
        missedQuestions={mockMissed}
        quizTopic="Database"
        accuracy={60}
      />
    );

    const learnBtn = screen.getByRole('button', { name: /Learn Concept/i });
    fireEvent.click(learnBtn);

    // Modal is open
    expect(screen.getByText(/Master Sheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Prerequisites:/i)).toBeInTheDocument();
    expect(screen.getByText(/Core Conceptual Breakdown:/i)).toBeInTheDocument();
    expect(screen.getByText(/Immediate Recovery Practice Drills:/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close & Return to Results/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Immediate Recovery Practice Drills:/i)).not.toBeInTheDocument();
  });

  it('adds the concept as a focus task into student profile weak points', () => {
    const mockMissed: MissedQuizQuestion[] = [
      {
        q: 'Which protocol does HTTPS use for encryption?',
        topic: 'Networking',
        options: ['SSH', 'TLS/SSL', 'FTP', 'SMTP'],
        correct: 1,
        selectedAnswer: 0,
        explanation: 'HTTPS uses TLS to encrypt data in transit.',
        section: 'rq',
      },
    ];

    render(
      <QuizLearningReport
        missedQuestions={mockMissed}
        quizTopic="Networking"
        accuracy={50}
      />
    );

    const focusBtn = screen.getByRole('button', { name: /Focus Task/i });
    fireEvent.click(focusBtn);

    expect(screen.getByText(/Added to Focus/i)).toBeInTheDocument();
    expect(useStationStore.getState().user?.weakPoints).toContain(
      'HTTP/HTTPS, TLS Encryption & Distributed Systems'
    );
  });
});
