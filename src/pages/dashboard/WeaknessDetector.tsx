import { useState, useMemo } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingDown, Lightbulb, Brain, Target, Loader2, Sparkles, BookOpen, ArrowRight, Zap, Clock, CheckCircle } from 'lucide-react';
import VisualRoadmap, { type RoadmapMilestone } from '@/components/roadmap/VisualRoadmap';

export default function WeaknessDetector() {
  const { domain, user, language } = useStationStore();
  const { getWeakAreas, getRecommendations, topicPerformance, quizHistory } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';
  const [planLoading, setPlanLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'weakness' | 'recommend'>('weakness');
  const [generatedMilestones, setGeneratedMilestones] = useState<RoadmapMilestone[] | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(new Set(['diag-milestone-0']));

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

  const generatePlan = () => {
    setPlanLoading(true);
    setTimeout(() => {
      const targetCompany = user?.dreamCompany || config.companies[0] || 'Target Recruiter';
      const weakTopicNames = weakAreas.filter(w => w.severity !== 'low').map(w => w.topic);
      const fallbackTopics = config.weeklyTopics.slice(0, 3);
      const primaryWeak = weakTopicNames[0] || fallbackTopics[0] || 'Core Domain Principles';
      const secondaryWeak = weakTopicNames[1] || fallbackTopics[1] || 'Applied Problem Solving';

      const milestones: RoadmapMilestone[] = [
        {
          id: 'diag-milestone-0',
          stepNumber: 1,
          stationName: 'Station 1: BASELINE DIAGNOSTIC',
          title: 'Diagnostic Baseline & Gap Detection',
          category: 'Foundation',
          estimatedHours: '2 hours',
          description: 'Identify primary conceptual misconceptions and benchmark initial domain competency.',
          prerequisites: ['Diagnostic Assessment'],
          tasks: [
            { id: 't0-1', text: 'Complete diagnostic quiz on STATION', completed: true },
            { id: 't0-2', text: 'Review missed question explanations', completed: true },
          ],
          resources: [
            { title: 'Diagnostic Analysis Guide', type: 'article' },
          ],
          keyTopics: [
            { name: 'Baseline Score', status: 'mastered' },
            { name: 'Gap Detection', status: 'mastered' },
          ],
        },
        {
          id: 'diag-milestone-1',
          stepNumber: 2,
          stationName: `Station 2: RECONSTRUCT ${primaryWeak.toUpperCase()}`,
          title: `Remediate Primary Weakness: ${primaryWeak}`,
          category: 'Core Skills',
          estimatedHours: '5 hours',
          description: `Deep conceptual rebuild for ${primaryWeak}. Focus on invariants, edge cases, and misconception elimination.`,
          prerequisites: ['Baseline Diagnostic'],
          tasks: [
            { id: 't1-1', text: `Study ${primaryWeak} primary authoritative documentation`, completed: false },
            { id: 't1-2', text: `Solve 5 fundamental drill problems on ${primaryWeak}`, completed: false },
            { id: 't1-3', text: 'Score ≥ 75% on verification checkpoint quiz', completed: false },
          ],
          resources: [
            { title: `${primaryWeak} Authoritative Guide`, type: 'article' },
            { title: `${primaryWeak} Concept Lecture`, type: 'video' },
          ],
          keyTopics: [
            { name: primaryWeak, status: 'weak' },
            { name: 'Boundary Conditions', status: 'pending' },
          ],
        },
        {
          id: 'diag-milestone-2',
          stepNumber: 3,
          stationName: `Station 3: PRACTICE ${secondaryWeak.toUpperCase()}`,
          title: `Reinforce Secondary Gap: ${secondaryWeak}`,
          category: 'Core Skills',
          estimatedHours: '6 hours',
          description: `Targeted timed problem solving for ${secondaryWeak} to build retrieval speed under exam pressure.`,
          prerequisites: [`Remediate ${primaryWeak}`],
          tasks: [
            { id: 't2-1', text: `Review ${secondaryWeak} common patterns & traps`, completed: false },
            { id: 't2-2', text: 'Complete 25 timed practice problems', completed: false },
          ],
          resources: [
            { title: `${secondaryWeak} Problem Set`, type: 'article' },
          ],
          keyTopics: [
            { name: secondaryWeak, status: 'weak' },
            { name: 'Timed Speed', status: 'pending' },
          ],
        },
        {
          id: 'diag-milestone-3',
          stepNumber: 4,
          stationName: `Station 4: ${targetCompany.toUpperCase()} SIMULATION`,
          title: `${targetCompany} Screening Round Preparation`,
          category: 'Interview Prep',
          estimatedHours: '4 hours',
          description: `Align problem-solving patterns with verified ${targetCompany} online assessment questions.`,
          prerequisites: ['Core Skills Rebuilt'],
          tasks: [
            { id: 't3-1', text: `Review ${targetCompany} round-by-round hiring requirements`, completed: false },
            { id: 't3-2', text: `Take full-length ${targetCompany} practice test on STATION`, completed: false },
          ],
          resources: [
            { title: `${targetCompany} Interview Prep Guide`, type: 'article' },
          ],
          keyTopics: [
            { name: `${targetCompany} Patterns`, status: 'pending' },
            { name: 'Online Assessment', status: 'pending' },
          ],
        },
        {
          id: 'diag-milestone-4',
          stepNumber: 5,
          stationName: 'Station 5: INTERVIEW READY',
          title: 'Live AI Video Mock Interview Clearance',
          category: 'Final Clearance',
          estimatedHours: '3 hours',
          description: 'Simulate live company interview with real-time video, speech clarity, and STAR articulation checks.',
          prerequisites: [`${targetCompany} Screening Checkpoint`],
          tasks: [
            { id: 't4-1', text: 'Rehearse 1 full AI Video Mock Interview Session', completed: false },
            { id: 't4-2', text: 'Achieve ≥ 75% overall communication and technical score', completed: false },
          ],
          resources: [
            { title: 'STAR Behavioral Framework', type: 'article' },
          ],
          keyTopics: [
            { name: 'Technical Articulation', status: 'pending' },
            { name: 'Placement Clearance', status: 'pending' },
          ],
        },
      ];

      setGeneratedMilestones(milestones);
      setPlanLoading(false);
    }, 600);
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

      {/* Visual Targeted Roadmap Plan */}
      {hasData && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {isHi ? 'डायग्नोस्टिक सुधार रोडमैप' : 'Diagnostic Recovery Roadmap'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHi
                  ? 'आपके वास्तविक क्विज़ प्रदर्शन पर आधारित दृश्य मील का पत्थर रोडमैप'
                  : 'Highly visual progression roadmap targeting your exact assessed weaknesses and target company.'}
              </p>
            </div>
            <button
              onClick={generatePlan}
              disabled={planLoading}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover-scale disabled:opacity-40 flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm"
            >
              {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isHi ? 'रोडमैप बनाएं' : 'Generate Visual Roadmap'}
            </button>
          </div>

          {planLoading && (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Analyzing your diagnostic performance and structuring optimal milestone sequence...
              </p>
            </div>
          )}

          {generatedMilestones && !planLoading && (
            <div className="space-y-4 pt-2">
              <VisualRoadmap
                milestones={generatedMilestones}
                completedMilestoneIds={completedMilestones}
                onToggleMilestone={(id) => {
                  setCompletedMilestones((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                targetRole={user?.targetRole || 'Software Engineer'}
                targetCompany={user?.dreamCompany || config.companies[0]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
