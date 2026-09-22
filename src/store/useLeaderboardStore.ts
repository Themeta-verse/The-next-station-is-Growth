import { create } from 'zustand';
import { computeBadges, type Badge } from '@/lib/scoringEngine';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  totalScore: number;
  previousScore: number;
  growthDelta: number;
  lastActiveTime: string;
  streak: number;
  quizCount: number;
  city: string;
  quizPoints: number;
  accuracyBonus: number;
  streakBonus: number;
  mockInterviews: number;
  badges: Badge[];
  currentRank?: number;
  previousRank?: number;
  rankDelta?: number;
  quizScore: number;
  interviewScore: number;
  codingScore: number;
}

export type TimeFilter = 'weekly' | 'monthly' | 'alltime';
export type CategoryFilter = 'all' | 'quiz' | 'interview' | 'coding';

export interface SupabaseProfileRow {
  id: string;
  name: string;
  city?: string;
  domain?: string;
  college?: string;
  score?: number;
  tasks_done?: number;
  streak?: number;
  created_at?: string;
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  filter: TimeFilter;
  category: CategoryFilter;
  searchQuery: string;
  page: number;
  isLive: boolean;
  lastUpdated: Date | null;

  setFilter: (f: TimeFilter) => void;
  setCategory: (c: CategoryFilter) => void;
  setSearchQuery: (q: string) => void;
  setPage: (p: number) => void;
  updateMyScore: (
    username: string,
    scoreAdd: number,
    city: string,
    streak: number,
    breakdown?: { quizPoints?: number; accuracyBonus?: number; streakBonus?: number }
  ) => void;
  getFiltered: () => LeaderboardEntry[];
  loadFromStorage: () => void;
  simulateLiveUpdate: () => void;
  getRankedEntries: () => (LeaderboardEntry & { currentRank: number })[];
  getMyRank: () => number;
  getNextRankGap: () => { points: number; targetRank: number } | null;
  initFakeData: (domain: string, city: string) => void;
  syncFromSupabase: (profiles: SupabaseProfileRow[], currentUserId?: string, domain?: string, city?: string) => void;
}

const LB_KEY = 'station_leaderboard_v2';
const LB_MY_KEY = 'station_lb_my_v2';
export const PAGE_SIZE = 10;

const AVATARS = ['🧑‍💻', '👩‍🎓', '🧑‍🔬', '👨‍💼', '👩‍💻', '🧑‍🏫', '👩‍🔬', '👨‍🎓', '🧑‍💼', '👩‍🏫'];

function getAvatar(name: string): string {
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}

