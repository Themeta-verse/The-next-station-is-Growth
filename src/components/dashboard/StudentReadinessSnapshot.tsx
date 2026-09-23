import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import {
  Target,
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Building,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

export default function StudentReadinessSnapshot() {
  const navigate = useNavigate();
  const { user, domain, language, tasksDone } = useStationStore();
  const { topicPerformance, quizHistory } = usePerformanceStore();
  const isHi = language === 'hi';

  // Compute live multi-pillar readiness
  const stats = useMemo(() => {
    // Level mapper
    const toScore = (lvl?: string) => {
      const lower = String(lvl || '').toLowerCase();
      if (lower === 'advanced') return 90;
      if (lower === 'intermediate') return 60;
      if (lower === 'beginner') return 30;
      return 25;
    };

    // 1. Tech Skills
    const skills = user?.skills || [];
    let techScore = 30;
    if (skills.length > 0) {
      const totalPoints = skills.reduce((acc, s) => {
        const p = String(s.proficiency).toLowerCase();
        return acc + (p === 'advanced' ? 100 : p === 'intermediate' ? 70 : 40);
      }, 0);
      techScore = Math.min(100, Math.round(totalPoints / skills.length));
    }

    // 2. DSA Score
    let dsaScore = toScore(user?.dsaLevel);
    const dsaTopics = Object.entries(topicPerformance).filter(([k]) =>
      k.toLowerCase().includes('dsa') || k.toLowerCase().includes('algorithm') || k.toLowerCase().includes('tree')
    );
    if (dsaTopics.length > 0) {
      let c = 0, a = 0;
      dsaTopics.forEach(([, p]) => { c += p.correct; a += p.attempts; });
      if (a > 0) {
        const acc = Math.round((c / a) * 100);
        dsaScore = Math.round((dsaScore * 0.4) + (acc * 0.6));
      }
    }

    // 3. Core CS / Domain
    let csScore = toScore(user?.csFundamentalsLevel);
    const csTopics = Object.entries(topicPerformance).filter(([k]) =>
      k.toLowerCase().includes('dbms') || k.toLowerCase().includes('sql') || k.toLowerCase().includes('network') || k.toLowerCase().includes('os')
    );
    if (csTopics.length > 0) {
      let c = 0, a = 0;
      csTopics.forEach(([, p]) => { c += p.correct; a += p.attempts; });
      if (a > 0) {
        const acc = Math.round((c / a) * 100);
        csScore = Math.round((csScore * 0.4) + (acc * 0.6));
      }
    }

    // 4. Aptitude
    let aptScore = toScore(user?.aptitudeLevel);
    const aptTopics = Object.entries(topicPerformance).filter(([k]) =>
      k.toLowerCase().includes('aptitude') || k.toLowerCase().includes('quant')
    );
    if (aptTopics.length > 0) {
      let c = 0, a = 0;
      aptTopics.forEach(([, p]) => { c += p.correct; a += p.attempts; });
      if (a > 0) {
        const acc = Math.round((c / a) * 100);
        aptScore = Math.round((aptScore * 0.4) + (acc * 0.6));
      }
    }

    // 5. Interview Command
    const commScore = toScore(user?.communicationLevel);

    // Overall Weighted
    const overall = Math.min(
      98,
      Math.round(
        techScore * 0.25 +
        dsaScore * 0.30 +
        csScore * 0.20 +
        aptScore * 0.15 +
        commScore * 0.10
      )
    );

    // Find weakest area
    const activeDomain = ((user?.domain || domain || 'engineering').toLowerCase());
    const pillars = activeDomain === 'commerce'
      ? [
          { name: 'Financial & Accounting Core', score: techScore, route: '/dashboard/profile', tip: 'Verify accounting and finance skills' },
          { name: 'Financial Modeling & Tools', score: dsaScore, route: '/dashboard/weekly', tip: 'Practice advanced Excel models' },
          { name: 'Banking & Regulatory Knowledge', score: csScore, route: '/dashboard/quizzes', tip: 'Review RBI and banking policies' },
          { name: 'Quantitative Aptitude & DI', score: aptScore, route: '/dashboard/quizzes', tip: 'Practice quantitative formulas & speed drills' },
          { name: 'Business Communication', score: commScore, route: '/dashboard/interview', tip: 'Simulate business interviews' },
        ]
      : activeDomain === 'arts'
      ? [
          { name: 'Indian Polity & Governance', score: techScore, route: '/dashboard/profile', tip: 'Review core constitutional articles' },
          { name: 'Essay & Answer Writing', score: dsaScore, route: '/dashboard/weekly', tip: 'Practice timed descriptive writing' },
          { name: 'General Studies & Administration', score: csScore, route: '/dashboard/quizzes', tip: 'Review administrative and historical milestones' },
          { name: 'CSAT & Analytical Aptitude', score: aptScore, route: '/dashboard/quizzes', tip: 'Practice CSAT reasoning and comprehension' },
          { name: 'Board Interview Readiness', score: commScore, route: '/dashboard/interview', tip: 'Simulate personality test rounds' },
        ]
      : [
          { name: 'Data Structures & Algorithms', score: dsaScore, route: '/dashboard/quizzes', tip: 'Take a timed DSA practice quiz' },
          { name: 'Core CS / Systems', score: csScore, route: '/dashboard/weekly', tip: 'Review OS & DBMS milestone units' },
          { name: 'Technical Stack', score: techScore, route: '/dashboard/profile', tip: 'Add and verify project skills in profile' },
          { name: 'Aptitude & Reasoning', score: aptScore, route: '/dashboard/quizzes', tip: 'Practice quantitative formulas & speed drills' },
          { name: 'Interview Readiness', score: commScore, route: '/dashboard/interview', tip: 'Simulate technical & HR rounds' },
        ];
    pillars.sort((a, b) => a.score - b.score);
    const topWeakness = user?.weakPoints && user.weakPoints.length > 0
      ? user.weakPoints[0]
      : pillars[0].name;

    return {
      overall,
      techScore,
      dsaScore,
      csScore,
      aptScore,
      commScore,
      topWeakness,
      recommendedAction: pillars[0],
    };
  }, [user, topicPerformance, domain]);

  const activeDomain = ((user?.domain || domain || 'engineering').toLowerCase());
  const targetRole = user?.targetRole || (activeDomain === 'engineering' ? 'Full Stack Developer' : activeDomain === 'commerce' ? 'Financial Analyst' : 'Civil Services Aspirant');
  const targetCompany = user?.dreamCompany || (user?.targetCompanies && user.targetCompanies[0]) || 'Top Recruiters';

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm animate-fade-in">
      {/* Top Banner: Student Target Role & Evidence Readiness Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
              Live Readiness Cockpit
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold border border-accent/20">
              Verified Skills Benchmark
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {user?.name || 'Student'} &middot;{' '}
            <span className="text-muted-foreground font-normal">{targetRole}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Targeting <strong className="text-foreground">{targetCompany}</strong> &bull;{' '}
            {user?.college || 'Campus Placement Track'} {user?.degree ? `(${user.degree})` : ''}
          </p>
        </div>

        {/* Readiness Gauge Meter */}
        <div className="flex items-center gap-3.5 bg-muted/30 p-3 rounded-2xl border border-border/60 self-start md:self-auto shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={stats.overall >= 70 ? '#22C55E' : stats.overall >= 45 ? 'hsl(var(--accent))' : '#EF4444'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * stats.overall) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
              {stats.overall}%
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Placement Readiness</p>
            <p className={`text-xs font-bold ${stats.overall >= 70 ? 'text-green-600' : stats.overall >= 45 ? 'text-accent' : 'text-destructive'}`}>
              {stats.overall >= 70 ? 'Placement Ready' : stats.overall >= 45 ? 'Progressing Well' : 'Preparation Needed'}
            </p>
            <p className="text-[10px] text-muted-foreground">Multi-pillar weighted</p>
          </div>
        </div>
      </div>

      {/* 5-Pillar Live Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
        {(activeDomain === 'commerce'
          ? [
              { label: 'Domain Accounting', score: stats.techScore, icon: Layers },
              { label: 'Modeling & Excel', score: stats.dsaScore, icon: Brain },
              { label: 'Banking & Law', score: stats.csScore, icon: Building },
              { label: 'Aptitude & Logic', score: stats.aptScore, icon: Target },
              { label: 'Interview & Comms', score: stats.commScore, icon: TrendingUp },
            ]
          : activeDomain === 'arts'
          ? [
              { label: 'Polity & GS Core', score: stats.techScore, icon: Layers },
              { label: 'Answer Writing', score: stats.dsaScore, icon: Brain },
              { label: 'Governance & History', score: stats.csScore, icon: Building },
              { label: 'CSAT & Logic', score: stats.aptScore, icon: Target },
              { label: 'Interview & Comms', score: stats.commScore, icon: TrendingUp },
            ]
          : [
              { label: 'Technical Skills', score: stats.techScore, icon: Layers },
              { label: 'DSA & Algorithms', score: stats.dsaScore, icon: Brain },
              { label: 'CS Fundamentals', score: stats.csScore, icon: Building },
              { label: 'Aptitude & Logic', score: stats.aptScore, icon: Target },
              { label: 'Interview & Comms', score: stats.commScore, icon: TrendingUp },
            ]
        ).map(pillar => (
          <div key={pillar.label} className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <pillar.icon className="w-3 h-3 text-accent" />
                {pillar.label}
              </span>
              <span className="font-mono font-bold text-muted-foreground">{pillar.score}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pillar.score >= 70 ? 'bg-emerald-500' : pillar.score >= 45 ? 'bg-accent' : 'bg-destructive'
                }`}
                style={{ width: `${pillar.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Focus Area & Recommended Action Banner */}
      <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">
              Current Focus Priority: <span className="text-accent font-bold">{stats.topWeakness}</span>
            </p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              {stats.recommendedAction.tip} to raise your overall hiring readiness.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(stats.recommendedAction.route)}
          className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <span>Recommended Next Action</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
