import { useState, useMemo } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingDown, Lightbulb, Brain, Target, Loader2, Sparkles, BookOpen, ArrowRight, Zap, Clock, CheckCircle } from 'lucide-react';
import { streamChat } from '@/lib/ai';

export default function WeaknessDetector() {
  const { domain, user, language } = useStationStore();
  const { getWeakAreas, getRecommendations, topicPerformance, quizHistory } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';
  const [aiPlan, setAiPlan] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'weakness' | 'recommend'>('weakness');

  // Real student data from performance store
  const weakAreas = useMemo(() => {
    const realAreas = getWeakAreas();
    if (realAreas.length > 0) return realAreas;
    // If no quiz data yet, show prompt
    return [];
  }, [getWeakAreas]);

  const recommendations = useMemo(() => getRecommendations(), [getRecommendations]);
  const hasData = Object.keys(topicPerformance).length > 0;

  const highWeak = weakAreas.filter(w => w.severity === 'high');
  const medWeak = weakAreas.filter(w => w.severity === 'medium');
  const strongAreas = weakAreas.filter(w => w.severity === 'low');

  const chartData = weakAreas.map(w => ({
    name: w.topic.length > 12 ? w.topic.slice(0, 12) + '..' : w.topic,
    accuracy: w.accuracy,
    time: w.avgTime,
  }));

  const radarData = weakAreas.map(w => ({
    subject: w.topic.length > 8 ? w.topic.slice(0, 8) + '..' : w.topic,
    score: w.accuracy,
    fullMark: 100,
  }));

  const levelColor = (l: string) => l === 'high' ? 'text-destructive' : l === 'medium' ? 'text-accent' : 'text-green-600';
  const levelBg = (l: string) => l === 'high' ? 'bg-destructive/10' : l === 'medium' ? 'bg-accent/10' : 'bg-green-500/10';
  const barColor = (accuracy: number) => accuracy < 40 ? 'hsl(0, 65%, 51%)' : accuracy < 70 ? 'hsl(var(--accent))' : 'hsl(140, 45%, 40%)';

  const generatePlan = async () => {
    setPlanLoading(true);
    setAiPlan('');
    const weakTopics = weakAreas.filter(w => w.severity !== 'low').map(w => `${w.topic} (${w.severity} weakness, ${w.accuracy}% accuracy, avg ${w.avgTime}s/question)`).join(', ');
    let text = '';
    await streamChat({
      messages: [{ role: 'user', content: `I'm a ${config.label} student. My weak areas based on actual quiz performance: ${weakTopics || 'no data yet'}. Target: ${user?.dreamCompany || config.companies[0]}. Create a 2-week roadmap with daily milestones. Format as a clear step-by-step roadmap with Week 1 and Week 2 breakdown. Include specific resources and practice targets. Make it actionable and visual with clear progress markers.` }],
      mode: 'interview-prep',
      context: { domain },
      onDelta: (d) => { text += d; setAiPlan(text); },
      onDone: () => setPlanLoading(false),
      onError: () => { setAiPlan(isHi ? 'योजना जनरेट नहीं हो सकी।' : 'Could not generate plan. Try again later.'); setPlanLoading(false); },
    });
  };

  return (
    <div className="max-w-5xl space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          {isHi ? 'स्मार्ट कमज़ोरी डिटेक्टर' : 'Smart Weakness Detector'}
        </h1>
        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setActiveTab('weakness')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'weakness' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {isHi ? 'कमज़ोरी' : 'Weakness'}
          </button>
          <button onClick={() => setActiveTab('recommend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'recommend' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {isHi ? 'सुझाव' : 'Recommended'}
          </button>
        </div>
      </div>

      {!hasData && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-8 text-center">
          <Brain className="w-10 h-10 text-accent mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold mb-2">{isHi ? 'कोई डेटा नहीं' : 'No Quiz Data Yet'}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isHi ? 'पहले कुछ क्विज़ दें, फिर यहाँ आपकी कमज़ोरियाँ और सुझाव दिखेंगे — सब कुछ आपके असली प्रदर्शन के आधार पर।'
              : 'Take some quizzes first! Your weakness analysis and recommendations will appear here based on your actual performance — no dummy data.'}
          </p>
        </div>
      )}

      {hasData && activeTab === 'weakness' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{highWeak.length}</p>
              <p className="text-[10px] text-muted-foreground">{isHi ? 'गंभीर कमज़ोरी' : 'High Weakness'}</p>
            </div>
            <div className="bg-accent/10 rounded-xl border border-accent/20 p-4 text-center">
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-2xl font-bold text-accent">{medWeak.length}</p>
              <p className="text-[10px] text-muted-foreground">{isHi ? 'मध्यम कमज़ोरी' : 'Medium Weakness'}</p>
            </div>
            <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{strongAreas.length}</p>
              <p className="text-[10px] text-muted-foreground">{isHi ? 'मजबूत क्षेत्र' : 'Strong Areas'}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">{isHi ? 'विषय-वार सटीकता' : 'Topic-wise Accuracy'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">{isHi ? 'प्रदर्शन रडार' : 'Performance Radar'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak Areas List */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">{isHi ? 'आपके कमज़ोर क्षेत्र' : 'Your Weak Areas'}</h3>
            <div className="space-y-2">
              {weakAreas.map((w, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${levelBg(w.severity)} transition-all`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${levelBg(w.severity)} ${levelColor(w.severity)}`}>
                      {w.severity}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{w.topic}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{isHi ? 'सटीकता' : 'Accuracy'}: {w.accuracy}%</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {w.avgTime}s</span>
                        <span>·</span>
                        <span>{w.attempts} {isHi ? 'प्रयास' : 'attempts'}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] text-right">
                    <Lightbulb className="w-3 h-3 flex-shrink-0" /> {w.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {hasData && activeTab === 'recommend' && (
        <>
          {/* Personalized Recommendations */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              {isHi ? 'आपके लिए सुझाव' : 'Recommended For You'}
            </h3>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isHi ? 'अभी कोई सुझाव नहीं' : 'No recommendations yet — take more quizzes!'}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                    rec.action === 'Learn' ? 'border-destructive/30 bg-destructive/5' :
                    rec.action === 'Practice' ? 'border-accent/30 bg-accent/5' :
                    'border-green-500/30 bg-green-500/5'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{rec.topic}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        rec.action === 'Learn' ? 'bg-destructive/10 text-destructive' :
                        rec.action === 'Practice' ? 'bg-accent/10 text-accent' :
                        'bg-green-500/10 text-green-600'
                      }`}>{rec.action}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-accent font-medium">
                      <ArrowRight className="w-3 h-3" />
                      {rec.action === 'Learn' ? (isHi ? 'मूल बातें सीखें' : 'Start with fundamentals') :
                       rec.action === 'Practice' ? (isHi ? 'अभ्यास शुरू करें' : 'Start practice problems') :
                       (isHi ? 'रिवीज़न करें' : 'Quick revision')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Sequence */}
          {recommendations.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                {isHi ? 'सुझावित क्रम' : 'Suggested Study Sequence'}
              </h3>
              <div className="flex items-center flex-wrap gap-2">
                {recommendations.slice(0, 5).map((rec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      rec.action === 'Learn' ? 'bg-destructive/10 text-destructive' :
                      rec.action === 'Practice' ? 'bg-accent/10 text-accent' :
                      'bg-green-500/10 text-green-600'
                    }`}>{rec.topic}</span>
                    {i < Math.min(4, recommendations.length - 1) && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {isHi ? 'सबसे कमज़ोर से मजबूत की ओर — पहले मूल बातें सीखें, फिर अभ्यास करें' : 'Weakest to strongest — learn fundamentals first, then practice'}
              </p>
            </div>
          )}
        </>
      )}

      {/* AI Roadmap Plan */}
      {hasData && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              {isHi ? 'AI सुधार रोडमैप' : 'AI Improvement Roadmap'}
            </h3>
            <button onClick={generatePlan} disabled={planLoading}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover-scale disabled:opacity-40 flex items-center gap-2">
              {planLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isHi ? 'रोडमैप बनाएं' : 'Generate Roadmap'}
            </button>
          </div>
          {aiPlan && (
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap bg-muted/30 rounded-xl p-4 leading-relaxed">
              {aiPlan}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
