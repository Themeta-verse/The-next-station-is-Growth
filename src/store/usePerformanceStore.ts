import { create } from 'zustand';

export interface TopicPerformance {
  topic: string;
  correct: number;
  incorrect: number;
  totalTime: number; // seconds
  attempts: number;
  lastAttempted: string;
  difficulty: 'basic' | 'medium' | 'hard';
}

export interface QuizSession {
  id: string;
  date: string;
  quizType: string;
  topic: string;
  difficulty: 'basic' | 'medium' | 'hard';
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  scores: { iq: number; eq: number; rq: number };
}

export interface WeakArea {
  topic: string;
  severity: 'high' | 'medium' | 'low';
  accuracy: number;
  avgTime: number;
  attempts: number;
  recommendation: string;
}

export interface MockInterviewSessionRecord {
  id: string;
  date: string;
  role: string;
  company: string;
  type: string;
  durationMinutes: number;
  overallScore: number;
  dimensions: {
    technicalKnowledge: number;
    problemSolving: number;
    communicationClarity: number;
    answerStructure: number;
    companyRecruiterFit: number;
    composureAndPacing: number;
  };
  questionCount: number;
  identifiedWeakPoints: string[];
}

interface PerformanceState {
  topicPerformance: Record<string, TopicPerformance>;
  quizHistory: QuizSession[];
  companyTestHistory: { company: string; score: number; total: number; date: string; feedback: string[] }[];
  dailyActivity: { date: string; quizzes: number; studyMins: number; score: number }[];
  mockInterviewHistory: MockInterviewSessionRecord[];

  // Actions
  recordQuizAnswer: (topic: string, correct: boolean, timeTaken: number, difficulty: 'basic' | 'medium' | 'hard') => void;
  saveQuizSession: (session: Omit<QuizSession, 'id'>) => void;
  saveCompanyTest: (test: { company: string; score: number; total: number; feedback: string[] }) => void;
  saveMockInterviewSession: (session: MockInterviewSessionRecord) => void;
  logDailyActivity: (quizzes: number, studyMins: number, score: number) => void;
  getWeakAreas: () => WeakArea[];
  getAdaptiveDifficulty: (topic: string) => 'basic' | 'medium' | 'hard';
  getPlacementScore: (streak: number, tasksDone: number) => { total: number; quiz: number; interview: number; consistency: number };
  getRecommendations: () => { topic: string; action: 'Practice' | 'Learn' | 'Revise'; priority: number; reason: string }[];
  clearAll: () => void;
}

const STORAGE_KEY = 'station_perf_data';

function loadFromStorage(): Pick<PerformanceState, 'topicPerformance' | 'quizHistory' | 'companyTestHistory' | 'dailyActivity' | 'mockInterviewHistory'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        topicPerformance: parsed.topicPerformance || {},
        quizHistory: parsed.quizHistory || [],
        companyTestHistory: parsed.companyTestHistory || [],
        dailyActivity: parsed.dailyActivity || [],
        mockInterviewHistory: parsed.mockInterviewHistory || [],
      };
    }
  } catch {
    /* ignore storage read error */
  }
  return { topicPerformance: {}, quizHistory: [], companyTestHistory: [], dailyActivity: [], mockInterviewHistory: [] };
}

function saveToStorage(data: Pick<PerformanceState, 'topicPerformance' | 'quizHistory' | 'companyTestHistory' | 'dailyActivity' | 'mockInterviewHistory'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore storage write error */
  }
}

