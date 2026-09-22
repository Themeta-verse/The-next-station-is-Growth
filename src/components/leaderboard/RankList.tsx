import { type LeaderboardEntry, PAGE_SIZE } from '@/store/useLeaderboardStore';
import { LeaderboardCard } from './LeaderboardCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankListProps {
  entries: (LeaderboardEntry & { currentRank: number })[];
  myUserId?: string;
  page: number;
  onPageChange: (p: number) => void;
  recentlyUpdated?: Set<string>;
}

export function RankList({ entries, myUserId, page, onPageChange, recentlyUpdated }: RankListProps) {
  const start = page * PAGE_SIZE;
  const pageEntries = entries.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);

  if (!pageEntries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">🏜️</span>
        <p className="font-semibold">No players found</p>
        <p className="text-sm text-muted-foreground mt-1">Try a different filter or search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Skip top-3 if showing page 0 (they're in podium) */}
      {pageEntries.map((entry, i) => (
        <div
          key={entry.userId}
          className="transition-all duration-500"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <LeaderboardCard
            entry={entry}
            isCurrentUser={entry.userId === myUserId}
            highlight={recentlyUpdated?.has(entry.userId)}
          />
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className={cn(
              'p-2 rounded-lg transition-all',
              page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted',
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7 ? i : (() => {
                if (i === 0) return 0;
                if (i === 6) return totalPages - 1;
                return Math.max(0, Math.min(page - 2 + i - 1, totalPages - 1));
              })();
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-medium transition-all',
                    page === pageNum
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              'p-2 rounded-lg transition-all',
              page >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted',
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}