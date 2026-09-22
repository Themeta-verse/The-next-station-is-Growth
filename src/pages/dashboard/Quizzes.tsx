import { useState, useEffect, useCallback, useRef } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useAuth } from '@/context/AuthContext';
import {
  Brain, Zap, Clock, Star, Shield, X, ArrowRight, CheckCircle, XCircle,
  Timer, ArrowLeft, Lightbulb, TrendingUp, BarChart3, Gauge, Flame,
  ChevronRight, Target, Award, Activity, MapPin, Radio,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

type Difficulty = 'basic' | 'medium' | 'hard';
interface Q { q: string; options: string[]; correct: number; difficulty: Difficulty; company?: string; explanation: string; topic?: string; }

const questionBank: Record<string, { iq: Q[]; eq: Q[]; rq: Q[] }> = {
  engineering: {
    iq: [
      { q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, difficulty: 'basic', explanation: 'Binary search divides the search space in half each time, so it takes log₂(n) steps.', topic: 'DSA' },
      { q: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correct: 1, difficulty: 'basic', explanation: 'Queue follows First-In-First-Out (FIFO).', topic: 'DSA' },
      { q: 'What is 2^10?', options: ['512', '1024', '2048', '256'], correct: 1, difficulty: 'basic', explanation: '2^10 = 1024. Fundamental in CS as 1 KB = 1024 bytes.', topic: 'Aptitude' },
      { q: 'Which sorting algorithm has best average case?', options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], correct: 2, difficulty: 'medium', explanation: 'Merge Sort has O(n log n) average and worst case.', topic: 'DSA' },
      { q: 'A binary tree with n nodes has how many edges?', options: ['n', 'n-1', 'n+1', '2n'], correct: 1, difficulty: 'medium', explanation: 'Every node except root has one parent edge: n-1 edges.', topic: 'DSA' },
      { q: 'What is the amortized time for dynamic array insertion?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correct: 1, difficulty: 'hard', company: 'Google', explanation: 'Occasional resizing O(n) spread across n insertions gives O(1) amortized.', topic: 'DSA' },
      { q: 'Detect cycle in directed graph using?', options: ['BFS', 'DFS + coloring', 'Dijkstra', 'Union Find'], correct: 1, difficulty: 'hard', company: 'Amazon', explanation: 'DFS with 3-color marking detects back edges = cycles.', topic: 'DSA' },
      { q: 'LRU Cache uses which data structures?', options: ['Array + Stack', 'HashMap + DLL', 'Tree + Queue', 'Graph + Heap'], correct: 1, difficulty: 'hard', company: 'Microsoft', explanation: 'HashMap O(1) lookup + DLL O(1) insertion/deletion.', topic: 'DSA' },
    ],
    eq: [
      { q: 'Your teammate pushes buggy code before a demo. You:', options: ['Fix it quietly', 'Call them out publicly', 'Report to manager', 'Discuss privately after'], correct: 3, difficulty: 'basic', explanation: 'Private discussion preserves dignity and builds trust.', topic: 'Communication' },
      { q: "You disagree with the tech lead's architecture. You:", options: ['Just follow orders', 'Present data-backed alternative', 'Complain to others', 'Refuse to implement'], correct: 1, difficulty: 'medium', explanation: 'Data-backed alternative shows initiative and respect.', topic: 'Communication' },
      { q: 'A junior dev is struggling. You:', options: ['Let them figure it out', 'Pair program with them', 'Do their work', 'Tell the manager'], correct: 1, difficulty: 'basic', explanation: 'Pair programming teaches while solving the problem.', topic: 'Communication' },
      { q: 'Deadline is tomorrow but code has bugs. You:', options: ['Ship anyway', 'Ask for extension with clear reasoning', 'Pull all-nighter alone', 'Blame QA'], correct: 1, difficulty: 'medium', explanation: 'Proactive communication shows professionalism.', topic: 'Communication' },
      { q: 'You receive harsh code review feedback. You:', options: ['Get defensive', 'Ignore it', 'Learn from it and improve', 'Complain to HR'], correct: 2, difficulty: 'basic', explanation: 'Code reviews are learning opportunities.', topic: 'Communication' },
    ],
    rq: [
      { q: 'What does REST stand for?', options: ['Remote Execution Service Tool', 'Representational State Transfer', 'Reliable Server Technology', 'Resource Extraction Standard'], correct: 1, difficulty: 'basic', explanation: 'REST is an architectural style for APIs using HTTP methods.', topic: 'Web Dev' },
      { q: 'Which protocol does HTTPS use for encryption?', options: ['SSH', 'TLS/SSL', 'FTP', 'SMTP'], correct: 1, difficulty: 'basic', explanation: 'HTTPS uses TLS to encrypt data in transit.', topic: 'Networking' },
      { q: 'What is Docker primarily used for?', options: ['Version control', 'Containerization', 'Testing', 'Deployment only'], correct: 1, difficulty: 'medium', explanation: 'Docker packages apps with dependencies into containers.', topic: 'System Design' },
      { q: 'SQL JOIN that returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], correct: 2, difficulty: 'medium', explanation: 'FULL OUTER JOIN returns all rows from both tables.', topic: 'Database' },
      { q: 'What is CI/CD?', options: ['Code Integration/Code Delivery', 'Continuous Integration/Continuous Delivery', 'Central Intelligence/Central Data', 'Code Inspection/Code Debug'], correct: 1, difficulty: 'basic', explanation: 'CI tests code changes; CD deploys them automatically.', topic: 'System Design' },
      { q: 'What is eventual consistency in distributed systems?', options: ['All nodes always in sync', 'Nodes may differ temporarily', 'Data never syncs', 'Only leader has data'], correct: 1, difficulty: 'hard', company: 'Amazon', explanation: 'Replicas converge to same state over time.', topic: 'System Design' },
    ],
  },
  commerce: {
    iq: [
      { q: 'If a product costs ₹400 and sells for ₹500, profit % is?', options: ['20%', '25%', '30%', '15%'], correct: 1, difficulty: 'basic', explanation: 'Profit % = (100/400) × 100 = 25%.', topic: 'Quantitative Aptitude' },
      { q: 'Simple Interest on ₹1000 at 10% for 2 years?', options: ['₹100', '₹200', '₹210', '₹150'], correct: 1, difficulty: 'basic', explanation: 'SI = P × R × T / 100 = ₹200.', topic: 'Quantitative Aptitude' },
      { q: 'Average of first 10 natural numbers?', options: ['5', '5.5', '6', '4.5'], correct: 1, difficulty: 'basic', explanation: 'Sum = 55, Average = 55/10 = 5.5.', topic: 'Quantitative Aptitude' },
      { q: 'If A:B = 2:3 and B:C = 4:5, then A:C = ?', options: ['8:15', '2:5', '4:5', '6:10'], correct: 0, difficulty: 'medium', explanation: 'Make B common: A:B = 8:12, B:C = 12:15. A:C = 8:15.', topic: 'Quantitative Aptitude' },
      { q: 'Compound interest on ₹10000 at 10% for 2 years?', options: ['₹2000', '₹2100', '₹2200', '₹1900'], correct: 1, difficulty: 'hard', company: 'SBI PO', explanation: 'CI = 10000[(1.1)² - 1] = ₹2100.', topic: 'Quantitative Aptitude' },
    ],
    eq: [
      { q: 'A customer is angry about a service delay. You:', options: ['Argue with them', 'Listen empathetically and resolve', 'Ignore them', 'Pass to someone else'], correct: 1, difficulty: 'basic', explanation: 'Active listening defuses anger.', topic: 'Communication' },
      { q: 'You notice a colleague making accounting errors. You:', options: ['Report immediately to boss', 'Help them identify and fix', 'Ignore it', 'Tell other colleagues'], correct: 1, difficulty: 'medium', explanation: 'Helping them fix errors builds trust.', topic: 'Communication' },
      { q: 'A senior gives you credit for their work. You:', options: ['Accept it', 'Clarify the truth respectfully', 'Tell everyone', 'Stay silent'], correct: 1, difficulty: 'basic', explanation: 'Honesty builds long-term credibility.', topic: 'Communication' },
    ],
    rq: [
      { q: 'What is the full form of NABARD?', options: ['National Bank for Agriculture and Rural Development', 'National Board of Agricultural Research', 'National Bureau of Audit and Revenue', 'None of these'], correct: 0, difficulty: 'basic', explanation: 'NABARD is the apex development bank for agriculture.', topic: 'Banking Awareness' },
      { q: 'What is KYC?', options: ['Keep Your Cash', 'Know Your Customer', 'Key Yield Certificate', 'Knowledge Yearly Check'], correct: 1, difficulty: 'basic', explanation: 'KYC verifies customer identity.', topic: 'Banking Awareness' },
      { q: 'RTGS minimum transfer amount?', options: ['₹1 lakh', '₹2 lakh', '₹50,000', 'No minimum'], correct: 1, difficulty: 'medium', explanation: 'RTGS minimum is ₹2 lakh.', topic: 'Banking Awareness' },
      { q: 'What is NPA in banking?', options: ['New Profit Account', 'Non-Performing Asset', 'National Payment Authority', 'Net Payable Amount'], correct: 1, difficulty: 'basic', explanation: 'NPA is a loan overdue for 90+ days.', topic: 'Banking Awareness' },
    ],
  },
  arts: {
    iq: [
      { q: 'How many schedules are in the Indian Constitution?', options: ['8', '10', '12', '14'], correct: 2, difficulty: 'basic', explanation: 'The Indian Constitution has 12 Schedules.', topic: 'Indian Polity' },
      { q: 'Who was the first President of India?', options: ['Jawaharlal Nehru', 'Rajendra Prasad', 'S. Radhakrishnan', 'Zakir Hussain'], correct: 1, difficulty: 'basic', explanation: 'Dr. Rajendra Prasad served from 1950-1962.', topic: 'Indian History' },
      { q: 'Article 21 of the Constitution deals with?', options: ['Right to Education', 'Right to Life and Liberty', 'Right to Equality', 'Right to Freedom of Speech'], correct: 1, difficulty: 'basic', explanation: 'Article 21 guarantees Right to Life and Personal Liberty.', topic: 'Indian Polity' },
      { q: 'The Battle of Plassey was fought in which year?', options: ['1757', '1764', '1857', '1947'], correct: 0, difficulty: 'basic', explanation: 'Battle of Plassey (1757) marked British political control.', topic: 'Indian History' },
      { q: 'The concept of "Basic Structure" doctrine came from which case?', options: ['Golaknath', 'Kesavananda Bharati', 'Minerva Mills', 'Maneka Gandhi'], correct: 1, difficulty: 'hard', company: 'UPSC', explanation: 'Kesavananda Bharati v. State of Kerala (1973).', topic: 'Indian Polity' },
    ],
    eq: [
      { q: 'As a district magistrate, a flood hits. First priority?', options: ['File report to HQ', 'Organize immediate rescue', 'Wait for orders', 'Call press conference'], correct: 1, difficulty: 'basic', explanation: 'Immediate rescue saves lives.', topic: 'Ethics & Governance' },
      { q: 'A local politician pressures you to bend rules. You:', options: ['Comply to avoid conflict', 'Politely refuse citing rules', 'Report to media', 'Transfer the case'], correct: 1, difficulty: 'medium', explanation: 'Polite refusal shows firmness with diplomacy.', topic: 'Ethics & Governance' },
      { q: 'You discover your senior officer is corrupt. You:', options: ['Join them', 'Document evidence and report', 'Ignore it', 'Resign'], correct: 1, difficulty: 'basic', explanation: 'Documenting and reporting is the ethical duty.', topic: 'Ethics & Governance' },
    ],
    rq: [
      { q: 'UPSC Prelims has how many papers?', options: ['1', '2', '3', '4'], correct: 1, difficulty: 'basic', explanation: 'Prelims has 2 papers: GS I and CSAT.', topic: 'UPSC Awareness' },
      { q: 'Ethics paper in UPSC Mains is which paper?', options: ['GS Paper I', 'GS Paper II', 'GS Paper III', 'GS Paper IV'], correct: 3, difficulty: 'medium', explanation: 'GS Paper IV covers Ethics, Integrity, Aptitude.', topic: 'UPSC Awareness' },
      { q: 'Which amendment is called Mini Constitution?', options: ['42nd', '44th', '73rd', '86th'], correct: 0, difficulty: 'medium', explanation: '42nd Amendment (1976) made the most comprehensive changes.', topic: 'Indian Polity' },
      { q: 'Panchayati Raj was constitutionalized by which amendment?', options: ['42nd', '73rd', '74th', '86th'], correct: 1, difficulty: 'basic', explanation: '73rd Amendment (1992) added Part IX.', topic: 'Indian Polity' },
    ],
  },
};

const quizCardConfigs = [
  { icon: Zap, gradient: 'from-violet-500/20 via-purple-500/10 to-violet-600/20', borderColor: 'border-violet-400/30', glowColor: 'shadow-violet-500/20', accentText: 'text-violet-600', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-600', trackColor: 'bg-violet-400', label: 'EXPRESS' },
  { icon: Clock, gradient: 'from-sky-500/20 via-blue-500/10 to-sky-600/20', borderColor: 'border-sky-400/30', glowColor: 'shadow-sky-500/20', accentText: 'text-sky-600', iconBg: 'bg-sky-500/15', iconColor: 'text-sky-600', trackColor: 'bg-sky-400', label: 'METRO' },
  { icon: Brain, gradient: 'from-amber-500/20 via-orange-500/10 to-amber-600/20', borderColor: 'border-amber-400/30', glowColor: 'shadow-amber-500/20', accentText: 'text-amber-700', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-700', trackColor: 'bg-amber-400', label: 'LOCAL' },
  { icon: Star, gradient: 'from-emerald-500/20 via-green-500/10 to-emerald-600/20', borderColor: 'border-emerald-400/30', glowColor: 'shadow-emerald-500/20', accentText: 'text-emerald-700', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-700', trackColor: 'bg-emerald-400', label: 'RAJDHANI' },
  { icon: Shield, gradient: 'from-rose-500/20 via-red-500/10 to-rose-600/20', borderColor: 'border-rose-400/30', glowColor: 'shadow-rose-500/20', accentText: 'text-rose-700', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-700', trackColor: 'bg-rose-400', label: 'SHATABDI' },
];

function TrackBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="60" x2="100%" y2="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
        <line x1="0" y1="63" x2="100%" y2="63" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
        {Array.from({ length: 30 }).map((_, i) => (
          <rect key={i} x={i * 80 + 10} y="55" width="6" height="14" fill="currentColor" rx="1" />
        ))}
      </svg>
      <div className="absolute top-[54px] h-[12px] w-32 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 rounded-full" style={{ animation: 'trainPass 6s linear infinite' }} />
      <style>{`
        @keyframes trainPass { 0% { left: -200px; } 100% { left: calc(100% + 200px); } }
        @keyframes signalBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        @keyframes correctPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        .animate-slide-up { animation: slideUp 0.4s ease forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
        .animate-shake { animation: shake 0.4s ease; }
        .animate-correct-pulse { animation: correctPulse 0.6s ease; }
        .signal-blink { animation: signalBlink 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function SignalIndicator({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colors = { green: 'bg-green-500 shadow-green-500/50', yellow: 'bg-yellow-500 shadow-yellow-500/50', red: 'bg-red-500 shadow-red-500/50' };
  return (
    <div className="flex flex-col items-center gap-0.5 p-1 bg-foreground/5 rounded border border-border/50">
      {(['red', 'yellow', 'green'] as const).reverse().map(c => (
        <div key={c} className={`w-2 h-2 rounded-full ${status === c ? `${colors[c]} shadow-md signal-blink` : 'bg-muted-foreground/20'}`} />
      ))}
    </div>
  );
}

function JourneyPanel({ quizHistory, streak }: { quizHistory: any[]; streak: number }) {
  const recentSessions = quizHistory.slice(-10);
  const avgAccuracy = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((s: number, q: any) => s + (q.correctAnswers / Math.max(1, q.totalQuestions)) * 100, 0) / recentSessions.length)
    : 0;
  const topicMap: Record<string, { correct: number; total: number }> = {};
  quizHistory.forEach((s: any) => {
    if (s.topic) {
      if (!topicMap[s.topic]) topicMap[s.topic] = { correct: 0, total: 0 };
      topicMap[s.topic].correct += s.correctAnswers;
      topicMap[s.topic].total += s.totalQuestions;
    }
  });
  const topics = Object.entries(topicMap).map(([name, v]) => ({ name, pct: Math.round((v.correct / Math.max(1, v.total)) * 100) })).sort((a, b) => a.pct - b.pct);
  const weak = topics.filter(t => t.pct < 50).slice(0, 2);
  const strong = topics.filter(t => t.pct >= 70).slice(0, 2);
  const completed = quizHistory.length;
  return (
    <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-accent" /></div>
        <div>
          <h3 className="font-bold text-sm tracking-tight">Your Journey Progress</h3>
          <p className="text-[10px] text-muted-foreground">Placement destination ahead</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Trips', value: completed, icon: '🚉', color: 'text-accent' },
          { label: 'Accuracy', value: `${avgAccuracy}%`, icon: '🎯', color: avgAccuracy >= 70 ? 'text-green-600' : avgAccuracy >= 40 ? 'text-amber-600' : 'text-destructive' },
          { label: 'Streak', value: `${streak}d`, icon: '🔥', color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
            <p className="text-base mb-0.5">{s.icon}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.min(100, completed * 8) * 1.38} 138.2`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold">{Math.min(100, completed * 8)}%</span></div>
        </div>
        <div>
          <p className="text-xs font-semibold">Journey completion</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{completed} quizzes · {Math.max(0, 13 - completed)} more to destination</p>
          <div className="flex gap-1 mt-1.5">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i < Math.min(5, Math.ceil(completed / 2)) ? 'bg-accent' : 'bg-muted'}`} />))}</div>
        </div>
      </div>
      {(strong.length > 0 || weak.length > 0) && (
        <div className="space-y-2">
          {strong.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Strong Stations</p>
              {strong.map(t => (<div key={t.name} className="flex items-center gap-2 mb-1"><span className="text-[10px] text-muted-foreground flex-1 truncate">{t.name}</span><div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${t.pct}%` }} /></div><span className="text-[10px] font-bold text-green-600 w-7 text-right">{t.pct}%</span></div>))}
            </div>
          )}
          {weak.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block signal-blink" /> Needs Work</p>
              {weak.map(t => (<div key={t.name} className="flex items-center gap-2 mb-1"><span className="text-[10px] text-muted-foreground flex-1 truncate">{t.name}</span><div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${t.pct}%` }} /></div><span className="text-[10px] font-bold text-red-500 w-7 text-right">{t.pct}%</span></div>))}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/20">
        <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-orange-700">{streak} day streak 🔥</p>
          <div className="flex gap-0.5 mt-0.5">{Array.from({ length: 7 }).map((_, i) => (<div key={i} className={`h-1 w-4 rounded-full ${i < streak ? 'bg-orange-500' : 'bg-muted'}`} />))}</div>
        </div>
      </div>
    </div>
  );
}

function StationCard({ quizType, index, onStart, config }: { quizType: string; index: number; onStart: () => void; config: typeof quizCardConfigs[0] }) {
  const Icon = config.icon;
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onStart} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-2xl border p-5 text-left bg-gradient-to-br ${config.gradient} ${config.borderColor} transition-all duration-300 ease-out group ${hovered ? `shadow-lg ${config.glowColor} -translate-y-1` : 'shadow-sm'} animate-slide-up`}
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${config.trackColor} opacity-60`} />
      <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest"><span className={config.accentText}>PF-{index + 1}</span></div>
      <div className="absolute bottom-3 right-3"><SignalIndicator status="green" /></div>
      <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center mb-4 transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>
      <p className={`text-[9px] font-black tracking-[0.15em] ${config.accentText} mb-1 opacity-70`}>{config.label}</p>
      <h3 className="font-bold text-sm leading-tight mb-1">{quizType}</h3>
      <p className="text-[10px] text-muted-foreground mb-4">3 sections · IQ + EQ + RQ</p>
      <div className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 text-xs font-bold transition-all duration-200 ${hovered ? 'bg-card/90 border-border/60' : ''}`}>
        Board Train <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${hovered ? 'translate-x-0.5' : ''}`} />
      </div>
    </button>
  );
}

type QuizPhase = 'select' | 'difficulty' | 'topic' | 'playing' | 'results';
type QuizSection = 'iq' | 'eq' | 'rq';

export default function Quizzes() {
  const { domain, boostRank, setQuizScores, language, streak } = useStationStore();
  const { recordProgress } = useAuth();
  const { recordQuizAnswer, saveQuizSession, getAdaptiveDifficulty, logDailyActivity, quizHistory } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [phase, setPhase] = useState<QuizPhase>('select');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('basic');
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<Difficulty | null>(null);
  const [currentSection, setCurrentSection] = useState<QuizSection>('iq');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scores, setScores] = useState({ iq: 0, eq: 0, rq: 0 });
  const [showExplanation, setShowExplanation] = useState(false);
  const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null);

  const questionStartTime = useRef(Date.now());
  const sessionStartTime = useRef(Date.now());

  const questions = questionBank[domain] || questionBank.engineering;
  const filteredQuestions = {
    iq: questions.iq.filter(q => q.difficulty === selectedDifficulty || selectedDifficulty === 'hard'),
    eq: questions.eq.filter(q => q.difficulty === selectedDifficulty || q.difficulty === 'basic'),
    rq: questions.rq.filter(q => q.difficulty === selectedDifficulty || selectedDifficulty === 'hard'),
  };
  const sectionQuestions = filteredQuestions[currentSection].length >= 3 ? filteredQuestions[currentSection] : questions[currentSection].slice(0, 5);
  const currentQuestion = sectionQuestions[currentQ];
  const sectionLabels: Record<QuizSection, string> = { iq: 'IQ — Analytical', eq: 'EQ — Situational', rq: 'RQ — Domain Knowledge' };
  const sections: QuizSection[] = ['iq', 'eq', 'rq'];
  const sectionEmojis: Record<QuizSection, string> = { iq: '🧠', eq: '💡', rq: '📚' };

  const recentSessions = quizHistory.slice(-5);
  const avgAccuracy = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((s: number, q: any) => s + (q.correctAnswers / Math.max(1, q.totalQuestions)) * 100, 0) / recentSessions.length)
    : 0;

  useEffect(() => {
    if (phase !== 'playing' || showFeedback) return;
    if (timeLeft <= 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, showFeedback]);

  const startQuiz = (quizType: string) => {
    setSelectedQuiz(quizType);
    const firstTopic = config.quizPopupOptions[0];
    const suggested = getAdaptiveDifficulty(firstTopic);
    setSuggestedDifficulty(suggested);
    setPhase('difficulty');
  };

  const selectDifficulty = (d: Difficulty) => { setSelectedDifficulty(d); setPhase('topic'); };

  const startPlaying = (topic: string) => {
    setSelectedTopic(topic);
    setPhase('playing');
    setCurrentSection('iq');
    setCurrentQ(0);
    setScores({ iq: 0, eq: 0, rq: 0 });
    setTimeLeft(selectedDifficulty === 'hard' ? 20 : selectedDifficulty === 'medium' ? 25 : 30);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowExplanation(false);
    setAnswerAnim(null);
    questionStartTime.current = Date.now();
    sessionStartTime.current = Date.now();
  };

  const proceedToNext = useCallback(() => {
    setShowExplanation(false);
    setAnswerAnim(null);
    questionStartTime.current = Date.now();
    if (currentQ < sectionQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(selectedDifficulty === 'hard' ? 20 : selectedDifficulty === 'medium' ? 25 : 30);
    } else {
      const sIdx = sections.indexOf(currentSection);
      if (sIdx < 2) {
        setCurrentSection(sections[sIdx + 1]);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTimeLeft(selectedDifficulty === 'hard' ? 20 : selectedDifficulty === 'medium' ? 25 : 30);
      } else {
        const totalCorrect = scores.iq + scores.eq + scores.rq;
        const totalQs = sectionQuestions.length * 3;
        const timeTaken = Math.round((Date.now() - sessionStartTime.current) / 1000);
        saveQuizSession({ date: new Date().toISOString(), quizType: selectedQuiz, topic: selectedTopic, difficulty: selectedDifficulty, totalQuestions: totalQs, correctAnswers: totalCorrect, timeTaken, scores });
        logDailyActivity(1, Math.round(timeTaken / 60), Math.round((totalCorrect / Math.max(1, totalQs)) * 100));
        setPhase('results');
        boostRank(selectedDifficulty === 'hard' ? 25 : selectedDifficulty === 'medium' ? 15 : 10);
        setQuizScores(scores);
        recordProgress({ scoreDelta: Math.max(20, totalCorrect * 25), streak });
      }
    }
  }, [currentQ, currentSection, sectionQuestions.length, sections, boostRank, selectedDifficulty, scores, setQuizScores, saveQuizSession, logDailyActivity, selectedQuiz, selectedTopic, recordProgress, streak]);

  const handleAnswer = useCallback((ansIdx: number) => {
    if (showFeedback || !currentQuestion) return;
    setSelectedAnswer(ansIdx);
    setShowFeedback(true);
    setShowExplanation(true);
    const isCorrect = ansIdx === currentQuestion.correct;
    setAnswerAnim(isCorrect ? 'correct' : 'wrong');
    const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
    const topic = currentQuestion.topic || selectedTopic;
    recordQuizAnswer(topic, isCorrect, timeTaken, selectedDifficulty);
    if (isCorrect) setScores(prev => ({ ...prev, [currentSection]: prev[currentSection] + 1 }));
  }, [showFeedback, currentQuestion, currentSection, selectedDifficulty, selectedTopic, recordQuizAnswer]);

  const totalQs = sectionQuestions.length * 3;
  const totalCorrect = scores.iq + scores.eq + scores.rq;
  const gScore = Math.round((scores.iq / Math.max(1, sectionQuestions.length)) * 100);
  const mScore = Math.round((scores.rq / Math.max(1, sectionQuestions.length)) * 100);
  const aScore = Math.round((scores.eq / Math.max(1, sectionQuestions.length)) * 100);
  const radarData = [{ subject: 'IQ', A: gScore }, { subject: 'RQ', A: mScore }, { subject: 'EQ', A: aScore }];

  // SELECT
  if (phase === 'select') {
    return (
      <div className="max-w-5xl animate-fade-in">
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6">
          <TrackBackground />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent signal-blink" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Live · All stations ready</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-1">{isHi ? 'क्विज़ स्टेशन' : 'Quiz Station'}</h1>
              <p className="text-sm text-muted-foreground">{isHi ? config.labelHi : config.label} — IQ + EQ + RQ · Choose your platform</p>
            </div>
            {recentSessions.length > 0 && (
              <div className="flex items-center gap-4 bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 px-4 py-3">
                <div className="text-right"><p className="text-[9px] text-muted-foreground uppercase tracking-wide">Accuracy</p><p className={`text-xl font-black ${avgAccuracy >= 70 ? 'text-green-600' : avgAccuracy >= 40 ? 'text-accent' : 'text-destructive'}`}>{avgAccuracy}%</p></div>
                <div className="w-px h-8 bg-border" />
                <div className="text-right"><p className="text-[9px] text-muted-foreground uppercase tracking-wide">Quizzes</p><p className="text-xl font-black">{quizHistory.length}</p></div>
                <div className="w-px h-8 bg-border" />
                <div className="text-right"><p className="text-[9px] text-muted-foreground uppercase tracking-wide">Streak</p><p className="text-xl font-black text-orange-600">{streak}d 🔥</p></div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-1"><Radio className="w-3.5 h-3.5 text-accent" /><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Choose Your Platform</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {config.quizTypes.map((qt: string, i: number) => (
                <StationCard key={qt} quizType={qt} index={i} onStart={() => startQuiz(qt)} config={quizCardConfigs[i % quizCardConfigs.length]} />
              ))}
            </div>
            {recentSessions.length > 0 && (
              <div className="bg-card/60 rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-3.5 h-3.5 text-accent" /><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Journeys</h3></div>
                <div className="space-y-2">
                  {recentSessions.slice().reverse().map((s: any, i: number) => {
                    const acc = Math.round((s.correctAnswers / Math.max(1, s.totalQuestions)) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                        <div className="flex items-center gap-3"><SignalIndicator status={acc >= 70 ? 'green' : acc >= 40 ? 'yellow' : 'red'} /><div><p className="text-xs font-semibold">{s.topic}</p><p className="text-[9px] text-muted-foreground">{s.quizType} · {s.difficulty?.toUpperCase()} · {new Date(s.date).toLocaleDateString()}</p></div></div>
                        <div className="text-right"><p className={`text-sm font-bold ${acc >= 70 ? 'text-green-600' : acc >= 40 ? 'text-accent' : 'text-destructive'}`}>{acc}%</p><p className="text-[9px] text-muted-foreground">{s.correctAnswers}/{s.totalQuestions}</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4"><Activity className="w-3.5 h-3.5 text-accent" /><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Journey Status</p></div>
            <JourneyPanel quizHistory={quizHistory} streak={streak} />
          </div>
        </div>
      </div>
    );
  }

  // DIFFICULTY
  if (phase === 'difficulty') {
    const diffOptions = [
      { d: 'basic' as Difficulty, label: 'Local Train', emoji: '🚃', desc: '30s per question · Fundamentals', note: 'Comfortable pace, great for building foundations', color: 'border-green-400/40 hover:border-green-400/70', accent: 'text-green-700', badge: 'bg-green-500/10 text-green-700' },
      { d: 'medium' as Difficulty, label: 'Express Train', emoji: '🚄', desc: '25s per question · Deeper understanding', note: 'Moderate challenge, ideal for placement prep', color: 'border-accent/40 hover:border-accent/70', accent: 'text-accent', badge: 'bg-accent/10 text-accent' },
      { d: 'hard' as Difficulty, label: 'Rajdhani Express', emoji: '⚡', desc: '20s per question · Company-specific questions', note: 'Maximum challenge, FAANG-level questions', color: 'border-red-400/40 hover:border-red-400/70', accent: 'text-red-600', badge: 'bg-red-500/10 text-red-600' },
    ];
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <button onClick={() => setPhase('select')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back to platforms</button>
        <div className="relative mb-8 rounded-2xl border border-border/50 bg-card/50 p-5 overflow-hidden">
          <TrackBackground />
          <div className="relative z-10"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Selected Platform</p><h2 className="text-xl font-black">{selectedQuiz}</h2><p className="text-sm text-muted-foreground mt-1">Choose your train class</p></div>
        </div>
        {suggestedDifficulty && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-accent/5 border border-accent/20 mb-5">
            <Gauge className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-xs">AI suggests: <span className="font-bold text-accent">{suggestedDifficulty === 'basic' ? 'Local Train' : suggestedDifficulty === 'medium' ? 'Express Train' : 'Rajdhani Express'}</span><span className="text-muted-foreground"> — based on your past performance</span></p>
          </div>
        )}
        <div className="space-y-3">
          {diffOptions.map((item, i) => (
            <button key={item.d} onClick={() => selectDifficulty(item.d)} className={`w-full p-5 rounded-2xl border text-left transition-all duration-200 bg-card/60 ${item.color} hover:-translate-y-0.5 hover:shadow-md animate-slide-up ${suggestedDifficulty === item.d ? 'ring-1 ring-accent/30' : ''}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5"><span className="text-xl">{item.emoji}</span><p className={`font-bold text-base ${item.accent}`}>{item.label}</p></div>
                {suggestedDifficulty === item.d && <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${item.badge}`}>Recommended</span>}
              </div>
              <p className="text-xs font-medium mb-1">{item.desc}</p>
              <p className="text-[10px] text-muted-foreground">{item.note}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // TOPIC
  if (phase === 'topic') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setPhase('select')}>
        <div className="bg-card rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl w-full max-w-md animate-slide-up border border-border/50" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <div><p className="text-[9px] text-muted-foreground uppercase tracking-widest">{selectedQuiz} · {selectedDifficulty.toUpperCase()}</p><h3 className="text-lg font-black mt-0.5">Choose Your Station</h3></div>
            <button onClick={() => setPhase('select')} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-1.5 mb-4 text-[10px] text-accent"><Gauge className="w-3 h-3" /><span>Difficulty adapts to your performance as you progress</span></div>
          <div className="grid grid-cols-2 gap-2.5">
            {config.quizPopupOptions.map((opt: string, i: number) => {
              const adaptDiff = getAdaptiveDifficulty(opt);
              const diffColors: Record<Difficulty, string> = { hard: 'bg-red-500/10 text-red-600', medium: 'bg-accent/10 text-accent', basic: 'bg-green-500/10 text-green-600' };
              return (
                <button key={opt} onClick={() => startPlaying(opt)} className="p-4 rounded-xl border border-border/50 text-left transition-all hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-0.5 hover:shadow-md animate-slide-up bg-card/60" style={{ animationDelay: `${i * 60}ms` }}>
                  <Brain className="w-4 h-4 text-accent mb-2" />
                  <p className="text-xs font-semibold leading-tight mb-2">{opt}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${diffColors[adaptDiff]}`}>{adaptDiff.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === 'playing' && currentQuestion) {
    const totalQsPlayed = sections.indexOf(currentSection) * sectionQuestions.length + currentQ;
    const overallProgress = (totalQsPlayed / (sectionQuestions.length * 3)) * 100;
    const maxTime = selectedDifficulty === 'hard' ? 20 : selectedDifficulty === 'medium' ? 25 : 30;
    const timePct = (timeLeft / maxTime) * 100;
    const timerColor = timeLeft <= 5 ? 'text-red-600' : timeLeft <= 10 ? 'text-amber-600' : 'text-accent';
    const timerBarColor = timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-accent';
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setPhase('select')} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></button>
            <div><p className="text-[9px] text-muted-foreground uppercase tracking-widest">{selectedQuiz}</p><p className="text-sm font-bold">{sectionEmojis[currentSection]} {sectionLabels[currentSection]}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <SignalIndicator status={timeLeft > 15 ? 'green' : timeLeft > 7 ? 'yellow' : 'red'} />
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground/5 border border-border/50 font-mono ${timerColor} transition-colors duration-500`}>
              <Timer className="w-3.5 h-3.5" /><span className="text-sm font-black tabular-nums">{String(timeLeft).padStart(2, '0')}s</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-accent/10 text-[10px] font-bold text-accent">{selectedDifficulty.toUpperCase()}</div>
          </div>
        </div>
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            {sections.map((s, i) => {
              const isPast = sections.indexOf(s) < sections.indexOf(currentSection);
              const isCurrent = s === currentSection;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${isCurrent ? 'bg-accent text-accent-foreground' : isPast ? 'bg-green-500/15 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {isPast ? '✓ ' : ''}{s.toUpperCase()}
                  </div>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
                </div>
              );
            })}
            <div className="ml-auto text-[10px] text-muted-foreground">{currentQ + 1} / {sectionQuestions.length}</div>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-700 ease-out" style={{ width: `${overallProgress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-card shadow-md transition-all duration-700 ease-out" style={{ left: `calc(${overallProgress}% - 6px)` }} />
          </div>
          <div className="relative h-1 bg-muted/50 rounded-full overflow-hidden">
            <div className={`absolute left-0 top-0 h-full ${timerBarColor} rounded-full transition-all duration-1000 linear`} style={{ width: `${timePct}%` }} />
          </div>
        </div>
        <div className={`bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 transition-all duration-300 ${answerAnim === 'correct' ? 'animate-correct-pulse border-green-400/50' : ''} ${answerAnim === 'wrong' ? 'animate-shake border-red-400/30' : ''}`}>
          <div className="flex gap-1.5 mb-4">
            {currentQuestion.company && <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">🏢 {currentQuestion.company}</span>}
            {currentQuestion.topic && <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{currentQuestion.topic}</span>}
            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">Q{totalQsPlayed + 1}</span>
          </div>
          <p className="text-base font-semibold leading-relaxed mb-6">{currentQuestion.q}</p>
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, oi) => {
              let baseStyle = 'border-border/50 bg-background/50 hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-px';
              let icon = null;
              if (showFeedback) {
                if (oi === currentQuestion.correct) { baseStyle = 'border-green-400/70 bg-green-500/10 text-green-800'; icon = <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />; }
                else if (oi === selectedAnswer && oi !== currentQuestion.correct) { baseStyle = 'border-red-400/70 bg-red-500/10 text-red-800'; icon = <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />; }
                else { baseStyle = 'border-border/30 opacity-50'; }
              }
              return (
                <button key={oi} onClick={() => !showFeedback && handleAnswer(oi)} disabled={showFeedback}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-sm text-left transition-all duration-200 ${baseStyle} disabled:cursor-default`}>
                  <span className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center text-xs font-black flex-shrink-0">{String.fromCharCode(65 + oi)}</span>
                  <span className="flex-1 font-medium">{opt}</span>
                  {icon}
                </button>
              );
            })}
          </div>
          {showExplanation && currentQuestion.explanation && (
            <div className="mt-5 animate-slide-up">
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div><p className="text-[10px] font-black text-accent uppercase tracking-wider mb-1">Explanation</p><p className="text-xs text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p></div>
                </div>
              </div>
              <button onClick={proceedToNext} className="mt-3 w-full py-3 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5">
                {currentSection === 'rq' && currentQ === sectionQuestions.length - 1 ? '🏁 Complete Journey' : 'Next Stop'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4">
          {sections.map((s) => {
            const sIdx = sections.indexOf(s);
            const curSIdx = sections.indexOf(currentSection);
            const isDone = sIdx < curSIdx;
            const isCur = s === currentSection;
            return (
              <div key={s} className={`flex-1 p-3 rounded-xl text-center text-xs border transition-all ${isCur ? 'bg-accent/10 border-accent/30' : isDone ? 'bg-green-500/5 border-green-400/20' : 'bg-muted/30 border-border/30'}`}>
                <p className={`font-black text-[10px] uppercase tracking-wide ${isCur ? 'text-accent' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>{sectionEmojis[s]} {s.toUpperCase()}</p>
                <p className={`font-bold mt-0.5 ${isCur ? 'text-accent' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isDone ? `${scores[s]}/${sectionQuestions.length}` : isCur ? `${scores[s]}/${currentQ + (showFeedback ? 1 : 0)}` : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RESULTS
  const overallPct = Math.round((totalCorrect / Math.max(1, totalQs)) * 100);
  const resultGrade = overallPct >= 80 ? { label: 'Destination Reached!', emoji: '🏆', color: 'text-green-600' }
    : overallPct >= 60 ? { label: 'Almost There!', emoji: '🚄', color: 'text-accent' }
    : overallPct >= 40 ? { label: 'Keep Going!', emoji: '🚃', color: 'text-amber-600' }
    : { label: 'Try Again!', emoji: '🔄', color: 'text-red-600' };
  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-5">
      <div className="relative rounded-2xl border border-border/50 bg-card/60 p-6 text-center overflow-hidden">
        <TrackBackground />
        <div className="relative z-10">
          <p className="text-4xl mb-3">{resultGrade.emoji}</p>
          <h1 className={`text-2xl font-black mb-1 ${resultGrade.color}`}>{resultGrade.label}</h1>
          <p className="text-sm text-muted-foreground mb-5">{selectedQuiz} · {selectedDifficulty.toUpperCase()}</p>
          <div className="inline-flex items-center gap-4 bg-background/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-border/40">
            <div><p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Score</p><p className={`text-4xl font-black ${resultGrade.color}`}>{totalCorrect}<span className="text-xl text-muted-foreground">/{totalQs}</span></p></div>
            <div className="w-px h-10 bg-border" />
            <div><p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Accuracy</p><p className={`text-4xl font-black ${resultGrade.color}`}>{overallPct}%</p></div>
          </div>
          <p className="text-xs text-accent mt-4 flex items-center justify-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Rank boosted by {selectedDifficulty === 'hard' ? 25 : selectedDifficulty === 'medium' ? 15 : 10} positions!</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'IQ', score: gScore, emoji: '🧠' }, { label: 'EQ', score: aScore, emoji: '💡' }, { label: 'RQ', score: mScore, emoji: '📚' }].map(g => (
          <div key={g.label} className="bg-card/60 rounded-2xl border border-border/50 p-4 text-center">
            <p className="text-lg mb-1">{g.emoji}</p>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">{g.label}</p>
            <div className="w-12 h-12 mx-auto relative mb-2">
              <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${g.score * 1.13} 113`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black">{g.score}%</span></div>
            </div>
            <p className={`text-xs font-bold ${g.score >= 70 ? 'text-green-600' : g.score >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{g.score >= 70 ? 'Strong' : g.score >= 40 ? 'Average' : 'Weak'}</p>
          </div>
        ))}
      </div>
      <div className="bg-card/60 rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-accent" /><h3 className="text-sm font-bold">GMA Performance Radar</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} />
            <Radar name="Score" dataKey="A" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => startPlaying(selectedTopic)} className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-muted text-sm font-bold hover:bg-muted/80 transition-all hover:-translate-y-0.5"><Timer className="w-4 h-4" /> Retry Journey</button>
        <button onClick={() => setPhase('select')} className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-md"><Award className="w-4 h-4" /> New Platform <ArrowRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
