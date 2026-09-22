import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { Mic, MicOff, Play, RotateCcw, CheckCircle, Loader2, ArrowLeft, Sparkles, Volume2, Pause, AlertTriangle, Clock, Zap, TrendingUp, Target, ChevronRight, BarChart3, X, ArrowRight } from 'lucide-react';
import { streamChat, type Msg } from '@/lib/ai';
import ReactMarkdown from 'react-markdown';

type Phase = 'setup' | 'script-ready' | 'practice' | 'analyzing' | 'results';
type SpeechType = 'self-intro' | 'elevator-pitch' | 'hr-answer' | 'project-explain';
type ToneType = 'confident' | 'conversational' | 'formal' | 'energetic';

interface LineResult {
  lineIdx: number;
  expected: string;
  spoken: string;
  accuracy: number;
  timeTaken: number; // ms
  fillerWords: number;
  midStops: number;
  pace: 'slow' | 'normal' | 'fast';
  feedback: string;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'right', 'hmm', 'ahh', 'err'];

function detectFillers(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const f of FILLER_WORDS) {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function wordSimilarity(a: string, b: string): number {
  const aWords = a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const bWords = b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (aWords.length === 0 || bWords.length === 0) return 0;
  let matches = 0;
  for (const w of aWords) {
    if (bWords.includes(w)) matches++;
  }
  return Math.round((matches / Math.max(aWords.length, bWords.length)) * 100);
}

function detectMidStops(text: string): number {
  // Detect unnatural pauses — sequences of "..." or multiple short fragments
  const fragments = text.split(/[.!?]+/).filter(f => f.trim().length > 0);
  let stops = 0;
  for (const f of fragments) {
    const words = f.trim().split(/\s+/);
    if (words.length <= 2 && words.length > 0) stops++;
  }
  return Math.max(0, stops - 1);
}

export default function SpeechPractice() {
  const { domain, user, language } = useStationStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [phase, setPhase] = useState<Phase>('setup');
  const [scriptLines, setScriptLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lineResults, setLineResults] = useState<LineResult[]>([]);
  const [fluencyScore, setFluencyScore] = useState(0);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [waveAmplitude, setWaveAmplitude] = useState<number[]>(Array(24).fill(0));

  // Form fields
  const [userName, setUserName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.dreamJob || user?.dreamCompany || '');
  const [company, setCompany] = useState(user?.dreamCompany || config.companies[0]);
  const [speechType, setSpeechType] = useState<SpeechType>('self-intro');
  const [tone, setTone] = useState<ToneType>('confident');
  const [customContext, setCustomContext] = useState('');

  // Timing
  const lineStartTime = useRef(Date.now());
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const waveInterval = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Wave animation
  useEffect(() => {
    if (isListening) {
      waveInterval.current = setInterval(() => {
        setWaveAmplitude(prev => prev.map(() => Math.random() * 0.7 + 0.3));
      }, 120);
    } else {
      if (waveInterval.current) clearInterval(waveInterval.current);
      setWaveAmplitude(Array(24).fill(0.08));
    }
    return () => { if (waveInterval.current) clearInterval(waveInterval.current); };
  }, [isListening]);

  const speechTypeLabels: Record<SpeechType, { en: string; hi: string; icon: string }> = {
    'self-intro': { en: 'Self Introduction', hi: 'आत्म परिचय', icon: '👋' },
    'elevator-pitch': { en: 'Elevator Pitch', hi: 'एलिवेटर पिच', icon: '🚀' },
    'hr-answer': { en: 'HR Question Answer', hi: 'HR प्रश्न उत्तर', icon: '💼' },
    'project-explain': { en: 'Project Explanation', hi: 'प्रोजेक्ट व्याख्या', icon: '🛠️' },
  };

  const toneLabels: Record<ToneType, { en: string; hi: string }> = {
    confident: { en: 'Confident & Bold', hi: 'आत्मविश्वासी' },
    conversational: { en: 'Conversational', hi: 'बातचीत जैसा' },
    formal: { en: 'Formal & Polished', hi: 'औपचारिक' },
    energetic: { en: 'Energetic & Dynamic', hi: 'ऊर्जावान' },
  };

  // Generate script via AI
  const generateScript = async () => {
    setIsGenerating(true);
    const typeLabel = speechTypeLabels[speechType].en;
    const toneLabel = toneLabels[tone].en;

    let promptContent = '';
    if (speechType === 'self-intro') {
      promptContent = `Generate a ${toneLabel.toLowerCase()} self-introduction script for an Indian ${config.label} student.
Name: ${userName || user?.name || 'Student'}
Target Role: ${role || 'Professional'}
Target Company: ${company}
Education: ${user?.specialization || config.label} from ${user?.college || 'my college'}`;
    } else if (speechType === 'elevator-pitch') {
      promptContent = `Generate a ${toneLabel.toLowerCase()} 30-second elevator pitch for:
Name: ${userName || user?.name || 'Student'}
Pitching to: ${company}
Role: ${role}
${customContext ? `Additional context: ${customContext}` : ''}`;
    } else if (speechType === 'hr-answer') {
      promptContent = `Generate a ${toneLabel.toLowerCase()} answer to the HR question "Tell me about yourself" for:
Name: ${userName || user?.name || 'Student'}
Applying for: ${role} at ${company}
Domain: ${config.label}
${customContext ? `Highlight: ${customContext}` : ''}`;
    } else {
      promptContent = `Generate a ${toneLabel.toLowerCase()} project explanation script for:
Name: ${userName || user?.name || 'Student'}
Project: ${customContext || 'a full-stack web application'}
Company: ${company}
Domain: ${config.label}`;
    }

    const prompt = `${promptContent}

IMPORTANT RULES:
- Return ONLY the speech script, one sentence per line
- Exactly 7-9 lines
- Make it sound NATURAL when spoken aloud — not written text
- Tone: ${toneLabel}
- No numbering, no bullet points, no quotation marks
- Each line should be 8-15 words — easy to read and speak
- Include natural pauses between ideas`;

    let fullText = '';
    await streamChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'self-intro-generate',
      context: { domain, userName: userName || user?.name || 'Student' },
      onDelta: (chunk) => { fullText += chunk; },
      onDone: () => {
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*'));
        setScriptLines(lines.length >= 3 ? lines.slice(0, 10) : getDefaultScript());
        setCurrentLine(0);
        setLineResults([]);
        setLiveTranscript('');
        setIsGenerating(false);
        setPhase('script-ready');
      },
      onError: () => {
        setScriptLines(getDefaultScript());
        setIsGenerating(false);
        setPhase('script-ready');
      },
    });
  };

  const getDefaultScript = (): string[] => {
    const name = userName || user?.name || 'Student';
    return [
      `Good morning, my name is ${name}.`,
      `I am a ${config.label} student with a passion for problem solving.`,
      `Currently pursuing ${user?.specialization || config.label} from ${user?.college || 'my college'}.`,
      `My goal is to join ${company} as a ${role || 'professional'}.`,
      `I have strong fundamentals and a growth mindset.`,
      `I believe in continuous learning and collaboration.`,
      `I am excited about this opportunity to contribute.`,
      `Thank you for your time and consideration.`,
    ];
  };

  // Text-to-Speech
  const speakLine = (lineIdx: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scriptLines[lineIdx]);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      utterance.lang = 'en-IN';
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsPlaying(false); };

  // Speech Recognition — line by line with detailed tracking
  const startListening = useCallback(() => {
    lineStartTime.current = Date.now();
    setLiveTranscript('');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback simulation
      setIsListening(true);
      setTimeout(() => {
        const fakeSpoken = scriptLines[currentLine];
        processLineResult(fakeSpoken);
      }, 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interim += t;
        }
      }
      setLiveTranscript(finalTranscript || interim);
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== 'aborted') {
        processLineResult(liveTranscript || '(not captured)');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [currentLine, scriptLines, liveTranscript]);

  const finishLine = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    const spoken = liveTranscript || '(not captured)';
    processLineResult(spoken);
  }, [liveTranscript, currentLine]);

  const processLineResult = (spoken: string) => {
    const expected = scriptLines[currentLine];
    const timeTaken = Date.now() - lineStartTime.current;
    const accuracy = wordSimilarity(expected, spoken);
    const fillerWords = detectFillers(spoken);
    const midStops = detectMidStops(spoken);

    // Pace detection
    const wordCount = spoken.split(/\s+/).filter(Boolean).length;
    const seconds = timeTaken / 1000;
    const wpm = seconds > 0 ? (wordCount / seconds) * 60 : 0;
    const pace: 'slow' | 'normal' | 'fast' = wpm < 80 ? 'slow' : wpm > 170 ? 'fast' : 'normal';

    // Per-line feedback
    let feedback = '';
    if (accuracy >= 85) feedback = 'Excellent delivery!';
    else if (accuracy >= 60) feedback = 'Good, minor variations.';
    else if (accuracy >= 30) feedback = 'Needs improvement — try following the script more closely.';
    else feedback = 'Missed this line — practice reading it aloud first.';

    if (fillerWords > 0) feedback += ` Detected ${fillerWords} filler word${fillerWords > 1 ? 's' : ''}.`;
    if (midStops > 0) feedback += ` ${midStops} mid-stop${midStops > 1 ? 's' : ''} detected — keep your flow steady.`;
    if (pace === 'slow') feedback += ' Try speaking a bit faster.';
    if (pace === 'fast') feedback += ' Slow down a little for clarity.';

    const result: LineResult = {
      lineIdx: currentLine, expected, spoken, accuracy, timeTaken,
      fillerWords, midStops, pace, feedback,
    };

    setLineResults(prev => [...prev, result]);
    setLiveTranscript('');

    if (currentLine < scriptLines.length - 1) {
      setCurrentLine(prev => prev + 1);
    } else {
      runAnalysis([...lineResults, result]);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Full AI Analysis
  const runAnalysis = async (results: LineResult[]) => {
    setPhase('analyzing');
    setAnalysisLoading(true);
    setAnalysisResult('');

    const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
    const totalFillers = results.reduce((s, r) => s + r.fillerWords, 0);
    const totalMidStops = results.reduce((s, r) => s + r.midStops, 0);
    const avgTime = Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / results.length / 1000);
    const slowLines = results.filter(r => r.pace === 'slow').length;
    const fastLines = results.filter(r => r.pace === 'fast').length;

    // Calculate preliminary fluency
    let flScore = avgAccuracy * 0.4;
    flScore += Math.max(0, 30 - totalFillers * 5);
    flScore += Math.max(0, 20 - totalMidStops * 4);
    flScore += (results.filter(r => r.pace === 'normal').length / results.length) * 10;
    setFluencyScore(Math.min(100, Math.max(5, Math.round(flScore))));

    const lineBreakdown = results.map((r, i) => `Line ${i + 1}: accuracy=${r.accuracy}%, pace=${r.pace}, fillers=${r.fillerWords}, stops=${r.midStops}, spoken="${r.spoken.slice(0, 60)}"`).join('\n');

    const prompt = `Analyze this student's speech practice in DETAIL. This is for ${speechTypeLabels[speechType].en}.

SCRIPT (${scriptLines.length} lines):
${scriptLines.map((l, i) => `${i + 1}. ${l}`).join('\n')}

LINE-BY-LINE PERFORMANCE:
${lineBreakdown}

STATS:
- Average accuracy: ${avgAccuracy}%
- Total filler words: ${totalFillers}
- Total mid-stops: ${totalMidStops}
- Slow lines: ${slowLines}, Fast lines: ${fastLines}
- Average time per line: ${avgTime}s

Provide analysis in this EXACT format:

## 🎯 Overall Score: [X]/100

## 📊 Breakdown
- **Pronunciation & Clarity**: [score/10] — [specific observation]
- **Pace & Rhythm**: [score/10] — [specific observation about speed]
- **Tone & Confidence**: [score/10] — [observation about voice quality]
- **Content Accuracy**: [score/10] — [how closely they followed script]
- **Flow & Smoothness**: [score/10] — [observations about mid-stops and fillers]

## 🔴 Issues Detected
[List each specific issue: filler words, mid-stops, pace problems, skipped content]

## 💡 Actionable Tips
[Give 4-5 very specific, practical tips — not generic advice]

## ✨ Improved Lines
[Rewrite any 2-3 weak lines with better delivery suggestions, showing WHERE to pause and WHAT to emphasize]

Be specific to this student. This is for Indian ${config.label} placement prep at ${company}.`;

    let fullText = '';
    await streamChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'self-intro-feedback',
      context: { domain, userName: userName || user?.name || 'Student' },
      onDelta: (chunk) => {
        fullText += chunk;
        setAnalysisResult(fullText);
        const scoreMatch = fullText.match(/(\d{1,3})\s*\/\s*100/);
        if (scoreMatch) {
          const s = parseInt(scoreMatch[1]);
          if (s > 0 && s <= 100) setFluencyScore(s);
        }
      },
      onDone: () => { setAnalysisLoading(false); setPhase('results'); },
      onError: () => {
        setAnalysisResult('Analysis could not be generated. Check your connection and try again.');
        setAnalysisLoading(false);
        setPhase('results');
      },
    });
  };

  const reset = () => {
    setPhase('setup');
    setScriptLines([]);
    setCurrentLine(0);
    setLineResults([]);
    setFluencyScore(0);
    setAnalysisResult('');
    setLiveTranscript('');
    window.speechSynthesis.cancel();
  };

  // Aggregate stats
  const totalFillers = lineResults.reduce((s, r) => s + r.fillerWords, 0);
  const totalMidStops = lineResults.reduce((s, r) => s + r.midStops, 0);
  const avgAccuracy = lineResults.length > 0 ? Math.round(lineResults.reduce((s, r) => s + r.accuracy, 0) / lineResults.length) : 0;

  // ═══════════════════════════════════
  // SETUP PHASE
  // ═══════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden p-8 text-center" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.7))' }}>
              <Mic className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">{isHi ? 'स्पीच स्टूडियो' : 'Speech Studio'}</h1>
            <p className="text-sm text-primary-foreground/70 max-w-md mx-auto">
              {isHi ? 'AI स्क्रिप्ट बनाएगा → लाइन-बाय-लाइन बोलें → AI हर पहलू का विश्लेषण करेगा' : 'AI generates your script → Speak line-by-line → AI analyzes every aspect of your delivery'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          {/* Name + Role row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{isHi ? 'आपका नाम' : 'Your Name'}</label>
              <input value={userName} onChange={e => setUserName(e.target.value)}
                placeholder={user?.name || 'Enter your name'}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{isHi ? 'लक्ष्य भूमिका' : 'Target Role'}</label>
              <input value={role} onChange={e => setRole(e.target.value)}
                placeholder={domain === 'engineering' ? 'Software Engineer' : domain === 'commerce' ? 'Bank PO' : 'IAS Officer'}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all" />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{isHi ? 'लक्ष्य कंपनी' : 'Target Company'}</label>
            <input value={company} onChange={e => setCompany(e.target.value)}
              placeholder={config.companies[0]}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all" />
          </div>

          {/* Speech Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{isHi ? 'स्पीच टाइप' : 'Speech Type'}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(speechTypeLabels) as SpeechType[]).map(st => (
                <button key={st} onClick={() => setSpeechType(st)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    speechType === st ? 'border-accent bg-accent/10 ring-1 ring-accent/30' : 'border-border hover:border-accent/50'
                  }`}>
                  <span className="text-lg block mb-0.5">{speechTypeLabels[st].icon}</span>
                  <span className="text-[10px] font-semibold">{isHi ? speechTypeLabels[st].hi : speechTypeLabels[st].en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{isHi ? 'टोन' : 'Tone & Style'}</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(toneLabels) as ToneType[]).map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    tone === t ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent/50'
                  }`}>
                  {isHi ? toneLabels[t].hi : toneLabels[t].en}
                </button>
              ))}
            </div>
          </div>

          {/* Extra context for some types */}
          {(speechType === 'hr-answer' || speechType === 'project-explain' || speechType === 'elevator-pitch') && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {speechType === 'project-explain' ? (isHi ? 'प्रोजेक्ट विवरण' : 'Project Details') :
                 speechType === 'hr-answer' ? (isHi ? 'हाइलाइट करने योग्य कौशल' : 'Skills to Highlight') :
                 (isHi ? 'अतिरिक्त संदर्भ' : 'Additional Context')}
              </label>
              <textarea value={customContext} onChange={e => setCustomContext(e.target.value)}
                placeholder={speechType === 'project-explain' ? 'Describe your project briefly...' : 'Any specific skills, achievements to mention...'}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none" />
            </div>
          )}

          {/* Generate button */}
          <button onClick={generateScript} disabled={isGenerating}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> {isHi ? 'AI स्क्रिप्ट बना रहा है...' : 'AI is writing your script...'}</> :
              <><Sparkles className="w-4 h-4" /> {isHi ? 'स्क्रिप्ट बनाएं' : 'Generate Script'}</>}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // SCRIPT READY — Preview before practice
  // ═══════════════════════════════════
  if (phase === 'script-ready') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> {isHi ? 'वापस' : 'Back'}
        </button>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {isHi ? 'आपकी स्क्रिप्ट तैयार है' : 'Your Script is Ready'}
              </h2>
              <p className="text-xs text-muted-foreground">{speechTypeLabels[speechType].icon} {isHi ? speechTypeLabels[speechType].hi : speechTypeLabels[speechType].en} · {isHi ? toneLabels[tone].hi : toneLabels[tone].en}</p>
            </div>
            <button onClick={() => speakLine(0)}
              className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> {isHi ? 'सुनें' : 'Listen'}
            </button>
          </div>

          <div className="space-y-2">
            {scriptLines.map((line, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-accent/30 transition-all group">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0 mt-0.5 group-hover:bg-accent/20 group-hover:text-accent transition-colors">{i + 1}</span>
                <p className="text-sm leading-relaxed flex-1">{line}</p>
                <button onClick={() => speakLine(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={generateScript} disabled={isGenerating}
            className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover-scale flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> {isHi ? 'नई स्क्रिप्ट' : 'Regenerate'}
          </button>
          <button onClick={() => { setPhase('practice'); setCurrentLine(0); setLineResults([]); }}
            className="flex-1 py-3 rounded-xl font-bold hover-scale flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
            <Mic className="w-4 h-4" /> {isHi ? 'अभ्यास शुरू करें' : 'Start Speaking'}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // PRACTICE — Teleprompter + Live Recognition
  // ═══════════════════════════════════
  if (phase === 'practice') {
    const progress = scriptLines.length > 0 ? (lineResults.length / scriptLines.length) * 100 : 0;
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> {isHi ? 'बंद करें' : 'Exit'}
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{lineResults.length}/{scriptLines.length}</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Main Teleprompter Card */}
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.05))' }}>
          {/* Waveform */}
          <div className="flex items-end justify-center gap-[3px] h-12 px-6 pt-4">
            {waveAmplitude.map((amp, i) => (
              <div key={i} className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: `${amp * 40}px`,
                  background: isListening ? `hsl(var(--accent) / ${0.4 + amp * 0.6})` : 'hsl(var(--muted))',
                  minHeight: '3px',
                }} />
            ))}
          </div>

          {/* Current line — BIG */}
          <div className="p-8 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
              {isHi ? `लाइन ${currentLine + 1} / ${scriptLines.length}` : `Line ${currentLine + 1} of ${scriptLines.length}`}
            </p>
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-6 min-h-[64px]">
              {scriptLines[currentLine] || '...'}
            </h2>

            {/* Live transcript */}
            {isListening && liveTranscript && (
              <div className="mb-4 p-3 rounded-xl bg-accent/5 border border-accent/20 animate-fade-in">
                <p className="text-[10px] text-accent font-semibold mb-1">{isHi ? 'सुन रहा है...' : 'Hearing you...'}</p>
                <p className="text-sm text-foreground/80 italic">"{liveTranscript}"</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Listen to line */}
              <button onClick={() => isPlaying ? stopSpeaking() : speakLine(currentLine)}
                className="w-11 h-11 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-all shadow-sm"
                title={isHi ? 'लाइन सुनें' : 'Listen to line'}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Main mic button */}
              {!isListening ? (
                <button onClick={startListening}
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
                  <Mic className="w-7 h-7" />
                </button>
              ) : (
                <button onClick={finishLine}
                  className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg animate-pulse transition-all hover:scale-105"
                  title={isHi ? 'यह लाइन पूर्ण करें' : 'Finish this line'}>
                  <CheckCircle className="w-7 h-7" />
                </button>
              )}

              {/* Skip */}
              <button onClick={() => { stopListening(); processLineResult('(skipped)'); }}
                className="w-11 h-11 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-all shadow-sm"
                title={isHi ? 'स्किप करें' : 'Skip line'}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-3">
              {isListening
                ? (isHi ? '🎤 बोलें, फिर ✓ दबाएं' : '🎤 Speak the line, then tap ✓ to proceed')
                : (isHi ? 'माइक दबाएं और बोलें' : 'Tap the mic and start speaking')}
            </p>
          </div>
        </div>

        {/* Live Stats */}
        {lineResults.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold text-accent">{avgAccuracy}%</p>
              <p className="text-[9px] text-muted-foreground">{isHi ? 'सटीकता' : 'Accuracy'}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{totalFillers}</p>
              <p className="text-[9px] text-muted-foreground">{isHi ? 'फिलर शब्द' : 'Fillers'}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{totalMidStops}</p>
              <p className="text-[9px] text-muted-foreground">{isHi ? 'मिड-स्टॉप' : 'Mid-Stops'}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{lineResults.filter(r => r.pace === 'normal').length}</p>
              <p className="text-[9px] text-muted-foreground">{isHi ? 'सही गति' : 'Good Pace'}</p>
            </div>
          </div>
        )}

        {/* Script lines — compact */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="space-y-1.5">
            {scriptLines.map((line, i) => {
              const result = lineResults.find(r => r.lineIdx === i);
              const isActive = i === currentLine;
              const isDone = !!result;
              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive ? 'bg-accent/10 border border-accent/30 font-medium' :
                  isDone ? 'opacity-60' : 'opacity-40'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                    isDone ? (result!.accuracy >= 70 ? 'bg-green-500/20 text-green-600' : result!.accuracy >= 40 ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive') :
                    isActive ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="flex-1 truncate">{line}</span>
                  {isDone && <span className={`text-[9px] font-bold ${result!.accuracy >= 70 ? 'text-green-600' : result!.accuracy >= 40 ? 'text-accent' : 'text-destructive'}`}>{result!.accuracy}%</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // ANALYZING
  // ═══════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
            <Sparkles className="w-6 h-6 text-accent absolute inset-0 m-auto" />
          </div>
          <h2 className="text-xl font-bold mb-1">{isHi ? 'AI विश्लेषण कर रहा है...' : 'AI is Analyzing Your Speech...'}</h2>
          <p className="text-sm text-muted-foreground">{isHi ? 'टोन, गति, स्पष्टता, रुकावट — सब कुछ जाँच रहा है' : 'Checking tone, pace, clarity, mid-stops — every detail'}</p>
        </div>
        {analysisResult && (
          <div className="bg-card rounded-2xl border border-border p-6 prose prose-sm max-w-none animate-fade-in">
            <ReactMarkdown>{analysisResult}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <h2 className="text-xl font-bold text-center">{isHi ? 'विश्लेषण पूर्ण!' : 'Analysis Complete!'}</h2>

      {/* Score + Quick Stats */}
      <div className="grid md:grid-cols-3 gap-3">
        {/* Main score */}
        <div className="bg-card rounded-2xl border border-border p-6 text-center md:row-span-2">
          <div className="w-28 h-28 mx-auto relative mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={fluencyScore >= 70 ? '#22C55E' : fluencyScore >= 40 ? 'hsl(var(--accent))' : '#EF4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={327} strokeDashoffset={327 - (327 * fluencyScore) / 100}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{fluencyScore}</span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </span>
          </div>
          <p className="font-bold">
            {fluencyScore >= 80 ? '🌟 ' : fluencyScore >= 60 ? '📈 ' : '💪 '}
            {fluencyScore >= 80 ? (isHi ? 'उत्कृष्ट!' : 'Excellent!') :
             fluencyScore >= 60 ? (isHi ? 'अच्छा!' : 'Good!') :
             (isHi ? 'अभ्यास जारी रखें' : 'Keep Practicing')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{speechTypeLabels[speechType].icon} {isHi ? speechTypeLabels[speechType].hi : speechTypeLabels[speechType].en}</p>
        </div>

        {/* Stats grid */}
        {[
          { label: isHi ? 'सटीकता' : 'Accuracy', value: `${avgAccuracy}%`, icon: Target, color: avgAccuracy >= 70 ? 'text-green-600' : 'text-accent' },
          { label: isHi ? 'फिलर शब्द' : 'Filler Words', value: String(totalFillers), icon: AlertTriangle, color: totalFillers <= 2 ? 'text-green-600' : 'text-destructive' },
          { label: isHi ? 'मिड-स्टॉप' : 'Mid-Stops', value: String(totalMidStops), icon: Pause, color: totalMidStops <= 1 ? 'text-green-600' : 'text-accent' },
          { label: isHi ? 'सही गति' : 'Good Pace', value: `${lineResults.filter(r => r.pace === 'normal').length}/${lineResults.length}`, icon: Clock, color: 'text-foreground' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Line-by-line breakdown */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          {isHi ? 'लाइन-बाय-लाइन विश्लेषण' : 'Line-by-Line Breakdown'}
        </h3>
        <div className="space-y-2">
          {lineResults.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    r.accuracy >= 70 ? 'bg-green-500/20 text-green-600' : r.accuracy >= 40 ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                  }`}>{i + 1}</span>
                  Line {i + 1}
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`font-bold ${r.accuracy >= 70 ? 'text-green-600' : r.accuracy >= 40 ? 'text-accent' : 'text-destructive'}`}>{r.accuracy}%</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    r.pace === 'normal' ? 'bg-green-500/10 text-green-600' : r.pace === 'slow' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'
                  }`}>{r.pace}</span>
                  {r.fillerWords > 0 && <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[9px] font-semibold">{r.fillerWords} filler{r.fillerWords > 1 ? 's' : ''}</span>}
                  {r.midStops > 0 && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-semibold">{r.midStops} stop{r.midStops > 1 ? 's' : ''}</span>}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{r.feedback}</p>
              {r.spoken !== '(skipped)' && r.spoken !== '(not captured)' && (
                <p className="text-[10px] text-foreground/60 italic">You said: "{r.spoken.slice(0, 80)}{r.spoken.length > 80 ? '...' : ''}"</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Detailed Analysis */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> {isHi ? 'AI विस्तृत विश्लेषण' : 'AI Detailed Analysis'}</h3>
        <div className="prose prose-sm max-w-none text-sm">
          <ReactMarkdown>{analysisResult}</ReactMarkdown>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setCurrentLine(0); setLineResults([]); setLiveTranscript(''); setPhase('practice'); }}
          className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover-scale flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> {isHi ? 'फिर से अभ्यास' : 'Practice Again'}
        </button>
        <button onClick={reset}
          className="flex-1 py-3 rounded-xl font-bold hover-scale flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
          <Sparkles className="w-4 h-4" /> {isHi ? 'नई स्क्रिप्ट' : 'New Script'}
        </button>
      </div>
    </div>
  );
}
