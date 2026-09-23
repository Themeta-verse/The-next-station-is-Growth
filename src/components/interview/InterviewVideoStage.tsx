import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Pause, Play, 
  RotateCcw, Send, CheckCircle2, AlertCircle, Clock, Sparkles, 
  CornerDownLeft, MessageSquare, Shield, HelpCircle
} from 'lucide-react';
import InterviewerAvatar from '@/components/InterviewerAvatar';
import { SpeechService } from '@/services/speechService';
import { 
  InterviewConfig, 
  InterviewExchange, 
  InterviewStage, 
  InterviewEngine,
  InterviewReport
} from '@/services/interviewEngine';
import { UserProfile } from '@/store/useStationStore';

interface InterviewVideoStageProps {
  config: InterviewConfig;
  profile: UserProfile | null;
  activeStream: MediaStream | null;
  onComplete: (report: InterviewReport) => void;
  onAbort: () => void;
}

export type StageSessionStatus = 
  | 'interviewer_speaking'
  | 'waiting_for_student'
  | 'student_speaking'
  | 'processing_ai'
  | 'paused'
  | 'generating_report'
  | 'error';

export const InterviewVideoStage: React.FC<InterviewVideoStageProps> = ({
  config,
  profile,
  activeStream,
  onComplete,
  onAbort,
}) => {
  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Core state
  const [sessionStatus, setSessionStatus] = useState<StageSessionStatus>('interviewer_speaking');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<InterviewStage>('warmup');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [exchanges, setExchanges] = useState<InterviewExchange[]>([]);
  const totalQuestions = InterviewEngine.getPlannedQuestionCount(config.duration);

  // Speech and transcript state
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Camera & Mic toggles
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(
    InterviewEngine.getDurationSeconds(config.duration)
  );

  // Initialize Speech and Camera
  useEffect(() => {
    speechServiceRef.current = new SpeechService();

    // Hook up camera stream to local preview
    if (studentVideoRef.current && activeStream) {
      studentVideoRef.current.srcObject = activeStream;
    }

    // Start session timer
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Generate first question
    loadFirstQuestion();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      speechServiceRef.current?.stopListening();
      SpeechService.stopSpeaking();
    };
  }, []);

  // Update video element if activeStream changes
  useEffect(() => {
    if (studentVideoRef.current && activeStream) {
      studentVideoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  // Load first opening question
  const loadFirstQuestion = async () => {
    setSessionStatus('interviewer_speaking');
    const firstQ = await InterviewEngine.generateFirstQuestion(config, profile);
    setCurrentQuestion(firstQ);
    setCurrentStage('warmup');
    speakQuestion(firstQ);
  };

  // Speak question via Text-To-Speech
  const speakQuestion = (questionText: string) => {
    if (ttsMuted || !SpeechService.isTTSSupported()) {
      // If muted or not supported, transition directly to waiting for student
      setSessionStatus('waiting_for_student');
      return;
    }

    setIsTTSActive(true);
    setSessionStatus('interviewer_speaking');

    SpeechService.speakText(questionText, {
      onStart: () => setIsTTSActive(true),
      onEnd: () => {
        setIsTTSActive(false);
        setSessionStatus('waiting_for_student');
        startListeningToStudent();
      },
      onError: () => {
        setIsTTSActive(false);
        setSessionStatus('waiting_for_student');
      },
    });
  };

  // Replay question audio
  const handleReplayQuestion = () => {
    SpeechService.stopSpeaking();
    speechServiceRef.current?.stopListening();
    setIsSTTActive(false);
    speakQuestion(currentQuestion);
  };

  // Start listening to the student's spoken response
  const startListeningToStudent = () => {
    if (!isMicOn) return;

    setSpeechError(null);
    setIsSTTActive(true);
    setSessionStatus('student_speaking');

    speechServiceRef.current?.startListening({
      onTranscript: (payload) => {
        setCurrentTranscript(payload.transcript);
      },
      onError: (err) => {
        console.warn('STT error:', err);
        setSpeechError(err);
        setIsSTTActive(false);
        setShowTextFallback(true);
      },
      onSilenceTimeout: () => {
        // Subtle reminder that silence was detected
      },
      silenceTimeoutMs: 5000,
    });
  };

  // Stop listening
  const stopListeningToStudent = () => {
    setIsSTTActive(false);
    const finalSpoken = speechServiceRef.current?.stopListening() || currentTranscript;
    return finalSpoken.trim();
  };

  // Submit Answer & Request Next Question
  const handleSubmitAnswer = async () => {
    const spokenTranscript = stopListeningToStudent();
    const finalAnswer = showTextFallback && textInputValue.trim() 
      ? textInputValue.trim() 
      : spokenTranscript || currentTranscript.trim();

    if (!finalAnswer) {
      setSpeechError('Please speak or type your answer before submitting.');
      return;
    }

    SpeechService.stopSpeaking();
    setSessionStatus('processing_ai');

    const currentExchange: InterviewExchange = {
      id: 'ex_' + Date.now(),
      stage: currentStage,
      question: currentQuestion,
      answerTranscript: finalAnswer,
      timestamp: Date.now(),
    };

    const updatedExchanges = [...exchanges, currentExchange];
    setExchanges(updatedExchanges);
    setCurrentTranscript('');
    setTextInputValue('');
    setSpeechError(null);

    const nextIndex = questionIndex + 1;

    // Check if interview completed
    if (nextIndex >= totalQuestions || timeRemaining <= 30) {
      await handleFinishInterview(updatedExchanges);
      return;
    }

    // Generate dynamic follow-up or next stage
    setQuestionIndex(nextIndex);
    const { nextQuestion, nextStage } = await InterviewEngine.generateNextQuestion(
      config,
      profile,
      updatedExchanges,
      finalAnswer,
      nextIndex,
      totalQuestions
    );

    setCurrentQuestion(nextQuestion);
    setCurrentStage(nextStage);
    speakQuestion(nextQuestion);
  };

  // Finish interview and create report
  const handleFinishInterview = async (completedExchanges: InterviewExchange[]) => {
    setSessionStatus('generating_report');
    SpeechService.stopSpeaking();
    speechServiceRef.current?.stopListening();

    const totalDurationSeconds = InterviewEngine.getDurationSeconds(config.duration) - timeRemaining;
    const durationMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));

    const report = await InterviewEngine.generateReport(
      config,
      profile,
      completedExchanges,
      durationMinutes
    );

    onComplete(report);
  };

  // Camera & Mic hardware toggles
  const handleToggleCamera = () => {
    if (activeStream) {
      const videoTrack = activeStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const handleToggleMic = () => {
    if (activeStream) {
      const audioTrack = activeStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        if (!audioTrack.enabled && isSTTActive) {
          speechServiceRef.current?.stopListening();
          setIsSTTActive(false);
        }
      }
    }
  };

  const handleTogglePause = () => {
    if (sessionStatus === 'paused') {
      setSessionStatus('waiting_for_student');
      if (isMicOn) startListeningToStudent();
    } else {
      SpeechService.stopSpeaking();
      speechServiceRef.current?.stopListening();
      setIsSTTActive(false);
      setSessionStatus('paused');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-2 md:p-4">
      {/* Session Top Bar */}
      <div className="bg-card border border-border rounded-2xl p-3 md:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm md:text-base">{config.targetRole}</span>
              {config.targetCompany && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                  {config.targetCompany}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {config.difficulty}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>Stage: <strong className="capitalize text-foreground">{currentStage}</strong></span>
              <span>•</span>
              <span>Question {questionIndex + 1} of {totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-foreground font-mono text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            onClick={handleTogglePause}
            className="p-2 rounded-xl border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            title={sessionStatus === 'paused' ? 'Resume' : 'Pause'}
          >
            {sessionStatus === 'paused' ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleFinishInterview(exchanges)}
            disabled={sessionStatus === 'generating_report' || exchanges.length === 0}
            className="px-3 py-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
          >
            End & Generate Report
          </button>
        </div>
      </div>

      {/* Main Dual-Screen Video Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Upper: Interviewer Screen */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video rounded-2xl bg-zinc-950 border border-border shadow-inner overflow-hidden flex flex-col justify-between p-4 md:p-6 text-white">
            {/* Top Bar inside interviewer card */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium tracking-wide">
                  <span className={`w-2 h-2 rounded-full ${
                    sessionStatus === 'interviewer_speaking' 
                      ? 'bg-primary animate-ping' 
                      : sessionStatus === 'student_speaking'
                      ? 'bg-emerald-400'
                      : 'bg-zinc-400'
                  }`} />
                  {sessionStatus === 'interviewer_speaking' ? 'Interviewer Speaking' : 
                   sessionStatus === 'student_speaking' ? 'Listening to You' :
                   sessionStatus === 'processing_ai' ? 'Evaluating Answer...' :
                   sessionStatus === 'paused' ? 'Paused' : 'Interviewer Ready'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTtsMuted(!ttsMuted)}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white/80 transition-colors"
                  title={ttsMuted ? 'Unmute interviewer voice' : 'Mute interviewer voice'}
                >
                  {ttsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleReplayQuestion}
                  disabled={sessionStatus === 'interviewer_speaking'}
                  className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/80 text-[11px] text-white/90 flex items-center gap-1 transition-colors disabled:opacity-40"
                  title="Repeat Question Audio"
                >
                  <RotateCcw className="w-3 h-3" /> Replay Question
                </button>
              </div>
            </div>

            {/* Central Interviewer Visual */}
            <div className="my-auto flex flex-col items-center justify-center">
              <div className={`transition-transform duration-300 ${isTTSActive ? 'scale-105' : 'scale-100'}`}>
                <InterviewerAvatar speaking={isTTSActive} size={150} />
              </div>
            </div>

            {/* Bottom Question Transcript / Audio Caption */}
            <div className="z-10 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs md:text-sm text-zinc-100 font-sans shadow-md">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">
                Current Question
              </span>
              <p className="leading-relaxed font-medium">
                {currentQuestion || 'Loading interview question...'}
              </p>
            </div>
          </div>
        </div>

        {/* Right / Lower: Candidate Video Stream + Transcript */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-video rounded-2xl bg-zinc-950 border border-border shadow-inner overflow-hidden flex items-center justify-center">
            {isCameraOn ? (
              <video
                ref={studentVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <CameraOff className="w-10 h-10 opacity-60" />
                <span className="text-xs">Camera preview off</span>
              </div>
            )}

            {/* Student Live Captions / Speech transcript preview overlay */}
            <div className="absolute inset-x-2 bottom-12 z-10 pointer-events-none">
              {(currentTranscript || isSTTActive) && (
                <div className="bg-black/75 backdrop-blur-md rounded-lg p-2.5 border border-white/10 text-xs text-white max-h-24 overflow-y-auto leading-relaxed shadow-lg">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Transcript
                  </div>
                  <p className="italic">
                    {currentTranscript || 'Listening for your spoken answer...'}
                  </p>
                </div>
              )}
            </div>

            {/* Stream In-card Toggles */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                    isCameraOn ? 'bg-black/60 text-white hover:bg-black/80' : 'bg-destructive text-white'
                  }`}
                  title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
                >
                  {isCameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                    isMicOn ? 'bg-black/60 text-white hover:bg-black/80' : 'bg-destructive text-white'
                  }`}
                  title={isMicOn ? 'Mute mic' : 'Unmute mic'}
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white/80 font-mono">
                Candidate Feed
              </span>
            </div>
          </div>

          {/* Speech Controls & Action Panel */}
          <div className="p-3.5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            {speechError && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={sessionStatus === 'processing_ai' || sessionStatus === 'interviewer_speaking'}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs md:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {sessionStatus === 'processing_ai' ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Done Speaking · Submit Answer
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  speechServiceRef.current?.resetTranscript();
                  setCurrentTranscript('');
                  setTextInputValue('');
                  if (isMicOn) startListeningToStudent();
                }}
                disabled={sessionStatus === 'processing_ai'}
                className="p-2.5 rounded-xl border border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear and re-speak answer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Accessible Text Fallback Toggle */}
            <div className="pt-1 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowTextFallback(!showTextFallback)}
                className="hover:text-primary transition-colors flex items-center gap-1.5 text-[11px]"
              >
                <MessageSquare className="w-3 h-3" />
                {showTextFallback ? 'Hide text fallback' : 'Having mic issues? Type answer'}
              </button>
              <span className="text-[11px] text-muted-foreground/70">
                Spoken audio is prioritized
              </span>
            </div>

            {showTextFallback && (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Type your answer here if speech recognition is unavailable..."
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
