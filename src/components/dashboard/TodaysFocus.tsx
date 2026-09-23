import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { getRecommendedFocusAreas, type RecommendedFocusArea } from '@/services/skillGapEngine';
import {
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Brain,
  Sparkles,
  Target,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TodaysFocus() {
  const navigate = useNavigate();
  const { user, streak, completeTask, focusMinutes } = useStationStore();
  const { topicPerformance, mockInterviewHistory } = usePerformanceStore();
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  const focusTasks: RecommendedFocusArea[] = user
    ? getRecommendedFocusAreas(user, topicPerformance, mockInterviewHistory)
    : [
        {
          id: 'default-1',
          priorityTier: 'HIGH PRIORITY',
          title: 'Review Arrays & Binary Search Bounds',
          skill: 'Data Structures',
          reason: 'Core foundational topic for campus recruitment screening rounds.',
          path: '/dashboard/quizzes',
          actionText: 'Take DSA Quiz',
          estimatedMinutes: 25,
        },
        {
          id: 'default-2',
          priorityTier: 'PRACTICE',
          title: 'Solve 4 Sliding Window Problems',
          skill: 'Algorithms',
          reason: 'Reinforce subarray constraint patterns under timed conditions.',
          path: '/dashboard/weekly',
          actionText: 'Start Drills',
          estimatedMinutes: 30,
        },
        {
          id: 'default-3',
          priorityTier: 'COMMUNICATION',
          title: 'Simulate Technical HR Interview',
          skill: 'Communication',
          reason: 'STAR methodology practice with live AI video feedback.',
          path: '/dashboard/interview-simulator',
          actionText: 'Start AI Interview',
          estimatedMinutes: 15,
        },
      ];

  const handleToggleTask = (taskId: string, title: string) => {
    if (completedTaskIds.has(taskId)) return;

    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    completeTask();
    toast.success(`Completed "${title}"! +10 score and rank boosted.`);
  };

  const getPriorityBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'HIGH PRIORITY':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'PRACTICE':
        return 'bg-accent/15 text-accent border-accent/30';
      case 'COMPANY PREP':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'COMMUNICATION':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm" data-testid="todays-focus">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Today's Personalized Focus</h3>
            <p className="text-xs text-muted-foreground">
              Dynamic tasks prioritized from your active skill gaps, target role, and recent mistakes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak} Day Streak</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{focusMinutes} min focused</span>
          </div>
        </div>
      </div>

      {/* Task List with Visible Priority Reason */}
      <div className="space-y-3">
        {focusTasks.map((task, idx) => {
          const isDone = completedTaskIds.has(task.id);
          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDone
                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                  : 'bg-muted/20 border-border hover:border-accent/40 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id, task.title)}
                  className="mt-1 text-muted-foreground hover:text-accent transition shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                        task.priorityTier
                      )}`}
                    >
                      {task.priorityTier}
                    </span>
                    <p
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                      {task.skill}
                    </span>
                  </div>

                  {/* VISIBLE DIAGNOSTIC REASON */}
                  <p className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                    <span className="font-semibold text-foreground/80">Reason:</span>
                    <span>{task.reason}</span>
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-accent" /> Est. {task.estimatedMinutes} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(task.path)}
                  className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1 shadow-sm"
                >
                  <span>{task.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
