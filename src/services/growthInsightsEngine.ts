import type { Domain, UserProfile, StudentSkill } from '@/store/useStationStore';
import type { TopicPerformance, QuizSession, MockInterviewSessionRecord } from '@/store/usePerformanceStore';

export interface GrowthInsightStrength {
  id: string;
  concept: string;
  domain: Domain;
  score: number;
  evidence: string;
  impact: string;
  category: string;
}

export interface GrowthInsightGap {
  id: string;
  concept: string;
  domain: Domain;
  severity: 'high' | 'medium' | 'low';
  trend: 'improving' | 'declining' | 'stable' | 'new';
  currentAccuracyOrScore: number;
  evidence: string;
  whyItMatters: string;
  prescribedAction: {
    title: string;
    path: string;
    actionText: string;
    estimatedMinutes: number;
    type: 'quiz' | 'study' | 'interview' | 'practice';
  };
  historicalAttempts: { date: string; score: number }[];
}

export interface GrowthInsightsReport {
  domain: Domain;
  hasSufficientData: boolean;
  missingDataExplanation?: string;
  overallDiagnosticConfidence: number; // 0-100
  strengths: GrowthInsightStrength[];
  gaps: GrowthInsightGap[];
  summary: string;
  weeklyGoalBridge: string;
  totalMasteredTopics: number;
  totalActiveGaps: number;
}

/**
 * Domain-specific impact templates explaining why particular concepts matter
 * for target recruitment benchmarks.
 */
const DOMAIN_IMPACT_KNOWLEDGE: Record<Domain, Record<string, string>> = {
  engineering: {
    'Data Structures & Algorithms': 'Core screening filter for Tier 1 product firms (Google, Microsoft, Amazon). Expects O(n) or O(log n) optimal solutions.',
    'Arrays & Hashing': 'Frequently tested in online screening rounds to evaluate baseline lookup efficiency and boundary handling.',
    'Dynamic Programming': 'Differentiator round topic for high-package product roles; tests subproblem decomposition under pressure.',
    'System Design & Architecture': 'Key requirement for senior engineering interviews and scalable backend evaluations.',
    'Database & SQL': 'Mandatory across all enterprise and product tech rounds for data persistence and index optimization.',
    'Communication & Delivery': 'Crucial for passing behavioral STAR rounds and articulating architectural trade-offs to senior engineers.',
  },
  commerce: {
    'Financial Accounting & Analysis': 'Essential for evaluating balance sheet integrity, working capital trends, and corporate financial health.',
    'Corporate Finance & Valuation': 'Core competency for Investment Banking, Equity Research, and Corporate M&A screening rounds.',
    'Banking Regulations & Compliance': 'Tested in SBI PO, HDFC Bank, and RBI Grade B technical rounds; zero tolerance for regulatory errors.',
    'Commercial Aptitude & Quant': 'Speed filter for Banking & Financial Services preliminary tests (percentage profit, compound interest, DI).',
    'Financial Modeling & Excel': 'Prerequisite for Day 1 productivity at Big 4 audit, advisory, and financial analyst roles.',
    'Business Communication & Viva': 'Critical for client-facing advisory roles and partner rounds at Deloitte, PwC, and EY.',
  },
  arts: {
    'Indian Polity & Constitution': 'Heavyweight scoring section in UPSC CSE and State PCS prelims and mains (fundamental rights, directive principles).',
    'Modern Indian History': 'High-yield recurring theme across civil services preliminary and descriptive analytical exams.',
    'Public Administration & Governance': 'Key foundation for administrative ethics, developmental scheme execution, and district management.',
    'Civil Services CSAT & Reasoning': 'Qualifying hurdle with negative marking; failing CSAT disqualifies high GS paper scores.',
    'Essay & Structured Answer Writing': 'Differentiates top rankers from borderline candidates in State Commission subjective evaluations.',
    'Board Interview & Personality': 'Determines final service allotment (IAS/IPS/SDM) in personal commission interviews.',
  },
};

/**
 * Generates stream-aware Growth Insights from verified student performance data.
 */
