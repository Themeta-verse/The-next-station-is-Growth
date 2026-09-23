import React, { useState, useEffect } from 'react';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_COMPANIES } from '@/data/companyPreparationData';
import { 
  InterviewConfig, 
  InterviewType, 
  InterviewDifficulty, 
  InterviewDuration,
  InterviewReport,
  InterviewEngine
} from '@/services/interviewEngine';
import { PreInterviewDeviceCheck } from '@/components/interview/PreInterviewDeviceCheck';
import { InterviewVideoStage } from '@/components/interview/InterviewVideoStage';
import { InterviewReportView } from '@/components/interview/InterviewReportView';
import { 
  Video, Mic, Award, Sparkles, Building2, Briefcase, 
  Clock, ShieldCheck, ChevronRight, AlertCircle, History,
  UserCheck, ArrowRight
} from 'lucide-react';

type MockInterviewStep = 'config' | 'device_check' | 'in_session' | 'report';

export default function MockInterview() {
  const { user } = useStationStore();
  const { recordProgress } = useAuth();
  const { mockInterviewHistory, saveMockInterviewSession } = usePerformanceStore();

  const [currentStep, setCurrentStep] = useState<MockInterviewStep>('config');
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [currentReport, setCurrentReport] = useState<InterviewReport | null>(null);

  // Configuration pre-filled from student profile
  const initialCompany = user?.targetCompanies?.[0] || 
    (user?.dreamCompany && InterviewEngine.isCompanySupported(user.dreamCompany) ? user.dreamCompany : SUPPORTED_COMPANIES[0].name);

  const initialRole = user?.targetRole || user?.dreamJob || 'Software Development Engineer';

  // Determine initial difficulty from profile baselines
  const initialDifficulty: InterviewDifficulty = 
    user?.dsaLevel === 'Advanced' || user?.csFundamentalsLevel === 'Advanced' ? 'Advanced' :
    user?.dsaLevel === 'Intermediate' || user?.csFundamentalsLevel === 'Intermediate' ? 'Intermediate' : 'Beginner';

  const [config, setConfig] = useState<InterviewConfig>({
    targetRole: initialRole,
    targetCompany: initialCompany,
    interviewType: 'Technical',
    difficulty: initialDifficulty,
    duration: 'standard',
  });

  // Track if selected company is supported in preparation database
  const isSupportedCompany = InterviewEngine.isCompanySupported(config.targetCompany);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeStream]);

  // Handle stream ready from device check
  const handleDeviceCheckReady = (stream: MediaStream | null) => {
    setActiveStream(stream);
    setCurrentStep('in_session');
  };

  // Handle interview completion
  const handleInterviewComplete = (report: InterviewReport) => {
    setCurrentReport(report);
    setCurrentStep('report');

    // Save to performance store history
    saveMockInterviewSession({
      id: report.id,
      date: new Date().toISOString(),
      role: report.config.targetRole,
      company: report.config.targetCompany,
      type: report.config.interviewType,
      durationMinutes: report.durationMinutes,
      overallScore: report.overallScore,
      dimensions: report.dimensions,
      questionCount: report.exchanges.length,
      identifiedWeakPoints: report.identifiedWeakPoints.map((w) => w.concept),
    });

    // Record XP and activity progress
    recordProgress?.(80);

    // Stop camera/mic tracks once session is finished
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      setActiveStream(null);
    }
  };

  // Abort / Back to config
  const handleAbort = () => {
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      setActiveStream(null);
    }
    setCurrentStep('config');
  };

  // Retake interview with same config
  const handleRetake = () => {
    setCurrentReport(null);
    setCurrentStep('device_check');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-3 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. SETUP / CONFIGURATION STEP */}
      {currentStep === 'config' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                Phase 2 · Video AI Simulator
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Realistic AI Video Mock Interview
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Experience an authentic online interview. Speak naturally using your microphone, view your live camera preview, hear questions spoken aloud, and receive dynamic follow-ups based on your real responses.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('device_check')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Proceed to Device Check <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Profile Pre-fill Notice */}
          {user && (
            <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Interview context pre-loaded from your verified student profile:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
                <span className="px-2 py-0.5 rounded-md bg-muted font-mono">{user.degree || 'B.Tech'} {user.specialization ? `(${user.specialization})` : ''}</span>
                <span className="px-2 py-0.5 rounded-md bg-muted font-mono">Target: {config.targetRole}</span>
                {user.skills && user.skills.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-muted font-mono">{user.skills.length} Skills Mapped</span>
                )}
              </div>
            </div>
          )}

          {/* Configuration Form Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground">Interview Parameters</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Role */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Target Role
                </label>
                <input
                  type="text"
                  value={config.targetRole}
                  onChange={(e) => setConfig({ ...config, targetRole: e.target.value })}
                  placeholder="e.g. Frontend Engineer, SDE-1, Data Analyst"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Target Company (Controlled from SUPPORTED_COMPANIES) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" /> Target Recruiter / Company
                  </span>
                  {isSupportedCompany ? (
                    <span className="text-[10px] text-emerald-500 font-semibold">Verified Syllabus</span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-semibold">General Role Mode</span>
                  )}
                </label>
                <select
                  value={config.targetCompany}
                  onChange={(e) => setConfig({ ...config, targetCompany: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <optgroup label="Tier 1 — Product & Tech Leaders">
                    {SUPPORTED_COMPANIES.filter((c) => c.tierCategory === 'Tier 1 (Product & Core Tech)').map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Tier 2 — Growth & High-Tech">
                    {SUPPORTED_COMPANIES.filter((c) => c.tierCategory === 'Tier 2 (Growth & Tech Services)').map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Tier 3 — Mass & IT Services">
                    {SUPPORTED_COMPANIES.filter((c) => c.tierCategory === 'Tier 3 (Enterprise & Mass Recruiters)').map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Banking & Finance">
                    {SUPPORTED_COMPANIES.filter((c) => c.tierCategory === 'Financial & Banking').map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Civil Services & Public Sector">
                    {SUPPORTED_COMPANIES.filter((c) => c.tierCategory === 'Civil Services & Public Sector').map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                  <option value="General Role Interview">General Role (Unspecified Company)</option>
                </select>
                {!isSupportedCompany && (
                  <p className="text-[11px] text-muted-foreground">
                    Custom companies will follow standard industry expectations for {config.targetRole} without fabricating proprietary round data.
                  </p>
                )}
              </div>

              {/* Interview Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" /> Interview Type
                </label>
                <select
                  value={config.interviewType}
                  onChange={(e) => setConfig({ ...config, interviewType: e.target.value as InterviewType })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Technical">Technical (Data Structures, Coding Logic, Core CS)</option>
                  <option value="HR / Behavioral">HR / Behavioral (STAR method, Culture & Teamwork)</option>
                  <option value="DSA">DSA Focused (Algorithms, Complexity & Edge Cases)</option>
                  <option value="CS Fundamentals">CS Fundamentals (DBMS, OS, Computer Networks)</option>
                  <option value="Company-specific">Company-Specific Round (Pattern-grounded)</option>
                  <option value="Mixed">Mixed Comprehensive (Technical + Behavioral + Fit)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Difficulty Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as InterviewDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setConfig({ ...config, difficulty: diff })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        config.difficulty === diff
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Session Duration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'short', label: 'Short Sprint', time: '8 mins', qs: '4 questions' },
                    { id: 'standard', label: 'Standard Round', time: '15 mins', qs: '6 questions' },
                    { id: 'extended', label: 'Extended Deep Dive', time: '25 mins', qs: '9 questions' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setConfig({ ...config, duration: dur.id as InterviewDuration })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        config.duration === dur.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-muted/40'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{dur.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{dur.time} · {dur.qs}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep('device_check')}
                className="py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
              >
                Start Pre-Interview Device Check <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Past Sessions History */}
          {mockInterviewHistory && mockInterviewHistory.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Recent Video Interview History
                </h3>
                <span className="text-xs text-muted-foreground">{mockInterviewHistory.length} completed</span>
              </div>

              <div className="divide-y divide-border/60">
                {mockInterviewHistory.slice(0, 5).map((session) => (
                  <div key={session.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {session.role} {session.company ? `(${session.company})` : ''}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {new Date(session.date).toLocaleDateString()} · {session.type} · {session.durationMinutes} min
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                        session.overallScore >= 75 ? 'bg-emerald-500/10 text-emerald-500' :
                        session.overallScore >= 60 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {session.overallScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DEVICE CHECK STEP */}
      {currentStep === 'device_check' && (
        <PreInterviewDeviceCheck
          role={config.targetRole}
          company={config.targetCompany}
          onReady={handleDeviceCheckReady}
          onBack={handleAbort}
        />
      )}

      {/* 3. ACTIVE VIDEO INTERVIEW STAGE */}
      {currentStep === 'in_session' && (
        <InterviewVideoStage
          config={config}
          profile={user}
          activeStream={activeStream}
          onComplete={handleInterviewComplete}
          onAbort={handleAbort}
        />
      )}

      {/* 4. POST-INTERVIEW DETAILED REPORT */}
      {currentStep === 'report' && currentReport && (
        <InterviewReportView
          report={currentReport}
          onRetake={handleRetake}
          onBackToConfig={handleAbort}
        />
      )}
    </div>
  );
}
