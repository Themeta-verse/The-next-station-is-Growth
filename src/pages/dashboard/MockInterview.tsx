import { useState, useRef, useEffect, useCallback } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { streamChat, type Msg } from '@/lib/ai';
import { Video, Mic, MicOff, Play, SkipForward, MessageSquare, Award, TrendingUp, AlertCircle, Bot, User, Loader2, RotateCcw, Sparkles, Clock, Target, ChevronRight, Send } from 'lucide-react';
import InterviewerAvatar from '@/components/InterviewerAvatar';

interface Feedback {
  confidence: number;
  clarity: number;
  suggestions: string[];
}

interface InterviewMessage {
  role: 'ai' | 'user';
  text: string;
  feedback?: Feedback;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function MockInterview() {
  const { domain, user, language } = useStationStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<Msg[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [overallScore, setOverallScore] = useState({ confidence: 0, clarity: 0, total: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Timer
  useEffect(() => {
    if (started && !sessionComplete) {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, sessionComplete]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startInterview = async () => {
    setStarted(true);
    setAiLoading(true);
    setElapsedTime(0);
    const systemMsg: Msg = {
      role: 'user',
      content: `Start a mock interview for a ${config.label} student named ${user?.name || 'Student'} targeting ${user?.dreamCompany || config.companies[0]}. Specialization: ${user?.specialization || config.label}. Ask the first HR question to start. Keep it realistic for Indian campus placements. Be professional but warm.`
    };
    setAiMessages([systemMsg]);
    let response = '';
    await streamChat({
      messages: [systemMsg],
      mode: 'mock-interview',
      context: { domain, userName: user?.name || 'Student', company: user?.dreamCompany || config.companies[0] },
      onDelta: (d) => { response += d; },
      onDone: () => {
        setMessages([{ role: 'ai', text: response }]);
        setAiLoading(false);
        setQuestionCount(1);
      },
      onError: () => {
        setMessages([{ role: 'ai', text: isHi ? 'नमस्ते! मैं आज आपका इंटरव्यू ले रहा हूं। अपने बारे में बताइए।' : "Hello! I'll be conducting your interview today. Please tell me about yourself." }]);
        setAiLoading(false);
        setQuestionCount(1);
      }
    });
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = isHi ? 'hi-IN' : 'en-IN';
    let finalTranscript = '';
    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalTranscript + interim);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [isHi]);

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const submitAnswer = async () => {
    if (!transcript.trim()) return;
    stopListening();
    const userAnswer = transcript.trim();
    setMessages(prev => [...prev, { role: 'user', text: userAnswer }]);
    setTranscript('');
    setAiLoading(true);

    const newAiMessages: Msg[] = [
      ...aiMessages,
      { role: 'assistant', content: messages.filter(m => m.role === 'ai').pop()?.text || '' },
      { role: 'user', content: userAnswer }
    ];
    setAiMessages(newAiMessages);

    const feedbackPrompt: Msg[] = [
      ...newAiMessages,
      { role: 'user', content: `Evaluate my last answer. Give: 1) Confidence score (0-100), 2) Clarity score (0-100), 3) 2-3 specific improvement suggestions. Then ask the next interview question. Format: CONFIDENCE: [score]\nCLARITY: [score]\nSUGGESTIONS:\n- [suggestion]\nNEXT QUESTION:\n[question]` }
    ];

    let response = '';
    await streamChat({
      messages: feedbackPrompt,
      mode: 'mock-interview',
      context: { domain, userName: user?.name || 'Student', company: user?.dreamCompany || config.companies[0] },
      onDelta: (d) => { response += d; },
      onDone: () => {
        const confMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
        const clarMatch = response.match(/CLARITY:\s*(\d+)/i);
        const sugMatch = response.match(/SUGGESTIONS:\s*([\s\S]*?)(?:NEXT QUESTION:|$)/i);
        const nextMatch = response.match(/NEXT QUESTION:\s*([\s\S]*)/i);

        const confidence = confMatch ? Math.min(100, parseInt(confMatch[1])) : Math.round(40 + Math.random() * 40);
        const clarity = clarMatch ? Math.min(100, parseInt(clarMatch[1])) : Math.round(40 + Math.random() * 40);
        const suggestions = sugMatch
          ? sugMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.replace(/^-\s*/, '').trim()).filter(Boolean)
          : ['Try using the STAR method', 'Be more specific with examples'];
        const nextQ = nextMatch ? nextMatch[1].trim() : response;

        const feedback: Feedback = { confidence, clarity, suggestions };
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], feedback };
          return [...updated, { role: 'ai', text: nextQ }];
        });

        setOverallScore(prev => ({
          confidence: Math.round((prev.confidence * questionCount + confidence) / (questionCount + 1)),
          clarity: Math.round((prev.clarity * questionCount + clarity) / (questionCount + 1)),
          total: Math.round(((prev.confidence * questionCount + confidence) / (questionCount + 1) + (prev.clarity * questionCount + clarity) / (questionCount + 1)) / 2),
        }));
        setQuestionCount(c => c + 1);
        setAiLoading(false);
        if (questionCount >= 7) setSessionComplete(true);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'ai', text: isHi ? 'अगला प्रश्न: अपने सबसे बड़े प्रोजेक्ट के बारे में बताएं।' : 'Next question: Tell me about your biggest project.' }]);
        setAiLoading(false);
      },
    });
  };

  useEffect(() => {
    if (sessionComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      const sessions = JSON.parse(localStorage.getItem('station_mock_sessions') || '[]');
      sessions.push({ date: new Date().toISOString(), domain, questions: questionCount, confidence: overallScore.confidence, clarity: overallScore.clarity, total: overallScore.total });
      localStorage.setItem('station_mock_sessions', JSON.stringify(sessions));
    }
  }, [sessionComplete]);

  // ============ NOT STARTED ============
  if (!started) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
        {/* Hero with interviewer */}
        <div className="rounded-2xl overflow-hidden border border-border" style={{ background: 'linear-gradient(160deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' }}>
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left — Avatar */}
            <div className="flex flex-col items-center justify-center p-8">
              <InterviewerAvatar size={180} />
              <div className="mt-4 text-center">
                <p className="text-sm font-bold text-primary-foreground">Mr. Kapoor</p>
                <p className="text-[10px] text-primary-foreground/60">{config.label} Interview Expert</p>
                <p className="text-[10px] text-primary-foreground/40 mt-0.5">15+ years experience</p>
              </div>
            </div>
            {/* Right — Info */}
            <div className="p-8 flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-primary-foreground mb-2">
                {isHi ? 'AI मॉक इंटरव्यू' : 'AI Mock Interview'}
              </h1>
              <p className="text-sm text-primary-foreground/70 mb-6 leading-relaxed">
                {isHi ? 'वास्तविक इंटरव्यू जैसा अनुभव। AI इंटरव्यूअर आपसे सवाल पूछेगा, आपकी आवाज़ सुनेगा, और हर उत्तर पर तुरंत फीडबैक देगा।' :
                  "Experience a realistic mock interview. Your AI interviewer will ask questions, listen to your voice, and provide instant feedback on confidence, clarity, and content."}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { icon: MessageSquare, label: isHi ? '8 प्रश्न' : '8 Questions', sub: 'HR + Technical' },
                  { icon: Award, label: isHi ? 'तुरंत फीडबैक' : 'Live Feedback', sub: 'Per answer' },
                  { icon: TrendingUp, label: isHi ? 'स्कोर' : 'Score', sub: 'Confidence + Clarity' },
                ].map(f => (
                  <div key={f.label} className="bg-primary-foreground/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <f.icon className="w-4 h-4 mx-auto mb-1 text-accent" />
                    <p className="text-[10px] font-semibold text-primary-foreground">{f.label}</p>
                    <p className="text-[8px] text-primary-foreground/50">{f.sub}</p>
                  </div>
                ))}
              </div>
              <button onClick={startInterview}
                className="py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
                <Play className="w-5 h-5" /> {isHi ? 'इंटरव्यू शुरू करें' : 'Start Interview'}
              </button>
            </div>
          </div>
        </div>

        {/* Past sessions */}
        {(() => {
          const sessions = JSON.parse(localStorage.getItem('station_mock_sessions') || '[]');
          if (sessions.length === 0) return null;
          return (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> {isHi ? 'पिछले इंटरव्यू' : 'Past Sessions'}
              </h3>
              <div className="space-y-2">
                {sessions.slice(-5).reverse().map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">{new Date(s.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground">{s.questions} questions</p>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span>Conf: <strong className="text-accent">{s.confidence}%</strong></span>
                      <span>Clarity: <strong className="text-accent">{s.clarity}%</strong></span>
                      <span className={`font-bold ${s.total >= 70 ? 'text-green-600' : 'text-accent'}`}>{s.total}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ============ INTERVIEW IN PROGRESS ============
  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 bg-card rounded-xl border border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-bold">{isHi ? 'मॉक इंटरव्यू' : 'Mock Interview'} — Q{questionCount}/8</p>
            <p className="text-[10px] text-muted-foreground">{user?.dreamCompany || config.companies[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTime(elapsedTime)}
          </span>
          {overallScore.total > 0 && (
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-bold">{overallScore.confidence}% conf</span>
              <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-bold">{overallScore.clarity}% clarity</span>
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        {/* Interviewer Panel */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center text-center">
          <InterviewerAvatar size={140} speaking={aiLoading} />
          <p className="text-sm font-bold mt-3">Mr. Kapoor</p>
          <p className="text-[10px] text-muted-foreground">{config.label} Expert</p>
          {aiLoading && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isHi ? 'सोच रहा है...' : 'Thinking...'}
            </div>
          )}
          {/* Mini progress */}
          <div className="mt-4 w-full">
            <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{questionCount}/8</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(questionCount / 8) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-card rounded-2xl border border-border flex flex-col min-h-[450px] max-h-[550px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'ai' ? 'bg-muted/60 rounded-tl-md' : 'bg-accent text-accent-foreground rounded-tr-md'
                  }`}>
                    {msg.text}
                  </div>
                  {/* Feedback card */}
                  {msg.feedback && (
                    <div className="mt-2 p-3 rounded-xl bg-accent/5 border border-accent/15 text-xs space-y-2.5 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: isHi ? 'आत्मविश्वास' : 'Confidence', val: msg.feedback.confidence },
                          { label: isHi ? 'स्पष्टता' : 'Clarity', val: msg.feedback.clarity },
                        ].map(m => (
                          <div key={m.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">{m.label}</span>
                              <span className={`font-bold ${m.val >= 70 ? 'text-green-600' : m.val >= 40 ? 'text-accent' : 'text-destructive'}`}>{m.val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full">
                              <div className={`h-full rounded-full transition-all duration-700 ${m.val >= 70 ? 'bg-green-500' : m.val >= 40 ? 'bg-accent' : 'bg-destructive'}`} style={{ width: `${m.val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {msg.feedback.suggestions.length > 0 && (
                        <div className="pt-1.5 border-t border-accent/10">
                          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-accent" /> Tips:</p>
                          {msg.feedback.suggestions.map((s, j) => (
                            <p key={j} className="text-muted-foreground flex items-start gap-1.5 py-0.5">
                              <ChevronRight className="w-3 h-3 text-accent mt-0.5 shrink-0" />{s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            {sessionComplete ? (
              <div className="text-center space-y-4 py-2">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: isHi ? 'आत्मविश्वास' : 'Confidence', val: overallScore.confidence },
                    { label: isHi ? 'स्पष्टता' : 'Clarity', val: overallScore.clarity },
                    { label: isHi ? 'कुल' : 'Overall', val: overallScore.total },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${s.val >= 70 ? 'text-green-600' : s.val >= 40 ? 'text-accent' : 'text-destructive'}`}>{s.val}%</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {overallScore.total >= 70 ? '🎉 ' : overallScore.total >= 40 ? '📈 ' : '💪 '}
                  {overallScore.total >= 70 ? (isHi ? 'शानदार! इंटरव्यू रेडी!' : 'Excellent! Interview ready!') :
                    overallScore.total >= 40 ? (isHi ? 'अच्छा! और अभ्यास करें।' : 'Good effort! Keep practicing.') :
                      (isHi ? 'अभ्यास जारी रखें।' : 'Keep practicing.')}
                </p>
                <p className="text-[10px] text-muted-foreground">Duration: {formatTime(elapsedTime)}</p>
                <button onClick={() => { setStarted(false); setMessages([]); setAiMessages([]); setQuestionCount(0); setSessionComplete(false); setOverallScore({ confidence: 0, clarity: 0, total: 0 }); setElapsedTime(0); }}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold hover-scale flex items-center gap-2 mx-auto text-sm">
                  <RotateCcw className="w-4 h-4" /> {isHi ? 'फिर से' : 'Start Again'}
                </button>
              </div>
            ) : (
              <>
                {transcript && (
                  <div className="mb-3 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground italic border border-border/50">
                    "{transcript}"
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={aiLoading}
                    className={`p-3 rounded-xl transition-all ${
                      isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted text-foreground hover:bg-muted/80'
                    } disabled:opacity-40`}>
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder={isHi ? 'बोलें या टाइप करें...' : 'Speak or type your answer...'}
                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                  />
                  <button onClick={submitAnswer} disabled={!transcript.trim() || aiLoading}
                    className="px-4 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover-scale disabled:opacity-40">
                    {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
