import { useEffect, useRef, useState, useCallback } from 'react';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import { useStationStore } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TopPlayers } from '@/components/leaderboard/TopPlayers';
import { RankList } from '@/components/leaderboard/RankList';
import { Filters } from '@/components/leaderboard/Filters';
import { MyRankCard } from '@/components/leaderboard/MyRankCard';
import { Confetti } from '@/components/leaderboard/Confetti';
import { calculateEventScore } from '@/lib/scoringEngine';
import { Trophy, Zap, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 8000;

export default function Leaderboard() {
  const {
    filter, category, searchQuery, page, isLive, lastUpdated,
    setFilter, setCategory, setSearchQuery, setPage,
    loadFromStorage, simulateLiveUpdate, updateMyScore, initFakeData, syncFromSupabase,
    getRankedEntries, getMyRank, getNextRankGap,
    myEntry,
  } = useLeaderboardStore();

  const { user, domain, streak } = useStationStore();
  const { user: authUser, recordProgress } = useAuth();

  const [showConfetti, setShowConfetti] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevMyRankRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch real profiles from Supabase
  const fetchLiveLeaderboard = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, city, domain, college, score, tasks_done, streak, created_at')
        .order('score', { ascending: false })
        .limit(30);

      if (!error && profiles && profiles.length > 0) {
        syncFromSupabase(profiles, authUser?.id, domain, user?.city);
      } else {
        initFakeData(domain, user?.city || 'Mumbai');
      }
    } catch {
      initFakeData(domain, user?.city || 'Mumbai');
    }
  }, [authUser?.id, domain, user?.city, syncFromSupabase, initFakeData]);

  // Init & Real-time subscription
  useEffect(() => {
    loadFromStorage();
    fetchLiveLeaderboard();

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchLiveLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveLeaderboard, loadFromStorage]);

  // Live polling simulation
  useEffect(() => {
    if (!isLive) return;
    pollRef.current = setInterval(() => {
      simulateLiveUpdate();
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLive, simulateLiveUpdate]);

  // Track rank changes for confetti + highlights
  const ranked = getRankedEntries();
  const myRank = getMyRank();
  const nextGap = getNextRankGap();

  useEffect(() => {
    if (!myEntry) return;
    const prev = prevMyRankRef.current;
    if (prev > 0 && myRank > 0 && myRank < prev && myRank <= 3 && prev > 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    if (prev > 0 && myRank < prev) {
      // highlight moved entries
      const updatedIds = new Set<string>();
      updatedIds.add('self');
      setRecentlyUpdated(updatedIds);
      setTimeout(() => setRecentlyUpdated(new Set()), 2000);
    }
    prevMyRankRef.current = myRank;
  }, [myRank, myEntry]);

  // Simulate score update (demo button)
  const handleDemoScore = useCallback(async () => {
    if (!user) return;
    const event = calculateEventScore({
      type: 'quiz',
      accuracy: 70 + Math.floor(Math.random() * 30),
      questionsAnswered: 10,
      streak,
    });
    updateMyScore(user.name, event.total, user.city, streak, {
      quizPoints: event.quizPoints,
      accuracyBonus: event.accuracyBonus,
      streakBonus: event.streakBonus,
    });
    await recordProgress({ scoreDelta: event.total, streak });
  }, [user, streak, updateMyScore, recordProgress]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLiveLeaderboard();
    simulateLiveUpdate();
    setIsRefreshing(false);
  }, [fetchLiveLeaderboard, simulateLiveUpdate]);

  const top3 = ranked.slice(0, 3);
  const listEntries = ranked.slice(3); // rest after podium on page 0, or all if page > 0

  const formatLastUpdated = (d: Date | null) => {
    if (!d) return '';
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 5) return 'just now';
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in pb-16">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent)/0.15)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[hsl(var(--accent))]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Leaderboard</h1>
            <p className="text-xs text-muted-foreground">Real-time student rankings</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">LIVE</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-muted transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* My Rank Card (pinned) */}
      {myEntry ? (
        <MyRankCard
          myEntry={{ ...myEntry, currentRank: myRank }}
          myRank={myRank}
          nextRankGap={nextGap}
          totalEntries={ranked.length}
        />
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-semibold mb-1">You haven't joined the leaderboard yet</p>
          <p className="text-xs text-muted-foreground mb-3">Complete a quiz to earn your first score</p>
          <button
            onClick={handleDemoScore}
            className="px-4 py-2 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            Demo: Add Score
          </button>
        </div>
      )}

      {/* Filters */}
      <Filters
        timeFilter={filter}
        categoryFilter={category}
        searchQuery={searchQuery}
        onTimeFilter={setFilter}
        onCategoryFilter={setCategory}
        onSearch={setSearchQuery}
      />

      {/* Podium (top 3) - show only on page 0 with no active search */}
      {page === 0 && !searchQuery && top3.length === 3 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 pt-5 pb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Performers</p>
          </div>
          <TopPlayers entries={top3} myUserId={myEntry?.userId} />
        </div>
      )}

      {/* Rank list */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {searchQuery ? `Results for "${searchQuery}"` : page === 0 ? 'Rankings' : `Page ${page + 1}`}
          </p>
          <p className="text-xs text-muted-foreground">{ranked.length} students</p>
        </div>

        <RankList
          entries={page === 0 && !searchQuery ? listEntries : ranked}
          myUserId={myEntry?.userId || 'self'}
          page={page === 0 && !searchQuery ? 0 : page}
          onPageChange={setPage}
          recentlyUpdated={recentlyUpdated}
        />
      </div>

      {/* Demo button (when already in board) */}
      {myEntry && user && (
        <div className="text-center">
          <button
            onClick={handleDemoScore}
            className="px-4 py-2 rounded-xl bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] text-xs font-medium hover:bg-[hsl(var(--accent)/0.2)] transition-all flex items-center gap-2 mx-auto border border-[hsl(var(--accent)/0.2)]"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate quiz completion (+score)
          </button>
        </div>
      )}
    </div>
  );
}