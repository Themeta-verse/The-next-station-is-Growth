// ─────────────────────────────────────────────
//  scoringEngine.ts  —  Growth Station Leaderboard
// ─────────────────────────────────────────────

export interface ScoreBreakdown {
  quizPoints: number;
  accuracyBonus: number;
  streakBonus: number;
  consistencyScore: number;
  activityScore: number;
  mockInterviewBonus: number;
  total: number;
}

export interface ScoreEvent {
  type: 'quiz' | 'mock_interview' | 'daily_login' | 'task_complete' | 'streak_milestone';
  accuracy?: number;       // 0–100
  questionsAnswered?: number;
  timeTakenMs?: number;
  streak?: number;
  activeDays?: number;     // days active in last 30
}

// Weights (tweak freely)
const W = {
  QUIZ_BASE: 10,           // per question answered
  ACCURACY_MULTIPLIER: 2,  // extra pts per accuracy %
  STREAK_BASE: 5,          // per day streak
  STREAK_MILESTONE: [7, 14, 30], // bonus thresholds
  STREAK_MILESTONE_BONUS: [50, 120, 300],
  CONSISTENCY_PER_DAY: 8,  // per active day in last 30
  MOCK_INTERVIEW: 80,      // flat per completion
  TASK_COMPLETE: 15,
  SPEED_BONUS: 20,         // if answered faster than avg
  PERFECT_ACCURACY_BONUS: 50,
} as const;

export function calculateEventScore(event: ScoreEvent): ScoreBreakdown {
  let quizPoints = 0;
  let accuracyBonus = 0;
  let streakBonus = 0;
  let consistencyScore = 0;
  let activityScore = 0;
  let mockInterviewBonus = 0;

  if (event.type === 'quiz') {
    const questions = event.questionsAnswered ?? 5;
    const accuracy = event.accuracy ?? 50;
    quizPoints = questions * W.QUIZ_BASE;
    accuracyBonus = Math.floor((accuracy / 100) * W.ACCURACY_MULTIPLIER * quizPoints);
    if (accuracy >= 100) accuracyBonus += W.PERFECT_ACCURACY_BONUS;
    // Speed bonus
    const avgMsPerQ = 30_000;
    const actualMs = event.timeTakenMs ?? avgMsPerQ * questions;
    if (actualMs < avgMsPerQ * questions * 0.7) {
      accuracyBonus += W.SPEED_BONUS;
    }
  }

  if (event.type === 'mock_interview') {
    mockInterviewBonus = W.MOCK_INTERVIEW;
  }

  if (event.type === 'task_complete') {
    activityScore += W.TASK_COMPLETE;
  }

  if (event.type === 'daily_login') {
    activityScore += W.CONSISTENCY_PER_DAY;
  }

  const streak = event.streak ?? 0;
  streakBonus = streak * W.STREAK_BASE;
  W.STREAK_MILESTONE.forEach((threshold, i) => {
    if (streak >= threshold) streakBonus += W.STREAK_MILESTONE_BONUS[i];
  });

  consistencyScore = (event.activeDays ?? 0) * W.CONSISTENCY_PER_DAY;

  const total =
    quizPoints + accuracyBonus + streakBonus + consistencyScore + activityScore + mockInterviewBonus;

  return { quizPoints, accuracyBonus, streakBonus, consistencyScore, activityScore, mockInterviewBonus, total };
}

export function formatScoreBreakdown(b: ScoreBreakdown): string {
  const parts: string[] = [];
  if (b.quizPoints) parts.push(`${b.quizPoints} quiz`);
  if (b.accuracyBonus) parts.push(`+${b.accuracyBonus} acc`);
  if (b.streakBonus) parts.push(`+${b.streakBonus} streak`);
  if (b.mockInterviewBonus) parts.push(`+${b.mockInterviewBonus} interview`);
  return parts.join(' · ') || String(b.total);
}

export type BadgeId =
  | 'top_performer'
  | 'consistent_learner'
  | 'speed_demon'
  | 'perfect_score'
  | 'interview_ace'
  | 'streak_legend'
  | 'rising_star';

export interface Badge {
  id: BadgeId;
  label: string;
  emoji: string;
  color: string;
}

export const BADGES: Record<BadgeId, Badge> = {
  top_performer:      { id: 'top_performer',      label: 'Top Performer',      emoji: '🏆', color: '#f59e0b' },
  consistent_learner: { id: 'consistent_learner',  label: 'Consistent Learner', emoji: '📅', color: '#3b82f6' },
  speed_demon:        { id: 'speed_demon',         label: 'Speed Demon',        emoji: '⚡', color: '#a855f7' },
  perfect_score:      { id: 'perfect_score',       label: 'Perfect Score',      emoji: '💯', color: '#10b981' },
  interview_ace:      { id: 'interview_ace',       label: 'Interview Ace',      emoji: '🎤', color: '#ef4444' },
  streak_legend:      { id: 'streak_legend',       label: 'Streak Legend',      emoji: '🔥', color: '#f97316' },
  rising_star:        { id: 'rising_star',         label: 'Rising Star',        emoji: '⭐', color: '#eab308' },
};

export function computeBadges(entry: {
  totalScore: number;
  streak: number;
  quizCount: number;
  growthDelta: number;
  rank?: number;
}): Badge[] {
  const badges: Badge[] = [];
  if ((entry.rank ?? 999) <= 3) badges.push(BADGES.top_performer);
  if (entry.streak >= 14) badges.push(BADGES.streak_legend);
  else if (entry.streak >= 7) badges.push(BADGES.consistent_learner);
  if (entry.quizCount >= 20) badges.push(BADGES.perfect_score);
  if (entry.growthDelta >= 50) badges.push(BADGES.rising_star);
  return badges;
}