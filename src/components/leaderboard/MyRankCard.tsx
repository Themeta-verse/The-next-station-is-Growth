import { type LeaderboardEntry } from '@/store/useLeaderboardStore';
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';

interface MyRankCardProps {
  myEntry: LeaderboardEntry & { currentRank?: number };
  myRank: number;
  nextRankGap: { points: number; targetRank: number } | null;
  totalEntries: number;
}

export function MyRankCard({ myEntry, myRank, nextRankGap, totalEntries }: MyRankCardProps) {
  const topPercent = totalEntries > 0 ? Math.round(((totalEntries - myRank) / totalEntries) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-[hsl(var(--accent)/0.12)] to-[hsl(var(--accent)/0.04)] rounded-2xl border border-[hsl(var(--accent)/0.3)] p-5 shadow-[0_0_20px_hsl(var(--accent)/0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--accent)/0.15)] flex items-center justify-center text-2xl ring-2 ring-[hsl(var(--accent)/0.3)]">
            {myEntry.avatar}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Rank</p>
            <p className="text-3xl font-black text-[hsl(var(--accent))] leading-none">
              #{myRank || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Top {topPercent}% of all students</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Score</p>
          <p className="text-2xl font-black font-mono">{myEntry.totalScore.toLocaleString()}</p>
          {myEntry.streak > 0 && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{myEntry.streak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { icon: Trophy, label: 'Quizzes', value: String(myEntry.quizCount) },
          { icon: Target, label: 'Interviews', value: String(myEntry.mockInterviews || 0) },
          { icon: TrendingUp, label: 'Growth', value: `+${myEntry.growthDelta}` },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-2.5 text-center">
            <s.icon className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--accent))]" />
            <p className="text-sm font-bold font-mono">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Next rank gap */}
      {nextRankGap && (
        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-bold">+{nextRankGap.points} pts</span>
            {' '}to reach Rank #{nextRankGap.targetRank}
          </p>
          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--accent))] rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(95, 100 - (nextRankGap.points / 100) * 50)}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      {myEntry.badges?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {myEntry.badges.map(b => (
            <span
              key={b.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40` }}
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}