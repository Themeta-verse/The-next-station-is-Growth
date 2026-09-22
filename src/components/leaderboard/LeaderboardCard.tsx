import { type LeaderboardEntry } from '@/store/useLeaderboardStore';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  entry: LeaderboardEntry & { currentRank: number };
  isCurrentUser: boolean;
  highlight?: boolean;
  style?: React.CSSProperties;
}

function RankDeltaIndicator({ delta }: { delta?: number }) {
  if (!delta || delta === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-500">
        <TrendingUp className="w-3 h-3" />
        <span className="text-[10px] font-bold">+{delta}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-red-400">
      <TrendingDown className="w-3 h-3" />
      <span className="text-[10px] font-bold">{delta}</span>
    </span>
  );
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-[#FFD700] font-black',
  2: 'text-[#C0C0C0] font-black',
  3: 'text-[#CD7F32] font-black',
};

export function LeaderboardCard({ entry, isCurrentUser, highlight, style }: LeaderboardCardProps) {
  const rank = entry.currentRank;
  const rankClass = RANK_COLORS[rank] || 'text-muted-foreground font-semibold';

  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300',
        'hover:border-[hsl(var(--accent)/0.4)] hover:bg-[hsl(var(--accent)/0.03)]',
        isCurrentUser
          ? 'bg-[hsl(var(--accent)/0.08)] border-[hsl(var(--accent)/0.5)] ring-1 ring-[hsl(var(--accent)/0.3)] shadow-[0_0_16px_hsl(var(--accent)/0.15)]'
          : 'bg-card border-border',
        highlight && 'animate-pulse-once',
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className={cn('text-sm', rankClass)}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
        </span>
      </div>

      {/* Avatar */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
        isCurrentUser ? 'bg-[hsl(var(--accent)/0.15)]' : 'bg-muted/50',
      )}>
        {entry.avatar}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-sm font-semibold truncate', isCurrentUser && 'text-[hsl(var(--accent))]')}>
            {isCurrentUser ? 'You' : entry.username}
          </span>
          {entry.streak >= 7 && (
            <span className="flex items-center gap-0.5 text-orange-500 flex-shrink-0">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">{entry.streak}</span>
            </span>
          )}
          {entry.badges.slice(0, 2).map(b => (
            <span key={b.id} title={b.label} className="text-[11px] flex-shrink-0">{b.emoji}</span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">{entry.city} · {entry.quizCount} quizzes</p>
      </div>

      {/* Score breakdown */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono">{entry.totalScore.toLocaleString()}</p>
        {entry.growthDelta > 0 && (
          <p className="text-[10px] text-emerald-500 font-mono">+{entry.growthDelta}</p>
        )}
      </div>

      {/* Rank movement */}
      <div className="w-10 flex justify-end flex-shrink-0">
        <RankDeltaIndicator delta={entry.rankDelta} />
      </div>
    </div>
  );
}