export const usePerformanceStore = create<PerformanceState>((set, get) => {
  const initial = loadFromStorage();
  return {
    ...initial,

    recordQuizAnswer: (topic, correct, timeTaken, difficulty) => {
      set(state => {
        const existing = state.topicPerformance[topic] || {
          topic, correct: 0, incorrect: 0, totalTime: 0, attempts: 0, lastAttempted: '', difficulty: 'basic',
        };
        const updated = {
          ...existing,
          correct: existing.correct + (correct ? 1 : 0),
          incorrect: existing.incorrect + (correct ? 0 : 1),
          totalTime: existing.totalTime + timeTaken,
          attempts: existing.attempts + 1,
          lastAttempted: new Date().toISOString(),
          difficulty,
        };
        const newState = {
          topicPerformance: { ...state.topicPerformance, [topic]: updated },
        };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
    },

    saveQuizSession: (session) => {
      set(state => {
        const fullSession = { ...session, id: `qs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
        const newHistory = [...state.quizHistory, fullSession].slice(-50);
        const newState = { quizHistory: newHistory };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
    },

    saveCompanyTest: (test) => {
      set(state => {
        const entry = { ...test, date: new Date().toISOString() };
        const newHistory = [...state.companyTestHistory, entry].slice(-30);
        const newState = { companyTestHistory: newHistory };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
    },

    saveMockInterviewSession: (session) => {
      set(state => {
        const newHistory = [session, ...(state.mockInterviewHistory || [])].slice(0, 30);
        const newState = { mockInterviewHistory: newHistory };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
    },

    logDailyActivity: (quizzes, studyMins, score) => {
      set(state => {
        const today = new Date().toISOString().split('T')[0];
        const existing = state.dailyActivity.find(d => d.date === today);
        let newActivity: typeof state.dailyActivity;
        if (existing) {
          newActivity = state.dailyActivity.map(d =>
            d.date === today ? { ...d, quizzes: d.quizzes + quizzes, studyMins: d.studyMins + studyMins, score: Math.max(d.score, score) } : d
          );
        } else {
          newActivity = [...state.dailyActivity, { date: today, quizzes, studyMins, score }].slice(-30);
        }
        const newState = { dailyActivity: newActivity };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
    },

    getWeakAreas: () => {
      const { topicPerformance } = get();
      const areas: WeakArea[] = [];
      for (const [, perf] of Object.entries(topicPerformance)) {
        if (perf.attempts < 1) continue;
        const accuracy = Math.round((perf.correct / perf.attempts) * 100);
        const avgTime = Math.round(perf.totalTime / perf.attempts);
        let severity: 'high' | 'medium' | 'low' = 'low';
        if (accuracy < 40) severity = 'high';
        else if (accuracy < 70) severity = 'medium';

        let recommendation = '';
        if (severity === 'high') recommendation = `Practice 15+ problems on ${perf.topic}. Focus on fundamentals.`;
        else if (severity === 'medium') recommendation = `Review ${perf.topic} concepts and solve 10 problems.`;
        else recommendation = `Strong in ${perf.topic} — maintain with periodic revision.`;

        if (avgTime > 35 && severity !== 'high') {
          recommendation += ' Work on speed — timed practice recommended.';
        }

        areas.push({ topic: perf.topic, severity, accuracy, avgTime, attempts: perf.attempts, recommendation });
      }
      return areas.sort((a, b) => a.accuracy - b.accuracy);
    },

    getAdaptiveDifficulty: (topic) => {
      const { topicPerformance } = get();
      const perf = topicPerformance[topic];
      if (!perf || perf.attempts < 3) return 'basic';
      const accuracy = (perf.correct / perf.attempts) * 100;
      if (accuracy >= 80) return 'hard';
      if (accuracy >= 55) return 'medium';
      return 'basic';
    },

    getPlacementScore: (streak, tasksDone) => {
      const { quizHistory } = get();
      let mockSessions: { total?: number }[] = [];
      try {
        const raw = localStorage.getItem('station_mock_sessions');
        if (raw) mockSessions = JSON.parse(raw);
      } catch {
        mockSessions = [];
      }

      // Quiz accuracy (last 10 sessions)
      const recentQuizzes = quizHistory.slice(-10);
      let quizAccuracy = 30;
      if (recentQuizzes.length > 0) {
        const totalCorrect = recentQuizzes.reduce((s, q) => s + q.correctAnswers, 0);
        const totalQs = recentQuizzes.reduce((s, q) => s + q.totalQuestions, 0);
        quizAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 30;
      }

      // Interview performance
      let interviewPerf = 25;
      const { mockInterviewHistory } = get();
      if (mockInterviewHistory && mockInterviewHistory.length > 0) {
        interviewPerf = Math.round(mockInterviewHistory.reduce((s, m) => s + m.overallScore, 0) / mockInterviewHistory.length);
      } else if (mockSessions.length > 0) {
        interviewPerf = Math.round(mockSessions.reduce((s: number, m: { total?: number }) => s + (m.total || 0), 0) / mockSessions.length);
      }

      // Consistency
      const streakScore = Math.min(100, streak * 10);
      const taskScore = Math.min(100, tasksDone * 4);
      const consistency = Math.round((streakScore + taskScore) / 2);

      const total = Math.round(quizAccuracy * 0.4 + interviewPerf * 0.4 + consistency * 0.2);
      return { total, quiz: quizAccuracy, interview: interviewPerf, consistency };
    },

    getRecommendations: () => {
      const weakAreas = get().getWeakAreas();
      const recs: { topic: string; action: 'Practice' | 'Learn' | 'Revise'; priority: number; reason: string }[] = [];

      for (const area of weakAreas) {
        if (area.severity === 'high') {
          recs.push({ topic: area.topic, action: 'Learn', priority: 3, reason: `Only ${area.accuracy}% accuracy — needs fundamental review` });
        } else if (area.severity === 'medium') {
          recs.push({ topic: area.topic, action: 'Practice', priority: 2, reason: `${area.accuracy}% accuracy — more practice needed` });
        } else if (area.attempts > 0) {
          recs.push({ topic: area.topic, action: 'Revise', priority: 1, reason: `${area.accuracy}% accuracy — periodic revision` });
        }
      }

      return recs.sort((a, b) => b.priority - a.priority);
    },

    clearAll: () => {
      const empty = { topicPerformance: {}, quizHistory: [], companyTestHistory: [], dailyActivity: [] };
      saveToStorage(empty);
      set(empty);
    },
  };
});