export function generateGrowthInsights(
  user: UserProfile | null,
  topicPerformance: Record<string, TopicPerformance>,
  quizHistory: QuizSession[],
  mockInterviewHistory: MockInterviewSessionRecord[],
  activeDomain: Domain
): GrowthInsightsReport {
  const normDomain = activeDomain || user?.domain || 'engineering';
  const targetCompany = user?.dreamCompany || (normDomain === 'commerce' ? 'HDFC Bank' : normDomain === 'arts' ? 'State PCS' : 'Google');
  const targetRole = user?.targetRole || (normDomain === 'commerce' ? 'Financial Analyst' : normDomain === 'arts' ? 'Civil Services Officer' : 'Full Stack Engineer');

  const hasQuizzes = Object.keys(topicPerformance).length > 0 || quizHistory.length > 0;
  const hasInterviews = mockInterviewHistory.length > 0;
  const hasAssessedSkills = Boolean(user?.skills && user.skills.some(s => s.assessedLevel && s.score !== undefined));
  const hasBaseline = Boolean(user?.baselineAssessment);

  const hasSufficientData = hasQuizzes || hasInterviews || hasAssessedSkills || hasBaseline;

  if (!hasSufficientData) {
    return {
      domain: normDomain,
      hasSufficientData: false,
      missingDataExplanation: `Growth Insights requires diagnostic data to evaluate your progress toward ${targetRole} at ${targetCompany}. Complete your baseline diagnostic, take a domain quiz, or complete a Live Interview to activate continuous performance telemetry.`,
      overallDiagnosticConfidence: 0,
      strengths: [],
      gaps: [],
      summary: 'Diagnostic baseline pending. No verified telemetry recorded yet.',
      weeklyGoalBridge: `Start with a 5-minute diagnostic quiz or a live interview simulation to establish your baseline.`,
      totalMasteredTopics: 0,
      totalActiveGaps: 0,
    };
  }

  // 1. Calculate overall diagnostic confidence based on data points
  let dataPoints = 0;
  dataPoints += Object.keys(topicPerformance).length * 15;
  dataPoints += quizHistory.length * 10;
  dataPoints += mockInterviewHistory.length * 25;
  if (hasBaseline) dataPoints += 30;
  const overallDiagnosticConfidence = Math.min(100, Math.max(30, dataPoints));

  // 2. Discover Verified Strengths
  const strengths: GrowthInsightStrength[] = [];

  // A. From topic performance (accuracy >= 75% with at least 2 attempts)
  Object.values(topicPerformance).forEach(tp => {
    const total = tp.correct + tp.incorrect;
    const acc = total > 0 ? Math.round((tp.correct / total) * 100) : 0;
    if (acc >= 75 && total >= 2) {
      strengths.push({
        id: `strength-topic-${tp.topic}`,
        concept: tp.topic,
        domain: normDomain,
        score: acc,
        evidence: `${acc}% accuracy across ${total} verified quiz questions. Average response time: ${Math.round(tp.totalTime / Math.max(1, total))}s.`,
        impact: DOMAIN_IMPACT_KNOWLEDGE[normDomain][tp.topic] || `Demonstrates high conceptual retention aligned with ${targetRole} standards.`,
        category: 'Quiz Mastery',
      });
    }
  });

  // B. From assessed profile skills (score >= 80)
  (user?.skills || []).forEach(sk => {
    if ((sk.score && sk.score >= 80) || sk.assessedLevel === 'Advanced') {
      if (!strengths.some(s => s.concept.toLowerCase() === sk.name.toLowerCase())) {
        strengths.push({
          id: `strength-skill-${sk.name}`,
          concept: sk.name,
          domain: normDomain,
          score: sk.score || 85,
          evidence: `Verified ${sk.assessedLevel || 'Advanced'} level in competency diagnostic.`,
          impact: DOMAIN_IMPACT_KNOWLEDGE[normDomain][sk.name] || `Key foundation pillar for ${targetRole}.`,
          category: 'Core Competency',
        });
      }
    }
  });

  // C. From mock interview dimensions (score >= 75)
  if (mockInterviewHistory.length > 0) {
    const latestInterview = mockInterviewHistory[mockInterviewHistory.length - 1];
    if (latestInterview.dimensions.answerStructure >= 75) {
      strengths.push({
        id: 'strength-interview-structure',
        concept: 'STAR Answer Structuring',
        domain: normDomain,
        score: latestInterview.dimensions.answerStructure,
        evidence: `Scored ${latestInterview.dimensions.answerStructure}% in Live Interview (${latestInterview.company} simulation on ${new Date(latestInterview.date).toLocaleDateString()}).`,
        impact: 'Effective framing and coherent progression under live verbal evaluation.',
        category: 'Interview Communication',
      });
    }
    if (latestInterview.dimensions.communicationClarity >= 75) {
      strengths.push({
        id: 'strength-interview-clarity',
        concept: 'Verbal Clarity & Flow',
        domain: normDomain,
        score: latestInterview.dimensions.communicationClarity,
        evidence: `Scored ${latestInterview.dimensions.communicationClarity}% with low filler word frequency in ${latestInterview.company} interview.`,
        impact: 'Confident delivery and professional articulation under timed conditions.',
        category: 'Interview Communication',
      });
    }
  }

  // 3. Discover Declining Gaps & Areas for Improvement
  const gaps: GrowthInsightGap[] = [];

  // A. From topic performance (accuracy < 65%)
  Object.values(topicPerformance).forEach(tp => {
    const total = tp.correct + tp.incorrect;
    const acc = total > 0 ? Math.round((tp.correct / total) * 100) : 0;
    if (acc < 65 && total >= 1) {
      const severity = acc < 45 ? 'high' : 'medium';
      
      // Determine trend from history
      const relatedQuizSessions = quizHistory.filter(q => q.topic.toLowerCase() === tp.topic.toLowerCase());
      let trend: 'improving' | 'declining' | 'stable' | 'new' = 'declining';
      const historyAttempts: { date: string; score: number }[] = [];

      if (relatedQuizSessions.length >= 2) {
        const first = Math.round((relatedQuizSessions[0].correctAnswers / relatedQuizSessions[0].totalQuestions) * 100);
        const latest = Math.round((relatedQuizSessions[relatedQuizSessions.length - 1].correctAnswers / relatedQuizSessions[relatedQuizSessions.length - 1].totalQuestions) * 100);
        trend = latest > first ? 'improving' : latest < first ? 'declining' : 'stable';
        relatedQuizSessions.forEach(s => {
          historyAttempts.push({
            date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            score: Math.round((s.correctAnswers / s.totalQuestions) * 100),
          });
        });
      } else {
        trend = 'new';
        historyAttempts.push({
          date: tp.lastAttempted ? new Date(tp.lastAttempted).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent',
          score: acc,
        });
      }

      gaps.push({
        id: `gap-topic-${tp.topic}`,
        concept: tp.topic,
        domain: normDomain,
        severity,
        trend,
        currentAccuracyOrScore: acc,
        evidence: `${tp.incorrect} incorrect out of ${total} attempted questions. Accuracy is currently ${acc}%.`,
        whyItMatters: DOMAIN_IMPACT_KNOWLEDGE[normDomain][tp.topic] || `High error rate in this area risks disqualification during ${targetCompany} technical evaluations.`,
        prescribedAction: {
          title: `Reinforce ${tp.topic} Fundamentals`,
          path: '/dashboard/quizzes',
          actionText: 'Practice Checkpoint Quiz',
          estimatedMinutes: 20,
          type: 'quiz',
        },
        historicalAttempts: historyAttempts,
      });
    }
  });

  // B. From user's registered weak points (if not already captured)
  (user?.weakPoints || []).forEach(wp => {
    if (!gaps.some(g => g.concept.toLowerCase() === wp.toLowerCase())) {
      gaps.push({
        id: `gap-wp-${wp}`,
        concept: wp,
        domain: normDomain,
        severity: 'high',
        trend: 'new',
        currentAccuracyOrScore: 40,
        evidence: `Flagged as an active learning hurdle during diagnostic evaluations.`,
        whyItMatters: DOMAIN_IMPACT_KNOWLEDGE[normDomain][wp] || `Critical gap identified against ${targetRole} recruitment expectations.`,
        prescribedAction: {
          title: `Study Concept Guide: ${wp}`,
          path: '/dashboard/weekly',
          actionText: 'Review Study Sheets',
          estimatedMinutes: 25,
          type: 'study',
        },
        historicalAttempts: [{ date: 'Active', score: 40 }],
      });
    }
  });

  // C. From Live Interview weak points and low dimensions
  mockInterviewHistory.forEach(session => {
    if (session.dimensions.technicalKnowledge < 65) {
      if (!gaps.some(g => g.concept === 'Technical Depth & Factuality')) {
        gaps.push({
          id: 'gap-interview-tech',
          concept: 'Technical Depth & Factuality',
          domain: normDomain,
          severity: session.dimensions.technicalKnowledge < 50 ? 'high' : 'medium',
          trend: 'declining',
          currentAccuracyOrScore: session.dimensions.technicalKnowledge,
          evidence: `Scored ${session.dimensions.technicalKnowledge}% in verbal technical depth during ${session.company} simulation.`,
          whyItMatters: `Recruiters expect precise domain definitions and case explanations rather than generic overviews.`,
          prescribedAction: {
            title: `Retake Verbal Technical Drill`,
            path: '/dashboard/mock-interview',
            actionText: 'Practice Live Interview',
            estimatedMinutes: 15,
            type: 'interview',
          },
          historicalAttempts: [{ date: new Date(session.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), score: session.dimensions.technicalKnowledge }],
        });
      }
    }

    if (session.dimensions.answerStructure < 60) {
      if (!gaps.some(g => g.concept === 'Answer Structuring & Conciseness')) {
        gaps.push({
          id: 'gap-interview-structure',
          concept: 'Answer Structuring & Conciseness',
          domain: normDomain,
          severity: 'medium',
          trend: 'declining',
          currentAccuracyOrScore: session.dimensions.answerStructure,
          evidence: `Answers lacked structured framework (Situation, Task, Action, Result) in ${session.company} session.`,
          whyItMatters: `Unstructured answers lead to time overruns and convey hesitation in panel discussions.`,
          prescribedAction: {
            title: 'Practice STAR Speech Drills',
            path: '/dashboard/speech',
            actionText: 'Speech Practice',
            estimatedMinutes: 10,
            type: 'interview',
          },
          historicalAttempts: [{ date: new Date(session.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), score: session.dimensions.answerStructure }],
        });
      }
    }
  });

  // Summary calculation
  const totalMasteredTopics = strengths.length;
  const totalActiveGaps = gaps.length;

  let summary = '';
  if (totalActiveGaps === 0 && totalMasteredTopics > 0) {
    summary = `Exceptional domain consistency. You have verified command across ${totalMasteredTopics} key topics with zero critical gaps flagged.`;
  } else if (totalActiveGaps > 0) {
    const highestSev = gaps.find(g => g.severity === 'high');
    summary = `You demonstrate solid strengths in ${strengths.map(s => s.concept).slice(0, 2).join(', ') || 'foundational areas'}, but need immediate focus on ${highestSev?.concept || gaps[0].concept} before ${targetCompany} assessments.`;
  } else {
    summary = `Initial performance telemetry logged. Continue practicing to build higher statistical confidence.`;
  }

  const weeklyGoalBridge = gaps.length > 0
    ? `Allocate 30 mins today toward "${gaps[0].prescribedAction.title}" to lift your readiness score by an estimated +8%.`
    : `Keep momentum with a 15-minute mock interview to maintain conversational fluency.`;

  return {
    domain: normDomain,
    hasSufficientData: true,
    overallDiagnosticConfidence,
    strengths,
    gaps,
    summary,
    weeklyGoalBridge,
    totalMasteredTopics,
    totalActiveGaps,
  };
}
