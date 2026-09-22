import { useState } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { Building, ChevronRight, Loader2, Play, Sparkles, BookOpen, Target, Users, DollarSign, MapPin, ClipboardList, CheckCircle, XCircle, Lightbulb, BarChart3, ArrowRight } from 'lucide-react';
import { streamChat } from '@/lib/ai';

export default function CompanyPrep() {
  const { domain, user, language } = useStationStore();
  const { saveCompanyTest } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [selectedCompany, setSelectedCompany] = useState('');
  const [aiQuestions, setAiQuestions] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState<{ q: string; opts: string[]; correct: number; explanation: string }[]>([]);
  const [testIdx, setTestIdx] = useState(0);
  const [testAnswer, setTestAnswer] = useState<number | null>(null);
  const [testScore, setTestScore] = useState(0);
  const [testDone, setTestDone] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testOverview, setTestOverview] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [wrongTopics, setWrongTopics] = useState<string[]>([]);

  const companyData = config.companyData as Record<string, any>;
  const companies = config.companies;
  const info = selectedCompany ? companyData[selectedCompany] : null;

  const generateQuestions = async () => {
    if (!selectedCompany) return;
    setQuestionsLoading(true);
    setAiQuestions('');
    let text = '';
    await streamChat({
      messages: [{ role: 'user', content: `Generate 10 frequently asked interview questions for ${selectedCompany} in ${config.label} domain. Include both HR and technical questions. For each question, give a brief tip on how to answer it. Format clearly with numbering.` }],
      mode: 'interview-prep',
      context: { domain, company: selectedCompany },
      onDelta: (d) => { text += d; setAiQuestions(text); },
      onDone: () => setQuestionsLoading(false),
      onError: () => { setAiQuestions(isHi ? 'प्रश्न लोड नहीं हो सके।' : 'Could not load questions.'); setQuestionsLoading(false); },
    });
  };

  const startCompanyTest = async () => {
    if (!selectedCompany) return;
    setTestLoading(true);
    setTestMode(true);
    setTestIdx(0);
    setTestAnswer(null);
    setTestScore(0);
    setTestDone(false);
    setShowExplanation(false);
    setTestOverview('');
    setWrongTopics([]);

    let text = '';
    await streamChat({
      messages: [{ role: 'user', content: `Create exactly 5 MCQ questions for ${selectedCompany} interview prep in ${config.label} domain. Format EXACTLY as:
Q1: [question]
TOPIC: [topic area]
A) [option]
B) [option]
C) [option]
D) [option]
ANSWER: [A/B/C/D]
EXPLANATION: [brief explanation why this is correct]

Repeat for Q2-Q5. Mix HR and technical questions relevant to ${selectedCompany}.` }],
      mode: 'interview-prep',
      context: { domain, company: selectedCompany },
      onDelta: (d) => { text += d; },
      onDone: () => {
        const parsed: { q: string; opts: string[]; correct: number; explanation: string; topic?: string }[] = [];
        const blocks = text.split(/Q\d+:\s*/i).filter(Boolean);
        blocks.forEach(block => {
          const lines = block.trim().split('\n').filter(Boolean);
          const q = lines[0]?.trim();
          const opts: string[] = [];
          let correct = 0;
          let explanation = '';
          let topic = '';
          lines.forEach(line => {
            const optMatch = line.match(/^([A-D])\)\s*(.+)/i);
            if (optMatch) opts.push(optMatch[2].trim());
            const ansMatch = line.match(/ANSWER:\s*([A-D])/i);
            if (ansMatch) correct = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
            const expMatch = line.match(/EXPLANATION:\s*(.+)/i);
            if (expMatch) explanation = expMatch[1].trim();
            const topicMatch = line.match(/TOPIC:\s*(.+)/i);
            if (topicMatch) topic = topicMatch[1].trim();
          });
          if (q && opts.length === 4) parsed.push({ q, opts, correct, explanation: explanation || 'Practice more on this topic.', topic });
        });
        setTestQuestions(parsed.length > 0 ? parsed : [
          { q: `What is ${selectedCompany}'s core business?`, opts: ['Technology', 'Finance', 'Healthcare', 'Education'], correct: 0, explanation: 'Research the company before interviews.' },
        ]);
        setTestLoading(false);
      },
      onError: () => { setTestLoading(false); setTestMode(false); },
    });
  };

  const handleTestAnswer = (idx: number) => {
    setTestAnswer(idx);
    setShowExplanation(true);
    const isCorrect = idx === testQuestions[testIdx]?.correct;
    if (isCorrect) {
      setTestScore(s => s + 1);
    } else {
      const topicName = (testQuestions[testIdx] as any)?.topic || 'General';
      setWrongTopics(prev => [...prev, topicName]);
    }
  };

  const nextTestQuestion = () => {
    setShowExplanation(false);
    if (testIdx < testQuestions.length - 1) {
      setTestIdx(i => i + 1);
      setTestAnswer(null);
    } else {
      setTestDone(true);
      // Save to performance store
      saveCompanyTest({
        company: selectedCompany,
        score: testScore + (testAnswer === testQuestions[testIdx]?.correct ? 0 : 0), // already counted
        total: testQuestions.length,
        feedback: wrongTopics,
      });
      // Generate overview
      generateOverview();
    }
  };

  const generateOverview = async () => {
    setOverviewLoading(true);
    const finalScore = testScore;
    const weakAreas = wrongTopics.length > 0 ? wrongTopics.join(', ') : 'none';
    let text = '';
    await streamChat({
      messages: [{ role: 'user', content: `Student scored ${finalScore}/${testQuestions.length} on ${selectedCompany} company test. Wrong topic areas: ${weakAreas}. Give a brief overview (4-5 lines): 1) Where they stand, 2) What to focus on, 3) Adjusted preparation plan for ${selectedCompany}. Be specific and practical.` }],
      mode: 'interview-prep',
      context: { domain },
      onDelta: (d) => { text += d; setTestOverview(text); },
      onDone: () => setOverviewLoading(false),
      onError: () => { setTestOverview(isHi ? 'ओवरव्यू जनरेट नहीं हो सका।' : 'Could not generate overview.'); setOverviewLoading(false); },
    });
  };

  return (
    <div className="max-w-5xl space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Building className="w-5 h-5 text-accent" />
        {isHi ? 'कंपनी-विशिष्ट तैयारी' : 'Company-Specific Preparation'}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {companies.map(c => (
          <button key={c} onClick={() => { setSelectedCompany(c); setAiQuestions(''); setTestMode(false); setTestOverview(''); }}
            className={`p-4 rounded-xl border text-left transition-all hover-scale ${
              selectedCompany === c ? 'border-accent bg-accent/10 ring-2 ring-accent/30' : 'border-border bg-card hover:border-accent/50'
            }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">{c}</p>
                <p className="text-[10px] text-muted-foreground">{companyData[c]?.process?.split('→')[0]?.trim() || config.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {info && selectedCompany && (
        <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-accent" /> {selectedCompany}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { icon: Users, label: isHi ? 'सीटें' : 'Seats', value: info.seats?.toLocaleString() },
              { icon: DollarSign, label: isHi ? 'वेतन' : 'Salary', value: info.avgSalary },
              { icon: MapPin, label: isHi ? 'शहर' : 'Cities', value: info.cities?.slice(0, 2).join(', ') },
              { icon: ClipboardList, label: isHi ? 'योग्यता' : 'Eligibility', value: info.eligibility?.slice(0, 25) },
            ].map(d => (
              <div key={d.label} className="bg-muted/30 rounded-xl p-3">
                <d.icon className="w-4 h-4 text-accent mb-1" />
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="text-sm font-semibold">{d.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold mb-2">{isHi ? 'इंटरव्यू प्रक्रिया' : 'Interview Process'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {info.process?.split('→').map((step: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold">{step.trim()}</span>
                  {i < info.process.split('→').length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={generateQuestions} disabled={questionsLoading}
              className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover-scale disabled:opacity-40">
              {questionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQ Questions'}
            </button>
            <button onClick={startCompanyTest} disabled={testLoading}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover-scale disabled:opacity-40">
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isHi ? 'कंपनी टेस्ट' : 'Company Test'}
            </button>
          </div>

          {aiQuestions && (
            <div className="mt-4 p-4 rounded-xl bg-muted/30 text-sm whitespace-pre-wrap animate-fade-in">
              {aiQuestions}
            </div>
          )}

          {/* Company Test with Explanations */}
          {testMode && !testLoading && testQuestions.length > 0 && (
            <div className="mt-4 bg-muted/30 rounded-xl p-5 animate-fade-in">
              {!testDone ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">Q{testIdx + 1}/{testQuestions.length}</p>
                    <div className="h-1.5 flex-1 mx-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${((testIdx) / testQuestions.length) * 100}%` }} />
                    </div>
                    <p className="text-xs font-bold text-accent">{testScore}/{testIdx + (testAnswer !== null ? 1 : 0)}</p>
                  </div>
                  <p className="text-sm font-semibold mb-3">{testQuestions[testIdx].q}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {testQuestions[testIdx].opts.map((opt, i) => (
                      <button key={i} onClick={() => testAnswer === null && handleTestAnswer(i)}
                        disabled={testAnswer !== null}
                        className={`p-3 rounded-xl text-sm text-left border transition-all ${
                          testAnswer === null ? 'border-border hover:border-accent' :
                          i === testQuestions[testIdx].correct ? 'border-green-500 bg-green-500/10' :
                          i === testAnswer ? 'border-destructive bg-destructive/10' : 'border-border opacity-50'
                        }`}>
                        <span className="flex items-center gap-2">
                          {String.fromCharCode(65 + i)}) {opt}
                          {testAnswer !== null && i === testQuestions[testIdx].correct && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                          {testAnswer !== null && i === testAnswer && i !== testQuestions[testIdx].correct && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Explanation */}
                  {showExplanation && (
                    <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/20 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{testQuestions[testIdx].explanation}</p>
                      </div>
                      <button onClick={nextTestQuestion}
                        className="mt-2 w-full py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center gap-1">
                        {testIdx < testQuestions.length - 1 ? (isHi ? 'अगला प्रश्न' : 'Next Question') : (isHi ? 'परिणाम देखें' : 'See Results')}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-accent">{testScore}/{testQuestions.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {testScore >= 4 ? '🎉 Excellent!' : testScore >= 2 ? '📈 Good effort!' : '💪 Keep practicing!'}
                    </p>
                  </div>

                  {/* Overview */}
                  {wrongTopics.length > 0 && (
                    <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                      <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {isHi ? 'सुधार की ज़रूरत' : 'Areas to Improve'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(wrongTopics)].map(t => (
                          <span key={t} className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(testOverview || overviewLoading) && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <h4 className="text-xs font-semibold text-accent mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {isHi ? 'AI ओवरव्यू' : 'AI Overview & Adjusted Plan'}
                      </h4>
                      {overviewLoading && !testOverview && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" /> {isHi ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{testOverview}</p>
                    </div>
                  )}

                  <button onClick={() => { setTestMode(false); setTestOverview(''); }}
                    className="w-full py-2 rounded-xl bg-muted text-foreground text-xs hover:bg-muted/80">
                    {isHi ? 'बंद करें' : 'Close'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
