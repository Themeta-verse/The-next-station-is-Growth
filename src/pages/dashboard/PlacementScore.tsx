import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useAuth } from '@/context/AuthContext';
import {
  Award,
  TrendingUp,
  Brain,
  Target,
  Flame,
  CheckCircle,
  Zap,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Printer,
  RefreshCw,
  BarChart3,
  Sliders,
  Calendar,
  X,
  FileCheck,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PlacementScore() {
  const { user, domain, streak, tasksDone, language, rank, totalStudents } = useStationStore();
  const { getPlacementScore, quizHistory, topicPerformance, getWeakAreas, getRecommendations } = usePerformanceStore();
  const { user: authUser, recordProgress } = useAuth();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [isSyncing, setIsSyncing] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Simulation toggles for "What-If" forecaster
  const [simQuizzes, setSimQuizzes] = useState(false);
  const [simMockInterview, setSimMockInterview] = useState(false);
  const [simStreak, setSimStreak] = useState(false);
  const [simWeakPoints, setSimWeakPoints] = useState(false);

  // Safely parse mock interview sessions
  const mockSessions = useMemo<{ total?: number }[]>(() => {
    try {
      const raw = localStorage.getItem('station_mock_sessions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Real base metrics from performance store
  const placementData = useMemo(() => {
    return getPlacementScore(streak, tasksDone);
  }, [getPlacementScore, streak, tasksDone]);

  const { total: baseTotal, quiz: baseQuiz, interview: baseInterview, consistency: baseConsistency } = placementData;

  // Simulated score calculation
  const simulatedBonus =
    (simQuizzes ? 8 : 0) +
    (simMockInterview ? 10 : 0) +
    (simStreak ? 6 : 0) +
    (simWeakPoints ? 7 : 0);

  const displayedScore = Math.min(100, baseTotal + simulatedBonus);

  // Animated gauge value
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(displayedScore), 250);
    return () => clearTimeout(timer);
  }, [displayedScore]);

  // Radius for circular SVG gauge
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Status tiers
  const getTier = (score: number) => {
    if (score >= 85) {
      return {
        label: isHi ? '⭐ टियर 1 / ड्रीम कंपनी तैयार' : '⭐ Tier 1 Ready (Dream Companies)',
        color: 'text-amber-500',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        desc: isHi
          ? 'आप गूगल, माइक्रोसॉफ्ट, अमेज़न या शीर्ष पीएसयू जैसी कंपनियों के लिए अत्यधिक प्रतिस्पर्धी हैं।'
          : 'Highly competitive for top-tier tech, consulting, investment banking, or premier civil services.',
      };
    }
    if (score >= 70) {
      return {
        label: isHi ? '🎯 इंटरव्यू रेडी' : '🎯 Interview Ready',
        color: 'text-emerald-500',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        desc: isHi
          ? 'आप तकनीकी और एचआर दोनों राउंड पास करने की मजबूत स्थिति में हैं।'
          : 'Solid technical and behavioral foundations. Strong probability of clearing campus placement drives.',
      };
    }
    if (score >= 40) {
      return {
        label: isHi ? '📈 विकासशील उम्मीदवार' : '📈 Developing Candidate',
        color: 'text-accent',
        badgeBg: 'bg-accent/10 border-accent/30 text-accent',
        desc: isHi
          ? 'आपकी बुनियादी तैयारी अच्छी है। क्विज़ और मॉक इंटरव्यू के साथ 75+ तक पहुंचें।'
          : 'Good foundation in progress. Increase mock interviews and timed problem solving to cross 75+.',
      };
    }
    return {
      label: isHi ? '🌱 शुरुआती चरण' : '🌱 Foundation Stage',
      color: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      desc: isHi
        ? 'दैनिक क्विज़ अभ्यास शुरू करें और बुनियादी अवधारणाओं को मजबूत करें।'
        : 'Early stage preparation. Focus on core syllabus topics and maintain a steady daily streak.',
    };
  };

  const tier = getTier(displayedScore);

  // 4 Core Pillars
  const pillars = useMemo(() => {
    const weakAreas = getWeakAreas();
    const targetComp = user?.dreamCompany || config.companies[0];

    // Pillar 4: Company Match based on domain difficulty & student score
    const companyDiff = targetComp === 'Google' || targetComp === 'Microsoft' || targetComp === 'UPSC' || targetComp === 'RBI' ? 0.8 : 0.6;
    const companyMatch = Math.min(98, Math.max(25, Math.round(displayedScore * (1 / companyDiff) * 0.75)));

    return [
      {
        id: 'quiz',
        title: isHi ? 'तकनीकी और एप्टीट्यूड एक्यूरेसी' : 'Technical & Aptitude Acumen',
        weight: '40%',
        score: Math.min(100, baseQuiz + (simQuizzes ? 15 : 0)),
        icon: Brain,
        detail: isHi
          ? `${quizHistory.length} क्विज़ सत्र पूर्ण | एक्यूरेसी: ${baseQuiz}%`
          : `${quizHistory.length} quiz sessions logged • Accuracy: ${baseQuiz}%`,
        ctaText: isHi ? 'क्विज़ दें' : 'Take Quizzes',
        ctaUrl: '/dashboard/quizzes',
        color: 'bg-indigo-500',
      },
      {
        id: 'interview',
        title: isHi ? 'इंटरव्यू और संचार कौशल' : 'Interview & Communication',
        weight: '30%',
        score: Math.min(100, baseInterview + (simMockInterview ? 20 : 0)),
        icon: Target,
        detail: isHi
          ? `${mockSessions.length} मॉक इंटरव्यू सत्र रिकॉर्ड किए गए`
          : `${mockSessions.length} mock interview rehearsals completed`,
        ctaText: isHi ? 'मॉक इंटरव्यू' : 'Mock Interview',
        ctaUrl: '/dashboard/mock-interview',
        color: 'bg-emerald-500',
      },
      {
        id: 'consistency',
        title: isHi ? 'तैयारी की निरंतरता' : 'Preparation Habits & Consistency',
        weight: '20%',
        score: Math.min(100, baseConsistency + (simStreak ? 15 : 0)),
        icon: Flame,
        detail: isHi
          ? `${streak} दिन की स्ट्रीक • ${tasksDone} कार्य पूरे किए`
          : `${streak}-day study streak • ${tasksDone} tasks checked off`,
        ctaText: isHi ? 'रोडमैप देखें' : 'View Roadmap',
        ctaUrl: '/dashboard/weekly',
        color: 'bg-amber-500',
      },
      {
        id: 'company',
        title: isHi ? 'लक्षित कंपनी संरेखण' : 'Dream Company Alignment',
        weight: '10%',
        score: companyMatch,
        icon: Building,
        detail: isHi
          ? `${targetComp} के लिए तैयारी स्तर: ${companyMatch}%`
          : `Alignment for ${targetComp}: ${companyMatch}% compatibility`,
        ctaText: isHi ? 'कंपनी तैयारी' : 'Company Prep',
        ctaUrl: '/dashboard/company-prep',
        color: 'bg-purple-500',
      },
    ];
  }, [baseQuiz, baseInterview, baseConsistency, simQuizzes, simMockInterview, simStreak, displayedScore, getWeakAreas, isHi, user?.dreamCompany, config.companies, quizHistory.length, mockSessions.length, streak, tasksDone]);

  // Target Company Preparation Alignment Matrix
  const companyProbabilities = useMemo(() => {
    const compData = config.companyData as Record<string, { seats?: number; avgSalary?: string; process?: string }>;
    const comps = config.companies.slice(0, 6);

    return comps.map((compName) => {
      const info = compData[compName];
      const isDream = user?.dreamCompany?.toLowerCase() === compName.toLowerCase();
      // Target recruitment preparation benchmark score
      const isTopTier = ['Google', 'Microsoft', 'Amazon', 'RBI', 'IAS', 'IPS'].includes(compName);
      const isMidTier = ['Infosys', 'HDFC Bank', 'ICICI', 'State PCS'].includes(compName);

      const targetBenchmark = isTopTier ? 85 : isMidTier ? 70 : 60;
      const alignment = Math.min(100, Math.round((displayedScore / targetBenchmark) * 100));

      return {
        name: compName,
        isDream,
        probability: alignment,
        targetBenchmark,
        salary: info?.avgSalary || '4-8 LPA',
        process: info?.process || 'Online Test → Technical → HR',
        status: alignment >= 90 ? (isHi ? 'बेंचमार्क पूरा' : 'Benchmark Met') : alignment >= 65 ? (isHi ? 'प्रगति पर' : 'On Track') : (isHi ? 'तैयारी अपेक्षित' : 'Needs Preparation'),
        statusColor: alignment >= 90 ? 'text-emerald-500 bg-emerald-500/10' : alignment >= 65 ? 'text-accent bg-accent/10' : 'text-amber-500 bg-amber-500/10',
      };
    });
  }, [config.companies, config.companyData, displayedScore, isHi, user?.dreamCompany]);

  // Recommended next actions
  const recommendations = useMemo(() => {
    const raw = getRecommendations();
    if (raw && raw.length > 0) return raw.slice(0, 3);
    return [
      { topic: config.vaultTopics[0] || 'Core DSA', action: 'Practice' as const, priority: 3, reason: 'Essential foundation for top campus recruiters' },
      { topic: 'Behavioral & HR Round', action: 'Learn' as const, priority: 2, reason: 'Improve communication clarity with STAR framework' },
      { topic: 'Speed & Time Management', action: 'Revise' as const, priority: 1, reason: 'Timed quizzes build speed during online assessments' },
    ];
  }, [getRecommendations, config.vaultTopics]);

  // Sync placement score with Supabase
  const handleSyncScore = async () => {
    setIsSyncing(true);
    try {
      if (authUser?.id) {
        await recordProgress({ scoreDelta: 0, streak });
      }
      toast.success(
        isHi
          ? 'प्लेसमेंट स्कोर और रैंकिंग सफलतापूर्वक सिंक की गई!'
          : 'Readiness score and ranking synced with live leaderboard!',
        { duration: 3000 }
      );
    } catch {
      toast.error('Sync failed. Continuing with local metrics.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
              <Award className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isHi ? 'प्लेसमेंट तैयारी डायग्नोस्टिक' : 'Placement Readiness Diagnostic'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {isHi
              ? 'आपके वास्तविक क्विज़, इंटरव्यू और अभ्यास डेटा पर आधारित समग्र विश्लेषण'
              : 'Multi-vector analysis synthesized from your real test scores, mock interviews, and consistency.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleSyncScore}
            disabled={isSyncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-accent' : 'text-muted-foreground'}`} />
            <span>{isSyncing ? (isHi ? 'सिंक हो रहा है...' : 'Syncing...') : (isHi ? 'सिंक करें' : 'Sync Profile')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCertificate(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isHi ? 'प्रमाणपत्र देखें' : 'View Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Hero Readiness Speedometer & Status Card */}
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Left: Circular Animated Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                {/* Background track circle */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Foreground animated value circle */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${tier.color} transition-all duration-1000 ease-out`}
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold tracking-tight">
                  {animatedScore}
                  <span className="text-lg font-bold text-muted-foreground">/100</span>
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  {isHi ? 'तैयारी स्कोर' : 'Readiness Index'}
                </span>
              </div>
            </div>

            {/* Percentile Pill */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>
                {isHi
                  ? `आपके डोमेन के शीर्ष ${Math.max(5, Math.round(((totalStudents - rank) / totalStudents) * 100))}% छात्रों में`
                  : `Top ${Math.max(5, Math.round(((totalStudents - rank) / totalStudents) * 100))}% in ${config.label}`}
              </span>
            </div>
          </div>

          {/* Right: Detailed Tier Status & Summary */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tier.badgeBg}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {tier.label}
              </span>
              <h2 className="text-xl font-bold mt-2 text-foreground">
                {isHi ? 'कैंपस भर्ती मूल्यांकन रिपोर्ट' : 'Campus Hiring Readiness Diagnostic'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {tier.desc}
              </p>
            </div>

            {/* Quick Stat Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
                <Brain className="w-4 h-4 mx-auto mb-1 text-accent" />
                <p className="text-sm font-bold">{quizHistory.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isHi ? 'क्विज़' : 'Quizzes'}</p>
              </div>

              <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <p className="text-sm font-bold">{mockSessions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isHi ? 'इंटरव्यू' : 'Mocks'}</p>
              </div>

              <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <p className="text-sm font-bold">{streak} d</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isHi ? 'स्ट्रीक' : 'Streak'}</p>
              </div>

              <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
                <Building className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                <p className="text-sm font-bold truncate">{user?.dreamCompany || config.companies[0]}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isHi ? 'लक्ष्य' : 'Target'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Assessment Pillars Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span>{isHi ? '४ प्रमुख तैयारी आयाम' : '4 Core Assessment Pillars'}</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {isHi ? 'भारित मूल्यांकन' : 'Weighted Evaluation Model'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3.5">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="bg-card rounded-2xl border border-border p-5 hover:border-accent/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                      <pillar.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{pillar.title}</h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {isHi ? `भार: ${pillar.weight}` : `Weight: ${pillar.weight}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-black tracking-tight">{pillar.score}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full ${pillar.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-2">{pillar.detail}</p>
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-end">
                <Link
                  to={pillar.ctaUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  <span>{pillar.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Company Preparation Alignment Matrix */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Building className="w-4 h-4 text-accent" />
              <span>{isHi ? 'लक्षित कंपनी तैयारी संरेखण' : 'Target Company Clearance Probability & Preparation Alignment'}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isHi
                ? 'तैयारी संरेखण आपके वर्तमान साक्ष्य-आधारित स्कोर की तुलना कंपनी के भर्ती पाठ्यक्रम बेंचमार्क से करता है (कोई आधिकारिक गारंटी नहीं)।'
                : 'Measures your current verified readiness against target recruitment syllabus benchmarks. Not a hiring guarantee.'}
            </p>
          </div>
          <Link
            to="/dashboard/companies"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <span>{isHi ? 'सभी कंपनियां' : 'View All'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companyProbabilities.map((comp) => (
            <div
              key={comp.name}
              className={`p-4 rounded-xl border transition-all ${
                comp.isDream
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{comp.name}</span>
                    {comp.isDream && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                        {isHi ? 'सपनों की कंपनी' : 'DREAM'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{comp.salary}</span>
                </div>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${comp.statusColor}`}>
                  {comp.probability}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden my-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    comp.probability >= 70 ? 'bg-emerald-500' : comp.probability >= 45 ? 'bg-accent' : 'bg-amber-500'
                  }`}
                  style={{ width: `${comp.probability}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{comp.status}</span>
                <span className="truncate max-w-[120px]">{comp.process.split('→')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive What-If Simulator & Actionable Roadmap */}
      <div className="grid md:grid-cols-12 gap-5">
        {/* Simulator Column */}
        <div className="md:col-span-6 bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span>{isHi ? 'स्कोर सिमुलेटर (अगर आप...)' : 'Placement Score Simulator'}</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/10 text-accent">
              +{simulatedBonus} pts
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isHi
              ? 'जांचें कि इन लक्ष्यों को पूरा करने से आपका प्लेसमेंट स्कोर कैसे बढ़ेगा:'
              : 'Toggle milestones below to preview how target actions boost your qualification rank:'}
          </p>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={simQuizzes}
                onChange={(e) => setSimQuizzes(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-foreground">
                  {isHi ? '+३ डोमेन क्विज़ ८०%+ एक्यूरेसी के साथ' : 'Complete 3 Domain Quizzes (80%+ score)'}
                </p>
                <p className="text-muted-foreground">{isHi ? 'तकनीकी एक्यूरेसी बढ़ाता है' : '+8 points to technical acumen'}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={simMockInterview}
                onChange={(e) => setSimMockInterview(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-foreground">
                  {isHi ? '+१ पूरा AI मॉक इंटरव्यू सत्र' : 'Rehearse 1 Full AI Mock Interview'}
                </p>
                <p className="text-muted-foreground">{isHi ? 'संचार स्कोर मजबूत करता है' : '+10 points to interview readiness'}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={simStreak}
                onChange={(e) => setSimStreak(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-foreground">
                  {isHi ? '७ दिन की लगातार अध्ययन स्ट्रीक' : 'Maintain a 7-Day Active Habit Streak'}
                </p>
                <p className="text-muted-foreground">{isHi ? 'निरंतरता बोनस' : '+6 points to consistency habits'}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={simWeakPoints}
                onChange={(e) => setSimWeakPoints(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-foreground">
                  {isHi ? '२ कमजोर विषयों पर विशेष सुधार अभ्यास' : 'Remediate 2 High-Severity Weak Topics'}
                </p>
                <p className="text-muted-foreground">{isHi ? 'कमजोरी निवारण' : '+7 points to domain mastery'}</p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Roadmap Column */}
        <div className="md:col-span-6 bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span>{isHi ? 'प्राथमिकता कार्रवाई योजना' : 'Personalized Action Plan'}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {isHi
              ? 'स्कोर को अगले टियर पर ले जाने के लिए अनुशंसित दैनिक कदम:'
              : 'Targeted actions prioritized based on your weak areas and placement goals:'}
          </p>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent uppercase">
                      {rec.action}
                    </span>
                    <span className="text-xs font-bold text-foreground">{rec.topic}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
                <Link
                  to={rec.action === 'Practice' ? '/dashboard/quizzes' : rec.action === 'Learn' ? '/dashboard/weekly' : '/dashboard/vault'}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                  {isHi ? 'शुरू करें' : 'Start'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verified Placement Certificate Modal */}
      {showCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/25 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCertificate(false)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm">
                  {isHi ? 'सत्यापित प्लेसमेंट तैयारी प्रमाणपत्र' : 'Verified Placement Readiness Credential'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificate(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Body Preview */}
            <div className="border-2 border-dashed border-accent/40 rounded-xl p-6 text-center space-y-3 bg-accent/5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-accent">STATION ACADEMIC ACCREDITATION</p>
              <h4 className="text-xl font-extrabold text-foreground">{user?.name || 'Verified Student'}</h4>
              <p className="text-xs text-muted-foreground">
                {user?.college || 'University Partner Institute'} • {user?.specialization || config.label}
              </p>

              <div className="py-3">
                <span className="text-3xl font-black text-accent">{displayedScore}%</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">{tier.label}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-border/60">
                <div>
                  <p className="text-muted-foreground">{isHi ? 'क्विज़' : 'Technical'}</p>
                  <p className="font-bold">{baseQuiz}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isHi ? 'इंटरव्यू' : 'Interview'}</p>
                  <p className="font-bold">{baseInterview}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isHi ? 'स्ट्रीक' : 'Streak'}</p>
                  <p className="font-bold">{streak} d</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground pt-2">
                Certified on {new Date().toLocaleDateString()} • ID: STN-PL-{Date.now().toString().slice(-6)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isHi ? 'प्रिंट करें' : 'Print / Export'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCertificate(false)}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
