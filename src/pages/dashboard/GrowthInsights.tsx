import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { generateGrowthInsights } from '@/services/growthInsightsEngine';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  BookOpen,
  Mic,
  Activity,
  Layers,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export default function GrowthInsights() {
  const navigate = useNavigate();
  const { domain, user, language } = useStationStore();
  const { topicPerformance, quizHistory, mockInterviewHistory } = usePerformanceStore();
  const isHi = language === 'hi';
  const config = domainConfig[domain];

  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);

  // Generate real Growth Insights
  const report = useMemo(() => {
    return generateGrowthInsights(
      user,
      topicPerformance,
      quizHistory,
      mockInterviewHistory,
      domain
    );
  }, [user, topicPerformance, quizHistory, mockInterviewHistory, domain]);

  const activeGap = useMemo(() => {
    if (!selectedGapId) return report.gaps[0] || null;
    return report.gaps.find(g => g.id === selectedGapId) || report.gaps[0] || null;
  }, [selectedGapId, report.gaps]);

  const targetRecruiter = user?.dreamCompany || (domain === 'commerce' ? 'HDFC Bank' : domain === 'arts' ? 'State PCS' : 'Google');
  const targetRole = user?.targetRole || (domain === 'commerce' ? 'Financial Analyst' : domain === 'arts' ? 'Civil Services Officer' : 'Software Engineer');

  // Insufficient Data State
  if (!report.hasSufficientData) {
    return (
      <div className="max-w-5xl space-y-6 animate-fade-in" data-testid="growth-insights-empty">
        <div className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent mx-auto">
            <Activity className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isHi ? 'ग्रोथ इनसाइट्स सक्रियण' : 'Growth Insights Telemetry Pending'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.missingDataExplanation}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/baseline')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              <Target className="w-4 h-4" />
              {isHi ? 'बेसलाइन डायग्नोस्टिक लें' : 'Take Baseline Diagnostic'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/quizzes')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4 text-accent" />
              {isHi ? 'अभ्यास क्विज शुरू करें' : 'Take First Practice Quiz'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/mock-interview')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 text-accent" />
              {isHi ? 'लाइव इंटरव्यू शुरू करें' : 'Simulate Live Interview'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in" data-testid="growth-insights-view">
      {/* Header Banner */}
      <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/20 uppercase tracking-wider">
              {isHi ? 'उन्नत करियर डायग्नोस्टिक्स' : 'AI Performance Telemetry'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">
              Target: {targetRole} @ {targetRecruiter}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            {isHi ? 'ग्रोथ इनसाइट्स एवं प्रदर्शन विश्लेषण' : 'Growth Insights & Trajectory'}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {report.summary}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="text-center p-3.5 rounded-2xl bg-muted/40 border border-border/80 min-w-[110px]">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Telemetry Confidence
            </p>
            <p className="text-3xl font-black text-accent mt-0.5">
              {report.overallDiagnosticConfidence}%
            </p>
          </div>
          <div className="text-center p-3.5 rounded-2xl bg-muted/40 border border-border/80 min-w-[110px]">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Mastered Areas
            </p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {report.totalMasteredTopics}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Goal Bridge Callout */}
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-accent shrink-0" />
          <span className="font-medium text-foreground">{report.weeklyGoalBridge}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/weekly')}
          className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 shrink-0 shadow-sm"
        >
          {isHi ? 'साप्ताहिक योजना देखें' : 'Open Weekly Plan'}
        </button>
      </div>

      {/* SECTION 1: WHAT YOU'RE DOING WELL (STRENGTHS) */}
      <div className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">
                {isHi ? 'आप क्या अच्छा कर रहे हैं (सत्यापित क्षमताएं)' : "What You're Doing Well (Verified Strengths)"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified proficiencies supported by quiz telemetry and interview observations.
              </p>
            </div>
          </div>
        </div>

        {report.strengths.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3">
            Take a few more diagnostic quizzes to establish your verified strengths.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.strengths.map((str) => (
              <div
                key={str.id}
                className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {str.category}
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {str.score}%
                  </span>
                </div>
                <h4 className="font-bold text-sm text-foreground">{str.concept}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {str.evidence}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400/90 font-medium pt-1 border-t border-border/40">
                  {str.impact}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: THE IMPROVEMENT ZONE (WHERE PERFORMANCE IS DECLINING & WHY IT MATTERS) */}
      <div className="bg-card rounded-3xl border border-border p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">
                {isHi ? 'इम्प्रूवमेंट ज़ोन (गैप एवं सुधार प्राथमिकताएं)' : 'Improvement Zone (Gaps & Actionable Prescriptions)'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Deep dive into where performance is declining, what evidence proves it, and how to bridge it.
              </p>
            </div>
          </div>
        </div>

        {report.gaps.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-foreground">Zero Critical Gaps Detected</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your verified accuracy and interview delivery align with {targetRecruiter} expectations across all monitored areas.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {/* Left Column: Selectable Gap Cards */}
            <div className="space-y-2.5 md:col-span-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Identified Gaps ({report.gaps.length})
              </p>
              {report.gaps.map((gap) => {
                const isSelected = activeGap?.id === gap.id;
                return (
                  <button
                    key={gap.id}
                    type="button"
                    onClick={() => setSelectedGapId(gap.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        gap.severity === 'high'
                          ? 'bg-destructive/15 text-destructive border border-destructive/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}>
                        {gap.severity.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                        {gap.currentAccuracyOrScore}% accuracy
                      </span>
                    </div>
                    <p className="font-bold text-xs text-foreground truncate">{gap.concept}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="capitalize">Trend: {gap.trend}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-accent" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Deep Evidence & Prescriptive Action Panel */}
            {activeGap && (
              <div className="md:col-span-2 p-5 rounded-2xl bg-muted/20 border border-border/80 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{activeGap.concept}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        activeGap.trend === 'declining' ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent'
                      }`}>
                        {activeGap.trend === 'declining' ? '📉 Declining Trend' : '⚡ Active Focus Area'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target role relevance: <span className="font-semibold text-foreground">{targetRole}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Current Telemetry</span>
                    <p className="text-2xl font-black text-destructive">{activeGap.currentAccuracyOrScore}%</p>
                  </div>
                </div>

                {/* 1. Evidence Callout */}
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> What the Evidence Proves:
                  </span>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {activeGap.evidence}
                  </p>
                </div>

                {/* 2. Why It Matters Callout */}
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Why This Gap Matters:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeGap.whyItMatters}
                  </p>
                </div>

                {/* 3. Trend Over Time Mini Chart */}
                {activeGap.historicalAttempts.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent" /> Accuracy Trajectory Over Attempts:
                    </span>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeGap.historicalAttempts}>
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={9} />
                          <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={9} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', borderRadius: '8px', fontSize: '11px' }} />
                          <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 4. Actionable Next Step Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Prescribed Action (~{activeGap.prescribedAction.estimatedMinutes} mins)
                    </p>
                    <p className="font-bold text-xs text-foreground">
                      {activeGap.prescribedAction.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(activeGap.prescribedAction.path)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  >
                    <span>{activeGap.prescribedAction.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
