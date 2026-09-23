import type { SkillProficiency, UserProfile } from '@/store/useStationStore';
import {
  type CompanyProfile,
  type CompanyRoleProfile,
  SUPPORTED_COMPANIES,
} from '@/data/companyPreparationData';
import {
  type LearningCurriculumItem,
  LEARNING_CURRICULUM,
} from '@/data/learningCurriculum';

export type SkillGapCategory = 'strong' | 'needs_improvement' | 'missing';

export interface SkillGapItem {
  skillName: string;
  category: SkillGapCategory;
  studentLevel: SkillProficiency | 'Not Listed';
  requiredLevel: SkillProficiency;
  score?: number;
  evidence?: string[];
  weakPointDetected?: boolean;
  curriculumItem?: LearningCurriculumItem;
  recommendation: string;
}

export interface SkillGapAnalysisResult {
  company: CompanyProfile;
  role: CompanyRoleProfile;
  strongSkills: SkillGapItem[];
  needsImprovementSkills: SkillGapItem[];
  missingSkills: SkillGapItem[];
  overallMatchPercentage: number;
  totalRequired: number;
  totalAcquired: number;
  priorityActions: string[];
}

/**
 * Finds the best matching curriculum item for a given skill or topic
 */
export function findCurriculumForSkill(skillName: string): LearningCurriculumItem | undefined {
  const norm = skillName.toLowerCase().trim();
  return LEARNING_CURRICULUM.find((item) => {
    const topicNorm = item.topicName.toLowerCase();
    const catNorm = item.category.toLowerCase();
    return (
      topicNorm.includes(norm) ||
      norm.includes(topicNorm) ||
      catNorm.includes(norm) ||
      item.prerequisites.some((p) => p.toLowerCase().includes(norm) || norm.includes(p.toLowerCase()))
    );
  });
}

/**
 * Normalizes proficiency into a numeric weight (0-100)
 */
function proficiencyToScore(level?: SkillProficiency): number {
  switch (level) {
    case 'Advanced':
      return 90;
    case 'Intermediate':
      return 70;
    case 'Beginner':
      return 45;
    default:
      return 0;
  }
}

/**
 * Performs a deep skill gap analysis comparing a student's profile and assessed competencies
 * against target company and role requirements.
 */
