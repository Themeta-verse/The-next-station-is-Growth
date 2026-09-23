import {
  findCurriculumForTopic,
  type LearningCurriculumItem,
  type LearningResource,
} from '@/data/learningCurriculum';
import type { SkillProficiency } from '@/store/useStationStore';

export interface StructuredLearningStep {
  stepNumber: number;
  phase: 'Prerequisites' | 'Core Concept' | 'Example & Invariants' | 'Practice Drill' | 'Reassessment Checkpoint';
  title: string;
  description: string;
  estimatedMinutes: number;
  actionType: 'read' | 'watch' | 'practice' | 'verify';
  resource?: LearningResource;
}

export interface WeakPointLearningPath {
  topicName: string;
  assessedLevel: SkillProficiency;
  curriculumItem: LearningCurriculumItem;
  misconception: string;
  whyMissedExplanation: string;
  steps: StructuredLearningStep[];
  primaryResource: LearningResource;
  referenceResource?: LearningResource;
  practiceResource?: LearningResource;
  practiceDrills: { prompt: string; hint: string }[];
  checkpointCriteria: {
    requiredScorePct: number;
    questionCount: number;
    description: string;
  };
  totalEstimatedMinutes: number;
}

export interface ReassessmentQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ReassessmentResult {
  isMastered: boolean;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  newAssessedLevel: SkillProficiency;
  feedbackMessage: string;
  nextRecommendedAction: string;
}

/**
 * Generates an end-to-end evidence-based learning path for any identified weak point.
 */
export function generateWeakPointLearningPath(
  topicName: string,
  currentLevel: SkillProficiency = 'Beginner',
  missedQuestionPrompt?: string
): WeakPointLearningPath {
  const curriculum = findCurriculumForTopic(topicName, missedQuestionPrompt);

  const primaryRes = curriculum.resources[0];
  const refRes = curriculum.resources[1] || curriculum.resources[0];
  const practiceRes = curriculum.resources.find(r => r.type === 'interactive') || curriculum.resources[2];

  const steps: StructuredLearningStep[] = [
    {
      stepNumber: 1,
      phase: 'Prerequisites',
      title: `Verify Foundations: ${curriculum.prerequisites.slice(0, 2).join(' & ')}`,
      description: `Ensure working mastery of prerequisites (${curriculum.prerequisites.join(', ')}) before tackling advanced patterns.`,
      estimatedMinutes: 10,
      actionType: 'read',
    },
    {
      stepNumber: 2,
      phase: 'Core Concept',
      title: `Learn Mental Model: ${curriculum.topicName}`,
      description: curriculum.conceptSummary[0] || 'Understand core mechanism and theoretical invariants.',
      estimatedMinutes: primaryRes.estimatedMinutes || 15,
      actionType: primaryRes.type === 'video' ? 'watch' : 'read',
      resource: primaryRes,
    },
    {
      stepNumber: 3,
      phase: 'Example & Invariants',
      title: 'Analyze Invariants & Avoid Common Traps',
      description: `Avoid the common pitfall: ${curriculum.misconception}`,
      estimatedMinutes: 10,
      actionType: 'read',
      resource: refRes,
    },
    {
      stepNumber: 4,
      phase: 'Practice Drill',
      title: 'Targeted Hands-On Practice',
      description: curriculum.practiceDrills[0]?.prompt || 'Solve 2-3 targeted algorithmic problems.',
      estimatedMinutes: 20,
      actionType: 'practice',
      resource: practiceRes,
    },
    {
      stepNumber: 5,
      phase: 'Reassessment Checkpoint',
      title: 'Validation Checkpoint Quiz (Score ≥ 75% to Clear)',
      description: 'Take the diagnostic checkpoint quiz to verify retention and update your assessed skill profile.',
      estimatedMinutes: 10,
      actionType: 'verify',
    },
  ];

  const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  const whyMissedExplanation = missedQuestionPrompt
    ? `Based on your diagnostic attempt: ${curriculum.misconception}`
    : curriculum.misconception;

  return {
    topicName,
    assessedLevel: currentLevel,
    curriculumItem: curriculum,
    misconception: curriculum.misconception,
    whyMissedExplanation,
    steps,
    primaryResource: primaryRes,
    referenceResource: refRes,
    practiceResource: practiceRes,
    practiceDrills: curriculum.practiceDrills,
    checkpointCriteria: {
      requiredScorePct: 75,
      questionCount: curriculum.checkpointQuestions?.length || 3,
      description: 'Demonstrate ≥ 75% accuracy on conceptual questions to mark this weakness as resolved.',
    },
    totalEstimatedMinutes: totalMinutes,
  };
}

/**
 * Retrieves the diagnostic checkpoint questions for a given topic
 */
export function getReassessmentCheckpoint(topicName: string): ReassessmentQuestion[] {
  const curriculum = findCurriculumForTopic(topicName);
  if (curriculum.checkpointQuestions && curriculum.checkpointQuestions.length > 0) {
    return curriculum.checkpointQuestions;
  }

  // Fallback diagnostic questions
  return [
    {
      question: `Which fundamental principle governs optimal implementation of ${curriculum.topicName}?`,
      options: [
        'Brute force iteration over all permutations',
        'Preserving invariant state transitions and boundary checks',
        'Randomized heuristics without mathematical bounds',
        'Disregarding memory allocation limits',
      ],
      correct: 1,
      explanation: `Optimal problem solving in ${curriculum.topicName} requires maintaining invariants and adhering to boundary preconditions.`,
    },
    {
      question: `What is a common misconception when handling ${curriculum.topicName}?`,
      options: [
        'Ignoring worst-case degradation and edge-case boundary conditions',
        'Documenting time and space complexities',
        'Writing clean variable names',
        'Testing with empty inputs',
      ],
      correct: 0,
      explanation: curriculum.misconception,
    },
  ];
}

/**
 * Evaluates reassessment attempt against mastery threshold
 */
export function evaluateReassessmentAttempt(
  correctAnswers: number,
  totalQuestions: number,
  previousLevel: SkillProficiency = 'Beginner'
): ReassessmentResult {
  const pct = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100);
  const isMastered = pct >= 75;

  let newAssessedLevel: SkillProficiency = previousLevel;
  if (isMastered) {
    newAssessedLevel = pct >= 90 ? 'Advanced' : 'Intermediate';
  }

  return {
    isMastered,
    scorePercentage: pct,
    correctCount: correctAnswers,
    totalQuestions,
    newAssessedLevel,
    feedbackMessage: isMastered
      ? `Verified Mastery! You scored ${pct}% on this checkpoint, clearing the weak point and updating your competency level to ${newAssessedLevel}.`
      : `Score: ${pct}%. The mastery threshold is 75%. Review the reference notes and practice drills before retaking.`,
    nextRecommendedAction: isMastered
      ? 'Return to your dashboard or advance to the next roadmap milestone.'
      : 'Review the primary resource and retry the checkpoint.',
  };
}
