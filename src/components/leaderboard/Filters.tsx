import { type TimeFilter, type CategoryFilter } from '@/store/useLeaderboardStore';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiltersProps {
  timeFilter: TimeFilter;
  categoryFilter: CategoryFilter;
  searchQuery: string;
  onTimeFilter: (f: TimeFilter) => void;
  onCategoryFilter: (f: CategoryFilter) => void;
  onSearch: (q: string) => void;
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'alltime', label: 'All Time' },
];

const CAT_OPTIONS: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'Overall', emoji: '⚡' },
  { value: 'quiz', label: 'Quiz', emoji: '🧠' },
  { value: 'interview', label: 'Interview', emoji: '🎤' },
  { value: 'coding', label: 'Coding', emoji: '💻' },
];

export function Filters({ timeFilter, categoryFilter, searchQuery, onTimeFilter, onCategoryFilter, onSearch }: FiltersProps) {
  return (
    <div className="space-y-3">
      {/* Time filters */}
      <div className="flex gap-1.5 flex-wrap">
        {TIME_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => onTimeFilter(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              timeFilter === o.value
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-[0_0_10px_hsl(var(--accent)/0.3)]'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        {CAT_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => onCategoryFilter(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all',
              categoryFilter === o.value
                ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/20'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or city…"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-sm rounded-xl bg-muted/40 border border-border focus:outline-none focus:border-[hsl(var(--accent)/0.5)] focus:ring-1 focus:ring-[hsl(var(--accent)/0.3)] transition-all placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}