export function analyzeSkillGap(
  user: UserProfile,
  companyIdentifier: string,
  roleName?: string
): SkillGapAnalysisResult {
  // Find company
  const company =
    SUPPORTED_COMPANIES.find(
      (c) =>
        c.id.toLowerCase() === companyIdentifier.toLowerCase() ||
        c.name.toLowerCase() === companyIdentifier.toLowerCase()
    ) || SUPPORTED_COMPANIES[0];

  // Find role
  const role =
    company.roles.find(
      (r) =>
        roleName &&
        r.role.toLowerCase().includes(roleName.toLowerCase())
    ) ||
    company.roles[0];

  const studentSkills = user.skills || [];
  const weakPoints = user.weakPoints || [];
  const requiredSkills = role.requiredSkills || [];

  const strongSkills: SkillGapItem[] = [];
  const needsImprovementSkills: SkillGapItem[] = [];
  const missingSkills: SkillGapItem[] = [];

  let matchPoints = 0;
  const maxPoints = Math.max(requiredSkills.length, 1);

  requiredSkills.forEach((reqSkill) => {
    const studentSkill = studentSkills.find(
      (s) =>
        s.name.toLowerCase() === reqSkill.toLowerCase() ||
        reqSkill.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(reqSkill.toLowerCase())
    );

    const isWeakPoint = weakPoints.some(
      (w) =>
        w.toLowerCase() === reqSkill.toLowerCase() ||
        reqSkill.toLowerCase().includes(w.toLowerCase())
    );

    const curriculum = findCurriculumForSkill(reqSkill);
    const expectedProficiency: SkillProficiency = 'Intermediate';

    if (!studentSkill) {
      // Missing skill
      missingSkills.push({
        skillName: reqSkill,
        category: 'missing',
        studentLevel: 'Not Listed',
        requiredLevel: expectedProficiency,
        weakPointDetected: isWeakPoint,
        curriculumItem: curriculum,
        recommendation: `Add and learn ${reqSkill}. Start with the core principles in the learning vault.`,
      });
      return;
    }

    const effectiveScore =
      studentSkill.score !== undefined
        ? studentSkill.score
        : proficiencyToScore(studentSkill.assessedLevel || studentSkill.selfReportedLevel);

    const isAssessed = Boolean(studentSkill.assessedLevel && studentSkill.score !== undefined);

    if (effectiveScore >= 70 && !isWeakPoint) {
      // Strong skill
      matchPoints += 1;
      strongSkills.push({
        skillName: reqSkill,
        category: 'strong',
        studentLevel: studentSkill.assessedLevel || studentSkill.selfReportedLevel || 'Intermediate',
        requiredLevel: expectedProficiency,
        score: effectiveScore,
        evidence: studentSkill.evidence,
        weakPointDetected: false,
        curriculumItem: curriculum,
        recommendation: isAssessed
          ? `Solid verified mastery (${effectiveScore}%). Maintain problem-solving speed.`
          : `Self-reported ${studentSkill.selfReportedLevel}. Take a quick diagnostic quiz to verify.`,
      });
    } else {
      // Needs improvement
      matchPoints += 0.5;
      needsImprovementSkills.push({
        skillName: reqSkill,
        category: 'needs_improvement',
        studentLevel: studentSkill.assessedLevel || studentSkill.selfReportedLevel || 'Beginner',
        requiredLevel: expectedProficiency,
        score: effectiveScore,
        evidence: studentSkill.evidence,
        weakPointDetected: isWeakPoint || effectiveScore < 60,
        curriculumItem: curriculum,
        recommendation: isWeakPoint
          ? `Identified as a weak point (${effectiveScore}%). Review key misconceptions and formulas.`
          : `Working knowledge present, but below target recruitment threshold. Practice targeted drills.`,
      });
    }
  });

  const overallMatchPercentage = Math.min(
    100,
    Math.round((matchPoints / maxPoints) * 100)
  );

  const priorityActions: string[] = [];
  if (missingSkills.length > 0) {
    priorityActions.push(`Acquire high-priority requirement: ${missingSkills[0].skillName}`);
  }
  if (needsImprovementSkills.length > 0) {
    priorityActions.push(`Refine weak point: ${needsImprovementSkills[0].skillName}`);
  }
  if (role.prepHighlights && role.prepHighlights.length > 0) {
    priorityActions.push(role.prepHighlights[0]);
  }

  return {
    company,
    role,
    strongSkills,
    needsImprovementSkills,
    missingSkills,
    overallMatchPercentage,
    totalRequired: requiredSkills.length,
    totalAcquired: strongSkills.length,
    priorityActions,
  };
}

export type FocusPriorityTier = 'HIGH PRIORITY' | 'PRACTICE' | 'COMPANY PREP' | 'COMMUNICATION' | 'FOUNDATION';

export interface RecommendedFocusArea {
  id: string;
  priorityTier: FocusPriorityTier;
  title: string;
  skill: string;
  reason: string;
  path: string;
  actionText: string;
  estimatedMinutes: number;
}

/**
 * Returns prioritized personalized daily focus tasks based on actual student gaps,
 * real quiz performance, live interview telemetry, target role, and company syllabus.
 */
