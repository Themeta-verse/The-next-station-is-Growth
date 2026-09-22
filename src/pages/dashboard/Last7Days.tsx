import { useState, useMemo } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { Calendar, CheckCircle, Circle, Sparkles, Loader2, Clock, Target, Flame, BookOpen, ExternalLink, Play, ChevronDown, ChevronUp, Zap, ArrowRight } from 'lucide-react';
import { streamChat } from '@/lib/ai';

interface DayPlan {
  day: number;
  title: string;
  tasks: { text: string; time: string; done: boolean }[];
  completed: boolean;
  resources: { type: 'video' | 'pdf'; title: string; url?: string }[];
}

export default function Last7Days() {
  const { domain, user, language } = useStationStore();
  const { getWeakAreas } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';
  const weakAreas = getWeakAreas();
  const weakTopicNames = weakAreas.filter(w => w.severity !== 'low').map(w => w.topic);

  const resources = config.weeklyResources as Record<string, { videos: string[]; pdfs: string[] }>;

  const defaultPlan = useMemo((): DayPlan[] => {
    const topics = config.weeklyTopics;
    return topics.map((topic, i) => {
      const res = resources[topic] || { videos: [], pdfs: [] };
      const isWeak = weakTopicNames.some(w => topic.toLowerCase().includes(w.toLowerCase()));
      return {
        day: i + 1,
        title: topic,
        tasks: [
          { text: `${isHi ? 'मूल बातें सीखें' : 'Learn fundamentals'}: ${topic}`, time: '45 min', done: false },
          { text: isWeak ? (isHi ? '15 अभ्यास प्रश्न हल करें' : 'Solve 15 practice problems') : (isHi ? '8 अभ्यास प्रश्न हल करें' : 'Solve 8 practice problems'), time: '60 min', done: false },
          { text: isHi ? 'नोट्स बनाएं और रिवीज़ करें' : 'Create notes & quick revision', time: '30 min', done: false },
        ],
        completed: false,
        resources: [
          ...res.videos.map(v => ({ type: 'video' as const, title: `${topic} Video`, url: v })),
          ...res.pdfs.map(p => ({ type: 'pdf' as const, title: p })),
        ],
      };
    });
  }, [domain, isHi, config.weeklyTopics, resources, weakTopicNames]);

  const [plan, setPlan] = useState<DayPlan[]>(defaultPlan);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [aiCustomPlan, setAiCustomPlan] = useState('');
  const [customizing, setCustomizing] = useState(false);

  const completedDays = plan.filter(d => d.completed).length;
  const totalTasks = plan.reduce((s, d) => s + d.tasks.length, 0);
  const completedTasks = plan.reduce((s, d) => s + d.tasks.filter(t => t.done).length, 0);
  const progress = Math.round((completedTasks / Math.max(1, totalTasks)) * 100);

  const toggleTask = (dayIdx: number, taskIdx: number) => {
    setPlan(prev => prev.map((d, di) => {
      if (di !== dayIdx) return d;
      const newTasks = d.tasks.map((t, ti) => ti === taskIdx ? { ...t, done: !t.done } : t);
      const allDone = newTasks.every(t => t.done);
      return { ...d, tasks: newTasks, completed: allDone };
    }));
  };

  const toggleDay = (dayIdx: number) => {
    setPlan(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      const newCompleted = !d.completed;
      return { ...d, completed: newCompleted, tasks: d.tasks.map(t => ({ ...t, done: newCompleted })) };
    }));
  };

  const customizePlan = async () => {
    setCustomizing(true);
    setAiCustomPlan('');
    const weakInfo = weakAreas.filter(w => w.severity !== 'low').map(w => `${w.topic} (${w.accuracy}% accuracy)`).join(', ') || 'general topics';
    let text = '';
    await streamChat({
      messages: [{ role: 'user', content: `Create a personalized 7-day crash plan for a ${config.label} student preparing for ${user?.dreamCompany || config.companies[0]}. Their weak areas (from quiz data): ${weakInfo}. Strong areas: ${weakAreas.filter(w => w.severity === 'low').map(w => w.topic).join(', ') || 'none yet'}.

Format as an INTERACTIVE ROADMAP:
🗓️ Day 1: [Title] — [Focus Area]
⏰ Morning (2h): [specific task]
⏰ Afternoon (2h): [specific task]  
⏰ Evening (1h): [revision/practice]
📚 Resources: [specific YouTube/website]
✅ Milestone: [what they should be able to do]

Make it SPECIFIC to their weak areas. Prioritize weakest topics first. Include time estimates and specific resource links where possible. End with a motivational note.` }],
      mode: 'interview-prep',
      context: { domain },
      onDelta: (d) => { text += d; setAiCustomPlan(text); },
      onDone: () => setCustomizing(false),
      onError: () => { setAiCustomPlan(isHi ? 'योजना बनाने में त्रुटि।' : 'Error creating plan.'); setCustomizing(false); },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              {isHi ? 'अंतिम 7 दिन की तैयारी' : 'Last 7 Days Prep Mode'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isHi ? 'इंटरव्यू से पहले का क्रैश प्लान' : 'Crash plan before your interview'}
              {weakTopicNames.length > 0 && (
                <span className="text-accent ml-1">
                  · {isHi ? 'कमज़ोर विषयों पर ज़ोर' : 'Focus on weak areas'}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent">{completedDays}/7</p>
            <p className="text-[10px] text-muted-foreground">{isHi ? 'दिन पूरे' : 'Days Done'}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{progress}% · {completedTasks}/{totalTasks} tasks</span>
          <span className="text-[10px] text-muted-foreground">{7 - completedDays} {isHi ? 'शेष' : 'remaining'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: isHi ? 'समय/दिन' : 'Time/Day', value: '2-3h' },
          { icon: Target, label: isHi ? 'लक्ष्य' : 'Target', value: user?.dreamCompany || config.companies[0] },
          { icon: Flame, label: isHi ? 'तीव्रता' : 'Intensity', value: completedDays >= 5 ? '🔥 Max' : completedDays >= 3 ? '⚡ High' : '💪 Building' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1 text-accent" />
            <p className="text-sm font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Interactive Timeline */}
      <div className="space-y-3">
        {plan.map((day, i) => {
          const isExpanded = expandedDay === i;
          const isWeak = weakTopicNames.some(w => day.title.toLowerCase().includes(w.toLowerCase()));
          return (
            <div key={i} className={`bg-card rounded-2xl border transition-all ${
              day.completed ? 'border-accent/30 bg-accent/5' : isWeak ? 'border-destructive/30' : 'border-border'
            }`} style={{ animationDelay: `${i * 60}ms` }}>
              {/* Day header */}
              <button onClick={() => setExpandedDay(isExpanded ? null : i)}
                className="w-full flex items-center gap-4 p-4">
                <button onClick={(e) => { e.stopPropagation(); toggleDay(i); }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    day.completed ? 'bg-accent border-accent text-accent-foreground' : 'border-border hover:border-accent'
                  }`}>
                  {day.completed ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{day.day}</span>}
                </button>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${day.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {isHi ? `दिन ${day.day}` : `Day ${day.day}`} — {day.title}
                    </h3>
                    {isWeak && !day.completed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">WEAK</span>
                    )}
                    {day.completed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">✓</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{day.tasks.filter(t => t.done).length}/{day.tasks.length} tasks · {day.tasks.reduce((s, t) => s + parseInt(t.time), 0)} min total</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in">
                  {/* Tasks */}
                  <div className="space-y-2">
                    {day.tasks.map((task, j) => (
                      <button key={j} onClick={() => toggleTask(i, j)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all ${
                          task.done ? 'bg-accent/5 border-accent/20 line-through text-muted-foreground' : 'border-border hover:border-accent/50'
                        }`}>
                        {task.done ? <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <span className="flex-1">{task.text}</span>
                        <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {task.time}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Resources */}
                  {day.resources.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {isHi ? 'अध्ययन सामग्री' : 'Study Material'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {day.resources.map((r, ri) => (
                          <a key={ri} href={r.url || '#'} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105 ${
                              r.type === 'video' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                            }`}>
                            {r.type === 'video' ? <Play className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                            {r.title}
                            {r.url && <ExternalLink className="w-2.5 h-2.5" />}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Custom Plan */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            {isHi ? 'AI कस्टम रोडमैप' : 'AI Custom Roadmap'}
          </h3>
          <button onClick={customizePlan} disabled={customizing}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover-scale disabled:opacity-40 flex items-center gap-2">
            {customizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isHi ? 'मेरे लिए बनाएं' : 'Build My Roadmap'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          {isHi ? 'आपके क्विज़ डेटा और कमज़ोर विषयों के आधार पर पर्सनलाइज़्ड प्लान' : 'Personalized plan based on your quiz performance and weak areas'}
        </p>
        {aiCustomPlan && (
          <div className="p-4 rounded-xl bg-muted/30 text-sm whitespace-pre-wrap animate-fade-in leading-relaxed">
            {aiCustomPlan}
          </div>
        )}
      </div>
    </div>
  );
}
