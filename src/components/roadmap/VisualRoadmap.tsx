import { useState, useMemo } from 'react';
import {
  CheckCircle,
  Circle,
  Lock,
  Clock,
  BookOpen,
  Play,
  Brain,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  Target,
  Sparkles,
  MapPin,
  Flame,
  Award,
  Filter,
  AlertTriangle,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface RoadmapTopicStatus {
  name: string;
  status: 'mastered' | 'weak' | 'pending';
}

export interface RoadmapMilestone {
  id: string;
  stepNumber: number;
  stationName: string;
  title: string;
  category: 'Foundation' | 'Core Skills' | 'Specialized' | 'Projects' | 'Interview Prep' | 'Final Clearance';
  estimatedHours: string;
  description: string;
  prerequisites: string[];
  tasks: Array<{ id: string; text: string; completed: boolean }>;
  resources: Array<{ title: string; type: 'video' | 'article' | 'quiz'; url?: string }>;
  quizCount?: number;
  keyTopics?: RoadmapTopicStatus[];
  ctaText?: string;
  ctaAction?: () => void;
}

interface VisualRoadmapProps {
  milestones: RoadmapMilestone[];
  completedMilestoneIds: Set<string>;
  onToggleTask?: (milestoneId: string, taskId: string) => void;
  onToggleMilestone?: (milestoneId: string) => void;
  onTakeQuiz?: (milestoneId: string) => void;
  targetRole?: string;
  targetCompany?: string;
}

export default function VisualRoadmap({
  milestones,
  completedMilestoneIds,
  onToggleTask,
  onToggleMilestone,
  onTakeQuiz,
  targetRole = 'Software Engineer',
  targetCompany = 'Google',
}: VisualRoadmapProps) {
  const [expandedId, setExpandedId] = useState<string | null>(milestones[0]?.id || null);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Determine current active milestone (first non-completed milestone)
  const activeMilestoneId = useMemo(() => {
    const firstIncomplete = milestones.find(m => !completedMilestoneIds.has(m.id));
    return firstIncomplete?.id || milestones[milestones.length - 1]?.id;
  }, [milestones, completedMilestoneIds]);

  // Overall progress
  const progressPct = useMemo(() => {
    if (milestones.length === 0) return 0;
    return Math.round((completedMilestoneIds.size / milestones.length) * 100);
  }, [milestones, completedMilestoneIds]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      const isDone = completedMilestoneIds.has(m.id);
      if (filter === 'completed') return isDone;
      if (filter === 'in_progress') return !isDone;
      return true;
    });
  }, [milestones, completedMilestoneIds, filter]);

  const stages = [
    'START',
    'FOUNDATION',
    'CORE SKILLS',
    'ROLE SKILLS',
    'COMPANY PREP',
    'MOCK INTERVIEW',
    'JOB READY',
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="visual-roadmap">
      {/* Route Journey Header */}
      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Express Career Line · {targetCompany} Route
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>Milestone Journey: {targetRole}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Visual stage progression from foundations to company recruitment readiness.
          </p>
        </div>

        {/* Progress & Quick Stats */}
        <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/60 self-start md:self-auto">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Milestones Cleared</p>
            <p className="text-lg font-black text-accent">{progressPct}%</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Stations Left</p>
            <p className="text-lg font-black text-foreground">
              {Math.max(0, milestones.length - completedMilestoneIds.size)}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Stage Progression Nodes (Horizontal Pipeline) */}
      <div className="bg-card rounded-2xl border border-border p-4 overflow-x-auto shadow-sm">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {stages.map((stage, sIdx) => {
            const currentStageIdx = Math.min(
              stages.length - 1,
              Math.floor((completedMilestoneIds.size / Math.max(1, milestones.length)) * stages.length)
            );
            const isStagePassed = sIdx <= currentStageIdx;
            const isCurrent = sIdx === currentStageIdx;

            return (
              <div key={stage} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      isStagePassed
                        ? 'bg-accent text-accent-foreground border-accent'
                        : isCurrent
                        ? 'bg-card text-accent border-accent ring-2 ring-accent/30 font-extrabold'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {isStagePassed ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                  </div>
                  <span
                    className={`text-[9px] font-bold tracking-tight whitespace-nowrap ${
                      isCurrent
                        ? 'text-accent'
                        : isStagePassed
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {stage}
                  </span>
                </div>

                {sIdx < stages.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all ${
                      sIdx < currentStageIdx ? 'bg-accent' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {completedMilestoneIds.size} of {milestones.length} Milestones Cleared
          </span>
          <span className="font-bold text-accent">{progressPct}% Complete</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Stops ({milestones.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'in_progress'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            In Progress ({milestones.length - completedMilestoneIds.size})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Completed ({completedMilestoneIds.size})
          </button>
        </div>
      </div>

      {/* Visual Roadmap Cards */}
      <div className="relative pl-6 md:pl-8 space-y-6">
        {/* Continuous Subway Track Line */}
        <div className="absolute left-2.5 md:left-3.5 top-6 bottom-6 w-1 bg-border rounded-full" />

        {filteredMilestones.map((m, idx) => {
          const isDone = completedMilestoneIds.has(m.id);
          const isActive = m.id === activeMilestoneId && !isDone;
          const isLocked = !isDone && !isActive && idx > 0 && !completedMilestoneIds.has(milestones[idx - 1]?.id);
          const isExpanded = expandedId === m.id;

          // Milestone topic completion
          const totalTasks = m.tasks.length;
          const completedTasksCount = m.tasks.filter(t => t.completed).length;
          const milestonePct = isDone ? 100 : totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

          return (
            <div key={m.id} className="relative group">
              {/* Station Node Marker */}
              <div
                className={`absolute -left-6 md:-left-8 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
                    : isActive
                    ? 'bg-accent border-accent text-accent-foreground ring-4 ring-accent/20 animate-pulse'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : isLocked ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : (
                  <span className="text-[10px] font-bold">{m.stepNumber}</span>
                )}
              </div>

              {/* Milestone Card */}
              <div
                className={`bg-card rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isActive
                    ? 'border-accent/60 shadow-md ring-1 ring-accent/30'
                    : isDone
                    ? 'border-emerald-500/30 bg-card/70'
                    : isLocked
                    ? 'border-border/60 bg-muted/20 opacity-80'
                    : 'border-border hover:border-border/80'
                }`}
              >
                {/* Header Summary Row */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                        {m.stationName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                        {m.category}
                      </span>
                      {isDone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> 100% Cleared
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">
                          {milestonePct}% In Progress
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1 font-mono">
                          <Lock className="w-2.5 h-2.5" /> Requires: {m.prerequisites[0] || 'Prior Station'}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-base font-bold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {m.title}
                    </h3>

                    {/* Topic Status Breakdown (✓, ⚠, ○) */}
                    {m.keyTopics && m.keyTopics.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {m.keyTopics.map((kt, ki) => (
                          <span
                            key={ki}
                            className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                              kt.status === 'mastered'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : kt.status === 'weak'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {kt.status === 'mastered' && '✓'}
                            {kt.status === 'weak' && '⚠'}
                            {kt.status === 'pending' && '○'}
                            <span>{kt.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                      {m.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {m.estimatedHours}
                    </span>

                    {onToggleMilestone && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMilestone(m.id);
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold transition-all border ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark milestone complete'}
                      >
                        {isDone ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                    )}

                    <div className="p-1 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-border/60 space-y-4 animate-fade-in mt-1">
                    {/* Prerequisites */}
                    {m.prerequisites.length > 0 && (
                      <div className="pt-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">
                          Prerequisites & Prior Stations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.prerequisites.map((p, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/60"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Task Checklist */}
                    {m.tasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <p className="font-bold text-foreground">Actionable Station Deliverables:</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {completedTasksCount} / {totalTasks} completed
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {m.tasks.map(task => (
                            <div
                              key={task.id}
                              onClick={() => onToggleTask && onToggleTask(m.id, task.id)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                task.completed
                                  ? 'bg-muted/30 border-border/40 text-muted-foreground'
                                  : 'bg-card border-border hover:border-accent/40 text-foreground'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                  task.completed
                                    ? 'bg-accent border-accent text-accent-foreground'
                                    : 'border-muted-foreground/40'
                                }`}
                              >
                                {task.completed && <CheckCircle className="w-3 h-3" />}
                              </div>
                              <span className={`leading-relaxed ${task.completed ? 'line-through' : ''}`}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Curated Resources and Quiz CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                      <div className="flex flex-wrap gap-2">
                        {m.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent transition-colors border border-border/60"
                          >
                            {res.type === 'video' ? (
                              <Play className="w-3 h-3 text-accent" />
                            ) : (
                              <BookOpen className="w-3 h-3 text-accent" />
                            )}
                            <span>{res.title}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>

                      {onTakeQuiz && (
                        <button
                          type="button"
                          onClick={() => onTakeQuiz(m.id)}
                          className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          {m.ctaText || 'Validate Milestone Quiz'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