export function getRecommendedFocusAreas(
  user: UserProfile,
  topicPerformance?: Record<string, any>,
  mockInterviewHistory?: any[]
): RecommendedFocusArea[] {
  const recommendations: RecommendedFocusArea[] = [];
  const domain = (user.domain || 'engineering').toLowerCase();
  const targetCompany = user.dreamCompany || (domain === 'commerce' ? 'HDFC Bank' : domain === 'arts' ? 'State PCS' : 'Google');
  const targetRole = user.targetRole || (domain === 'commerce' ? 'Financial Analyst' : domain === 'arts' ? 'Civil Services Officer' : 'Software Engineer');

  // 1. EMPIRICAL QUIZ TELEMETRY: Identify topic with lowest accuracy / most mistakes
  if (topicPerformance && Object.keys(topicPerformance).length > 0) {
    const sortedLowTopics = Object.values(topicPerformance)
      .map((tp: any) => {
        const total = tp.correct + tp.incorrect;
        const accuracy = total > 0 ? Math.round((tp.correct / total) * 100) : 0;
        return { topic: tp.topic, total, incorrect: tp.incorrect, accuracy };
      })
      .filter(t => t.accuracy < 65 && t.total >= 1)
      .sort((a, b) => a.accuracy - b.accuracy);

    if (sortedLowTopics.length > 0) {
      const worst = sortedLowTopics[0];
      recommendations.push({
        id: `empirical-quiz-${worst.topic}`,
        priorityTier: 'HIGH PRIORITY',
        title: `${worst.topic} Precision Drills`,
        skill: worst.topic,
        reason: `Recent attempts show difficulty: ${worst.incorrect} missed of ${worst.total} questions (${worst.accuracy}% accuracy).`,
        path: '/dashboard/quizzes',
        actionText: 'Start Checkpoint Quiz',
        estimatedMinutes: 20,
      });
    }
  }

  // 2. LIVE INTERVIEW TELEMETRY: Identify weakest interview dimension
  if (mockInterviewHistory && mockInterviewHistory.length > 0) {
    const latest = mockInterviewHistory[mockInterviewHistory.length - 1];
    if (latest.dimensions) {
      if (latest.dimensions.answerStructure < 65) {
        recommendations.push({
          id: 'interview-structure-rehearsal',
          priorityTier: 'COMMUNICATION',
          title: 'STAR Answer Framing Rehearsal',
          skill: 'Interview Structuring',
          reason: `Recent ${latest.company} interview scored ${latest.dimensions.answerStructure}% on structure. Answers lacked clear Situation-Task-Action-Result flow.`,
          path: '/dashboard/speech',
          actionText: 'Speech Practice',
          estimatedMinutes: 15,
        });
      } else if (latest.dimensions.technicalKnowledge < 65) {
        recommendations.push({
          id: 'interview-technical-depth',
          priorityTier: 'COMMUNICATION',
          title: 'Live Technical Verbal Simulation',
          skill: 'Domain Articulation',
          reason: `Recent verbal technical depth scored ${latest.dimensions.technicalKnowledge}%. Practice explaining trade-offs aloud without hesitation.`,
          path: '/dashboard/mock-interview',
          actionText: 'Simulate Live Interview',
          estimatedMinutes: 20,
        });
      }
    }
  }

  // 3. ACTIVE PROFILE WEAK POINTS
  if (user.weakPoints && user.weakPoints.length > 0 && recommendations.length < 3) {
    const primaryWeak = user.weakPoints[0];
    const skillData = (user.skills || []).find(
      s => s.name.toLowerCase() === primaryWeak.toLowerCase()
    );
    const level = skillData?.assessedLevel || skillData?.selfReportedLevel || 'Developing';

    if (!recommendations.some(r => r.skill.toLowerCase() === primaryWeak.toLowerCase())) {
      recommendations.push({
        id: `wp-${primaryWeak}`,
        priorityTier: 'HIGH PRIORITY',
        title: `Address Weak Point: ${primaryWeak}`,
        skill: primaryWeak,
        reason: `Assessed competency is ${level} with active diagnostic gaps flagged for ${targetRole}.`,
        path: '/dashboard/quizzes',
        actionText: 'Review Notes & Drills',
        estimatedMinutes: 25,
      });
    }
  }

  // 4. COMPANY PREP: Stream-scoped company checkpoint
  if (recommendations.length < 3) {
    recommendations.push({
      id: 'company-prep',
      priorityTier: 'COMPANY PREP',
      title: `${targetCompany} Screening Checkpoint`,
      skill: `${targetCompany} Syllabus`,
      reason: `Directly benchmarked against verified ${targetCompany} rounds for ${targetRole}.`,
      path: '/dashboard/companies',
      actionText: 'View Syllabus',
      estimatedMinutes: 20,
    });
  }

  // 5. LIVE SIMULATION (if not already scheduled)
  if (recommendations.length < 4) {
    recommendations.push({
      id: 'mock-interview',
      priorityTier: 'COMMUNICATION',
      title: `Live Interview Simulation (${targetCompany})`,
      skill: 'Verbal Delivery & Presence',
      reason: `Rehearse verbal communication and technical questions with live speech analysis.`,
      path: '/dashboard/mock-interview',
      actionText: 'Enter Live Interview',
      estimatedMinutes: 15,
    });
  }

  // 6. UNVERIFIED SKILL: Fallback to diagnostic check
  const unassessedSkill = (user.skills || []).find(s => !s.assessedLevel && s.selfReportedLevel);
  if (unassessedSkill && recommendations.length < 4) {
    recommendations.push({
      id: `verify-${unassessedSkill.name}`,
      priorityTier: 'FOUNDATION',
      title: `Validate ${unassessedSkill.name} Competency`,
      skill: unassessedSkill.name,
      reason: `Reported as ${unassessedSkill.selfReportedLevel}. Take diagnostic to establish verified score.`,
      path: '/dashboard/baseline',
      actionText: 'Take Diagnostic',
      estimatedMinutes: 15,
    });
  }

  return recommendations.slice(0, 4);
}
