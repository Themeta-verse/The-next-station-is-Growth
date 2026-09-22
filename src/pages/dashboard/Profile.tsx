import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStationStore, domainConfig, type ThemeOption } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  TrendingUp,
  Award,
  Calendar,
  Brain,
  Target,
  Flame,
  Zap,
  Clock,
  BarChart3,
  CheckCircle,
  X,
  ArrowRight,
  Settings,
  KeyRound,
  Mail,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

const themes: { id: ThemeOption; label: string; color: string }[] = [
  { id: 'engineering', label: 'Slate & Copper', color: 'bg-[hsl(210,29%,24%)]' },
  { id: 'commerce', label: 'Forest & Brass', color: 'bg-[hsl(153,40%,15%)]' },
  { id: 'arts', label: 'Burgundy & Bronze', color: 'bg-[hsl(350,40%,22%)]' },
  { id: 'violet', label: 'Violet Dusk', color: 'bg-[hsl(270,30%,20%)]' },
  { id: 'forest', label: 'Forest Calm', color: 'bg-[hsl(140,30%,18%)]' },
  { id: 'mocha', label: 'Mocha Warm', color: 'bg-[hsl(25,35%,18%)]' },
];

const personalityQuestions = [
  { q: 'You receive conflicting instructions from two seniors. You:', options: ['Follow the more senior one', 'Ask both to align', 'Use your own judgment', 'Escalate to someone higher'] },
  { q: 'You have 2 hours to learn something completely new. You:', options: ['Watch a video tutorial', 'Read documentation', 'Try building immediately', 'Find a mentor'] },
  { q: 'A teammate is struggling with their part. You:', options: ['Offer help proactively', 'Wait for them to ask', 'Take over their part', 'Suggest they ask the lead'] },
  { q: 'Under extreme deadline pressure, you:', options: ['Stay calm and prioritize', 'Work overtime to finish all', 'Cut scope strategically', 'Ask for deadline extension'] },
  { q: 'Your biggest strength is:', options: ['Analytical thinking', 'Communication', 'Creativity', 'Persistence'] },
];