function generateFakeEntries(domain: string, userCity: string): LeaderboardEntry[] {
  const names: Record<string, string[]> = {
    engineering: ['Aarav S.', 'Priya M.', 'Rohit K.', 'Sneha J.', 'Vikram T.', 'Ananya R.', 'Karan P.', 'Neha G.', 'Dev L.', 'Simran B.', 'Harsh V.', 'Pooja D.', 'Arjun N.', 'Kritika S.', 'Manish R.', 'Tanvi C.', 'Rishi A.', 'Deepa T.', 'Sahil M.', 'Kavya S.'],
    commerce: ['Deepak M.', 'Anjali S.', 'Mohit R.', 'Kavita P.', 'Suresh T.', 'Pooja L.', 'Rajesh K.', 'Divya N.', 'Amit G.', 'Sakshi V.', 'Rahul B.', 'Megha D.', 'Vivek C.', 'Nisha P.', 'Arun S.', 'Preeti J.', 'Saurav K.', 'Ritu S.', 'Vinod M.', 'Charu A.'],
    arts: ['Meera S.', 'Arjun R.', 'Riya P.', 'Suresh K.', 'Kavita M.', 'Anil T.', 'Priti J.', 'Manish D.', 'Swati G.', 'Rakesh V.', 'Snehal B.', 'Tushar L.', 'Aditi C.', 'Varun N.', 'Jaya R.', 'Pooja H.', 'Nikhil S.', 'Shweta M.', 'Prakash D.', 'Leena K.'],
  };
  const pool = names[domain] || names.engineering;
  const cities = [userCity || 'Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur'];

  return pool.map((name, i) => {
    const base = 1800 - i * 75 + Math.floor(Math.random() * 100);
    const prev = base - Math.floor(Math.random() * 60);
    const streak = Math.floor(Math.random() * 21) + 1;
    const quizCount = Math.floor(Math.random() * 25) + 5;
    const quizPoints = Math.floor(base * 0.45);
    const accuracyBonus = Math.floor(base * 0.25);
    const streakBonus = streak * 5;
    const mockInterviews = Math.floor(Math.random() * 6);
    const entry = {
      userId: `bot_${i}`,
      username: name,
      avatar: getAvatar(name),
      totalScore: Math.max(50, base),
      previousScore: Math.max(30, prev),
      growthDelta: Math.max(0, base - prev),
      lastActiveTime: new Date(Date.now() - Math.random() * 25 * 86400000).toISOString(),
      streak,
      quizCount,
      city: cities[Math.floor(Math.random() * cities.length)],
      quizPoints,
      accuracyBonus,
      streakBonus,
      mockInterviews,
      quizScore: Math.floor(Math.random() * 400) + 200,
      interviewScore: Math.floor(Math.random() * 300) + 100,
      codingScore: Math.floor(Math.random() * 350) + 150,
      currentRank: i + 1,
      previousRank: i + 1,
      rankDelta: 0,
    };
    return { ...entry, badges: computeBadges({ ...entry, rank: i + 1 }) };
  });
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  myEntry: null,
  filter: 'alltime',
  category: 'all',
  searchQuery: '',
  page: 0,
  isLive: true,
  lastUpdated: null,

  setFilter: (filter) => set({ filter, page: 0 }),
  setCategory: (category) => set({ category, page: 0 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, page: 0 }),
  setPage: (page) => set({ page }),

  initFakeData: (domain, city) => {
    const existing = get().entries;
    if (existing.length > 3) return;
    const entries = generateFakeEntries(domain, city);
    set({ entries, lastUpdated: new Date() });
    try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
  },

  syncFromSupabase: (profiles, currentUserId, domain, city) => {
    if (!profiles || profiles.length === 0) return;

    const mappedProfiles: LeaderboardEntry[] = profiles.map((p, idx) => {
      const isSelf = Boolean(currentUserId && p.id === currentUserId);
      const name = p.name || 'Anonymous Student';
      const score = p.score || 0;
      const streak = p.streak || 1;
      const tasksDone = p.tasks_done || 0;

      const baseEntry: LeaderboardEntry = {
        userId: isSelf ? 'self' : p.id,
        username: isSelf ? `${name} (You)` : name,
        avatar: getAvatar(name),
        totalScore: score,
        previousScore: score,
        growthDelta: 0,
        lastActiveTime: p.created_at || new Date().toISOString(),
        streak,
        quizCount: tasksDone,
        city: p.city || 'National',
        quizPoints: Math.round(score * 0.45),
        accuracyBonus: Math.round(score * 0.25),
        streakBonus: streak * 5,
        mockInterviews: Math.floor(tasksDone / 3),
        quizScore: Math.round(score * 0.45),
        interviewScore: Math.round(score * 0.3),
        codingScore: Math.round(score * 0.25),
        badges: [],
        currentRank: idx + 1,
      };
      return { ...baseEntry, badges: computeBadges({ ...baseEntry, rank: idx + 1 }) };
    });

    // Supplement with benchmark peer entries if fewer than 10 students
    const combined = [...mappedProfiles];
    if (combined.length < 10) {
      const fakeOnes = generateFakeEntries(domain || 'engineering', city || 'Mumbai');
      const existingNames = new Set(combined.map(c => c.username));
      for (const f of fakeOnes) {
        if (!existingNames.has(f.username) && combined.length < 15) {
          combined.push(f);
        }
      }
    }

    combined.sort((a, b) => b.totalScore - a.totalScore);
    const ranked = combined.map((e, i) => ({
      ...e,
      previousRank: e.currentRank,
      currentRank: i + 1,
      rankDelta: (e.currentRank || i + 1) - (i + 1),
      badges: computeBadges({ ...e, rank: i + 1 }),
    }));

    const myRanked = ranked.find(e => e.userId === 'self') || null;

    set({
      entries: ranked,
      myEntry: myRanked,
      lastUpdated: new Date(),
    });

    try {
      localStorage.setItem(LB_KEY, JSON.stringify(ranked));
      if (myRanked) {
        localStorage.setItem(LB_MY_KEY, JSON.stringify(myRanked));
      }
    } catch { /* ignore */ }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(LB_KEY);
      const myRaw = localStorage.getItem(LB_MY_KEY);
      if (raw) {
        set({ entries: JSON.parse(raw), myEntry: myRaw ? JSON.parse(myRaw) : null, lastUpdated: new Date() });
      }
    } catch { /* ignore */ }
  },

  simulateLiveUpdate: () => {
    set(state => {
      if (!state.entries.length) return state;
      const entries = [...state.entries];
      const numBumps = Math.random() > 0.5 ? 2 : 1;
      for (let b = 0; b < numBumps; b++) {
        const idx = Math.floor(Math.random() * Math.min(entries.length - 1, 15));
        if (entries[idx] && entries[idx].userId !== 'self') {
          const bump = Math.floor(Math.random() * 12) + 2;
          entries[idx] = {
            ...entries[idx],
            previousScore: entries[idx].totalScore,
            totalScore: entries[idx].totalScore + bump,
            growthDelta: bump,
            lastActiveTime: new Date().toISOString(),
          };
        }
      }
      entries.sort((a, b) => b.totalScore - a.totalScore);
      const ranked = entries.map((e, i) => ({ ...e, previousRank: e.currentRank, currentRank: i + 1, rankDelta: (e.currentRank || i + 1) - (i + 1) }));
      return { entries: ranked, lastUpdated: new Date() };
    });
  },

  updateMyScore: (username, scoreAdd, city, streak, breakdown = {}) => {
    set(state => {
      const existing = state.myEntry;
      const prevScore = existing?.totalScore || 0;
      const newScore = prevScore + scoreAdd;

      const myEntry: LeaderboardEntry = {
        userId: 'self',
        username,
        avatar: '🙋',
        totalScore: newScore,
        previousScore: prevScore,
        growthDelta: scoreAdd,
        lastActiveTime: new Date().toISOString(),
        streak,
        quizCount: (existing?.quizCount || 0) + 1,
        city,
        quizPoints: (existing?.quizPoints || 0) + (breakdown.quizPoints || 0),
        accuracyBonus: (existing?.accuracyBonus || 0) + (breakdown.accuracyBonus || 0),
        streakBonus: streak * 5,
        mockInterviews: existing?.mockInterviews || 0,
        quizScore: (existing?.quizScore || 0) + (breakdown.quizPoints || 0),
        interviewScore: existing?.interviewScore || 0,
        codingScore: existing?.codingScore || 0,
        badges: [],
      };

      const entries = state.entries.length > 3
        ? state.entries.filter(e => e.userId !== 'self')
        : generateFakeEntries('engineering', city);

      const bumpIdx = Math.floor(Math.random() * Math.min(entries.length, 10));
      if (entries[bumpIdx]) {
        const bump = Math.floor(Math.random() * 8) + 1;
        entries[bumpIdx] = { ...entries[bumpIdx], previousScore: entries[bumpIdx].totalScore, totalScore: entries[bumpIdx].totalScore + bump, growthDelta: bump, lastActiveTime: new Date().toISOString() };
      }

      entries.push(myEntry);
      entries.sort((a, b) => b.totalScore - a.totalScore);
      const ranked = entries.map((e, i) => ({ ...e, previousRank: e.currentRank, currentRank: i + 1, rankDelta: (e.currentRank || i + 1) - (i + 1), badges: computeBadges({ ...e, rank: i + 1 }) }));
      const myRanked = ranked.find(e => e.userId === 'self');

      try {
        localStorage.setItem(LB_KEY, JSON.stringify(ranked));
        localStorage.setItem(LB_MY_KEY, JSON.stringify(myRanked));
      } catch { /* ignore */ }

      return { entries: ranked, myEntry: myRanked || myEntry, lastUpdated: new Date() };
    });
  },

  getFiltered: () => {
    const { entries, filter, category, searchQuery } = get();
    const now = Date.now();
    let result = [...entries];

    if (filter === 'weekly') result = result.filter(e => now - new Date(e.lastActiveTime).getTime() < 7 * 86400000);
    else if (filter === 'monthly') result = result.filter(e => now - new Date(e.lastActiveTime).getTime() < 30 * 86400000);

    if (category === 'quiz') result = result.sort((a, b) => b.quizScore - a.quizScore);
    else if (category === 'interview') result = result.sort((a, b) => b.interviewScore - a.interviewScore);
    else if (category === 'coding') result = result.sort((a, b) => b.codingScore - a.codingScore);

    if (searchQuery) result = result.filter(e => e.username.toLowerCase().includes(searchQuery.toLowerCase()) || e.city.toLowerCase().includes(searchQuery.toLowerCase()));

    return result;
  },

  getRankedEntries: () => get().getFiltered().map((e, i) => ({ ...e, currentRank: i + 1 })),

  getMyRank: () => {
    const { myEntry } = get();
    if (!myEntry) return 0;
    return get().getRankedEntries().findIndex(e => e.userId === 'self') + 1;
  },

  getNextRankGap: () => {
    const myRank = get().getMyRank();
    if (myRank <= 1) return null;
    const ranked = get().getRankedEntries();
    const me = ranked[myRank - 1];
    const above = ranked[myRank - 2];
    if (!me || !above) return null;
    return { points: above.totalScore - me.totalScore + 1, targetRank: myRank - 1 };
  },
}));