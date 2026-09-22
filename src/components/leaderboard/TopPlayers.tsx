import { type LeaderboardEntry } from '@/store/useLeaderboardStore';
import { Flame } from 'lucide-react';

interface TopPlayersProps {
  entries: (LeaderboardEntry & { currentRank: number })[];
  myUserId?: string;
}

const PODIUM_CONFIG = [
  {
    rank: 2,
    height: 'h-24',
    avatarSize: 'w-14 h-14 text-2xl',
    order: 'order-1',
    crown: '🥈',
    label: '2nd',
    podiumBg: 'bg-gradient-to-b from-slate-400 to-slate-600',
    ringColor: 'ring-slate-300',
    avatarBg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    labelColor: 'text-slate-100',
    glowClass: '[box-shadow:0_8px_24px_rgba(148,163,184,0.4)]',
  },
  {
    rank: 1,
    height: 'h-36',
    avatarSize: 'w-16 h-16 text-3xl',
    order: 'order-2',
    crown: '👑',
    label: '1st',
    podiumBg: 'bg-gradient-to-b from-amber-400 to-amber-600',
    ringColor: 'ring-amber-300',
    avatarBg: 'bg-gradient-to-br from-amber-300 to-orange-500',
    labelColor: 'text-amber-100',
    glowClass: '[box-shadow:0_12px_32px_rgba(251,191,36,0.5)]',
  },
  {
    rank: 3,
    height: 'h-16',
    avatarSize: 'w-12 h-12 text-xl',
    order: 'order-3',
    crown: '🥉',
    label: '3rd',
    podiumBg: 'bg-gradient-to-b from-orange-500 to-orange-700',
    ringColor: 'ring-orange-400',
    avatarBg: 'bg-gradient-to-br from-orange-400 to-orange-700',
    labelColor: 'text-orange-100',
    glowClass: '[box-shadow:0_8px_24px_rgba(234,88,12,0.4)]',
  },
];

export function TopPlayers({ entries, myUserId }: TopPlayersProps) {
  const top3 = entries.slice(0, 3);

  return (
    <div className="relative py-6 px-4">
      <div className="absolute inset-x-0 bottom-0 h-20 flex items-end justify-center pointer-events-none">
        <div className="w-64 h-12 rounded-full bg-amber-500/10 blur-2xl" />
      </div>

      <div className="flex items-end justify-center gap-4 relative">
        {PODIUM_CONFIG.map(({ rank, height, avatarSize, order, crown, label, podiumBg, ringColor, avatarBg, labelColor, glowClass }) => {
          const entry = top3[rank - 1];
          if (!entry) return null;
          const isMe = entry.userId === myUserId;

          return (
            <div key={rank} className={`flex flex-col items-center ${order}`}>
              <div className="flex flex-col items-center gap-1.5 mb-2">
                <span className="text-base leading-none">{crown}</span>

                <div className={`${avatarSize} rounded-2xl flex items-center justify-center ${avatarBg} ring-2 ${ringColor} ${glowClass} ${isMe ? 'ring-4 scale-105' : ''} transition-all duration-300 relative overflow-hidden`}>
                  <span className="relative z-10">{entry.avatar}</span>
                  {isMe && <div className="absolute inset-0 rounded-2xl bg-white/15 animate-pulse" />}
                </div>

                <div className="text-center max-w-[90px]">
                  <p className={`text-[11px] font-bold truncate ${isMe ? 'text-[hsl(var(--accent))]' : 'text-foreground'}`}>
                    {isMe ? 'You' : entry.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono font-bold">{entry.totalScore.toLocaleString()}</p>
                  {entry.streak >= 7 && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <Flame className="w-2.5 h-2.5 text-orange-500" />
                      <span className="text-[9px] text-orange-500 font-bold">{entry.streak}d</span>
                    </div>
                  )}
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {entry.badges.slice(0, 2).map(b => (
                      <span key={b.id} title={b.label} className="text-[10px]">{b.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`w-[72px] ${height} rounded-t-xl flex flex-col items-center justify-start pt-2.5 ${podiumBg} ${glowClass} transition-all duration-700`}>
                <span className={`text-xs font-black ${labelColor} tracking-wide`}>{label}</span>
                <span className={`text-[9px] font-semibold ${labelColor} opacity-70`}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}