export default function Profile() {
  const { user: authUser } = useAuth();
  const { theme, setTheme, user, rank, totalStudents, streak, tasksDone, language, domain } = useStationStore();
  const { getPlacementScore, quizHistory, topicPerformance, dailyActivity, companyTestHistory } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [showPersonality, setShowPersonality] = useState(false);
  const [personalityStep, setPersonalityStep] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState<number[]>(Array(5).fill(-1));
  const [personalityDone, setPersonalityDone] = useState(false);
  const [personalityResult, setPersonalityResult] = useState('');

  // Placement Score
  const placementData = useMemo(() => getPlacementScore(streak, tasksDone), [getPlacementScore, streak, tasksDone]);
  const { total: totalScore, quiz: quizAccuracy, interview: interviewPerf, consistency } = placementData;

  const status = totalScore >= 70 ? { label: isHi ? '🎯 इंटरव्यू रेडी' : '🎯 Interview Ready', color: 'text-green-600' }
    : totalScore >= 40 ? { label: isHi ? '📈 औसत' : '📈 Average', color: 'text-accent' }
    : { label: isHi ? '🌱 शुरुआती' : '🌱 Beginner', color: 'text-destructive' };

  // Animated score
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(totalScore), 300);
    return () => clearTimeout(timer);
  }, [totalScore]);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const scoreColor = totalScore >= 70 ? 'hsl(140, 45%, 40%)' : totalScore >= 40 ? 'hsl(var(--accent))' : 'hsl(0, 65%, 51%)';

  // Skill radar from real data
  const radarData = useMemo(() => {
    const topics = Object.values(topicPerformance);
    if (topics.length === 0) {
      return [
        { subject: 'DSA', A: 50 }, { subject: 'System Design', A: 40 },
        { subject: 'Communication', A: 55 }, { subject: 'Aptitude', A: 45 }, { subject: 'Domain', A: 50 },
      ];
    }
    const grouped: Record<string, { correct: number; total: number }> = {};
    for (const t of topics) {
      const cat = t.topic.length > 15 ? t.topic.slice(0, 15) : t.topic;
      if (!grouped[cat]) grouped[cat] = { correct: 0, total: 0 };
      grouped[cat].correct += t.correct;
      grouped[cat].total += t.attempts;
    }
    return Object.entries(grouped).slice(0, 6).map(([k, v]) => ({
      subject: k.length > 10 ? k.slice(0, 10) + '..' : k,
      A: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));
  }, [topicPerformance]);

  // Daily activity chart (last 7 days)
  const activityChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dailyActivity.find(a => a.date === dateStr);
      days.push({
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        quizzes: dayData?.quizzes || 0,
        score: dayData?.score || 0,
        mins: dayData?.studyMins || 0,
      });
    }
    return days;
  }, [dailyActivity]);

  // Topic distribution pie
  const topicPie = useMemo(() => {
    const topics = Object.values(topicPerformance);
    if (topics.length === 0) return [];
    return topics.slice(0, 5).map(t => ({
      name: t.topic.length > 12 ? t.topic.slice(0, 12) + '..' : t.topic,
      value: t.attempts,
    }));
  }, [topicPerformance]);
  const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(140, 45%, 40%)', 'hsl(270, 40%, 50%)', 'hsl(25, 60%, 45%)'];

  // Personality handler
  const handlePersonalityAnswer = (optIndex: number) => {
    const nextAnswers = [...personalityAnswers];
    nextAnswers[personalityStep] = optIndex;
    setPersonalityAnswers(nextAnswers);
    if (personalityStep < 4) {
      setPersonalityStep(personalityStep + 1);
    } else {
      setPersonalityDone(true);
      const traits = ['Strategic Thinker', 'Action-Oriented Learner', 'Supportive Collaborator', 'Resilient Under Pressure', 'Creative Problem Solver'];
      const res = traits[optIndex] || 'Balanced Professional';
      setPersonalityResult(res);
    }
  };

  // Preparation advice
  const prepTips = useMemo(() => {
    const tips = [];
    if (quizAccuracy < 50) tips.push(isHi ? 'क्विज़ अभ्यास बढ़ाएं — प्रतिदिन 3 क्विज़' : 'Focus on quiz practice — aim for 3 quizzes/day');
    if (interviewPerf < 50) tips.push(isHi ? 'मॉक इंटरव्यू अभ्यास बढ़ाएं' : 'Practice more mock interviews');
    if (consistency < 50) tips.push(isHi ? 'दैनिक अभ्यास की आदत बनाएं' : 'Build a daily practice habit');
    if (quizAccuracy >= 70 && interviewPerf >= 70) tips.push(isHi ? 'कंपनी-विशिष्ट तैयारी करें!' : 'Focus on company-specific preparation!');
    if (tips.length === 0) tips.push(isHi ? 'सभी क्षेत्रों में सुधार संभव' : 'Room for improvement in all areas');
    return tips;
  }, [quizAccuracy, interviewPerf, consistency, isHi]);

  return (
    <div className="max-w-5xl space-y-5 animate-fade-in">
      {/* Header + Personality Button */}
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <User className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold truncate">{user?.name || 'Student'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent capitalize border border-accent/25">
              {domainConfig[domain].label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <Mail className="w-3.5 h-3.5 shrink-0" /> {authUser?.email || 'Authenticated User'}
          </p>
          <p className="text-sm text-muted-foreground">{user?.college || 'College not set'} · {user?.specialization || 'Branch not set'}</p>
          <p className="text-xs text-accent mt-1">Dream: {user?.dreamCompany || 'Not set'} · Timeline: {user?.timeline || '6'} months</p>
          {personalityResult && <p className="text-[10px] text-muted-foreground mt-1">{personalityResult}</p>}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Link
              to="/dashboard/settings"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              {isHi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
            </Link>
            <Link
              to="/dashboard/settings"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              {isHi ? 'पासवर्ड बदलें' : 'Change Password'}
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Rank</p>
            <p className="text-2xl font-bold">#{rank}</p>
          </div>
          <button onClick={() => { setShowPersonality(true); setPersonalityStep(0); setPersonalityDone(false); }}
            className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-all flex items-center gap-1">
            <Brain className="w-3 h-3" /> {isHi ? 'व्यक्तित्व जांच' : 'Personality Check'}
          </button>
        </div>
      </div>

      {/* Personality Modal */}
      {showPersonality && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPersonality(false)}>
          <div className="bg-card rounded-2xl p-8 shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{isHi ? 'व्यक्तित्व जांच' : 'Personality Check'}</h3>
              <button onClick={() => setShowPersonality(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {!personalityDone ? (
              <div className="space-y-4">
                <div className="flex gap-1.5 justify-center">
                  {personalityQuestions.map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < personalityStep ? 'bg-accent' : i === personalityStep ? 'bg-accent scale-125' : 'bg-border'}`} />
                  ))}
                </div>
                <p className="text-sm font-medium">{personalityQuestions[personalityStep].q}</p>
                <div className="grid gap-2">
                  {personalityQuestions[personalityStep].options.map((opt, oi) => (
                    <button key={oi} onClick={() => handlePersonalityAnswer(oi)}
                      className={`text-sm py-3 px-4 rounded-xl border transition-all text-left ${
                        personalityAnswers[personalityStep] === oi ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/50'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                <p className="font-bold mb-1">{isHi ? 'पूर्ण!' : 'Complete!'}</p>
                <p className="text-sm text-muted-foreground">{personalityResult}</p>
                <button onClick={() => setShowPersonality(false)} className="mt-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium">
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: isHi ? 'रैंक' : 'Rank', value: `Top ${Math.round(((totalStudents - rank) / totalStudents) * 100)}%` },
          { icon: Award, label: isHi ? 'स्ट्रीक' : 'Streak', value: `${streak} days` },
          { icon: Calendar, label: isHi ? 'टास्क' : 'Tasks', value: String(tasksDone) },
          { icon: Brain, label: isHi ? 'क्विज़' : 'Quizzes', value: String(quizHistory.length) },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1 text-accent" />
            <p className="text-sm font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Placement Readiness Score */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          {isHi ? 'प्लेसमेंट तत्परता स्कोर' : 'Placement Readiness Score'}
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle cx="90" cy="90" r={radius} fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{animatedScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isHi ? `${user?.dreamCompany || config.companies[0]} के लिए` : `For ${user?.dreamCompany || config.companies[0]}`}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Brain, label: isHi ? 'क्विज़ सटीकता' : 'Quiz Accuracy', value: quizAccuracy, weight: '40%' },
              { icon: Target, label: isHi ? 'इंटरव्यू प्रदर्शन' : 'Interview Perf.', value: interviewPerf, weight: '40%' },
              { icon: Flame, label: isHi ? 'निरंतरता' : 'Consistency', value: consistency, weight: '20%' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground text-right">{isHi ? 'वजन' : 'Weight'}: {item.weight}</p>
                </div>
              </div>
            ))}
            {/* Dynamic message */}
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 mt-2">
              {feedback.map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5 py-0.5">
                  <Zap className="w-3 h-3 text-accent flex-shrink-0" /> {f}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity & History Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 7-day activity */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            {isHi ? 'पिछले 7 दिन' : 'Last 7 Days Activity'}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activityChart}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip />
              <Bar dataKey="quizzes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name={isHi ? 'क्विज़' : 'Quizzes'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic distribution */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            {isHi ? 'विषय वितरण' : 'Topic Distribution'}
          </h3>
          {topicPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={topicPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name }) => name}>
                  {topicPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              {isHi ? 'क्विज़ दें — डेटा यहाँ दिखेगा' : 'Take quizzes — data appears here'}
            </div>
          )}
        </div>
      </div>

      {/* Score trend */}
      {dailyActivity.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            {isHi ? 'स्कोर ट्रेंड' : 'Score Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={activityChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name={isHi ? 'स्कोर' : 'Score'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Skill Radar */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">{isHi ? 'कौशल रडार' : 'Skill Radar'}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <Radar name="Skills" dataKey="A" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Quiz History */}
      {quizHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">{isHi ? 'क्विज़ इतिहास' : 'Quiz History'}</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {quizHistory.slice().reverse().slice(0, 15).map((s, i) => {
              const acc = Math.round((s.correctAnswers / Math.max(1, s.totalQuestions)) * 100);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{s.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{s.quizType} · {s.difficulty.toUpperCase()} · {new Date(s.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${acc >= 70 ? 'text-green-600' : acc >= 40 ? 'text-accent' : 'text-destructive'}`}>{acc}%</span>
                    <span className="text-[10px] text-muted-foreground">{s.correctAnswers}/{s.totalQuestions}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Company Test History */}
      {companyTestHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">{isHi ? 'कंपनी टेस्ट इतिहास' : 'Company Test History'}</h3>
          <div className="space-y-2">
            {companyTestHistory.slice().reverse().slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{t.company}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${(t.score / t.total) >= 0.7 ? 'text-green-600' : 'text-accent'}`}>{t.score}/{t.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Picker */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">{isHi ? 'थीम' : 'Theme'}</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {themes.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={`p-3 rounded-xl border text-center transition-all ${theme === t.id ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/50'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${t.color}`} />
              <p className="text-[10px] font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
