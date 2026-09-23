import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, BookOpen, ArrowRight, RotateCcw, 
  Sparkles, ExternalLink, HelpCircle, Volume2, ShieldCheck, 
  Clock, Gauge, MessageCircle, BarChart3, ChevronDown, ChevronUp, 
  PlusCircle, Check, Award, Lightbulb
} from 'lucide-react';
import { 
  InterviewReport, 
  InterviewExchange, 
  IdentifiedWeakPoint 
} from '@/services/interviewEngine';
import { useStationStore } from '@/store/useStationStore';
import { 
  findCurriculumForTopic, 
  LearningCurriculumItem 
} from '@/data/learningCurriculum';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InterviewReportViewProps {
  report: InterviewReport;
  onRetake: () => void;
  onBackToConfig: () => void;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  report,
  onRetake,
  onBackToConfig,
}) => {
  const navigate = useNavigate();
  const { addWeakPoint } = useStationStore();

  const [expandedExchanges, setExpandedExchanges] = useState<Record<string, boolean>>({
    [report.exchanges[0]?.id || '0']: true, // First expanded by default
  });
  const [activeStudyItem, setActiveStudyItem] = useState<LearningCurriculumItem | null>(null);
  const [savedWeakPoints, setSavedWeakPoints] = useState<Record<string, boolean>>({});

  const toggleExchange = (id: string) => {
    setExpandedExchanges((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveWeakPoint = (wp: IdentifiedWeakPoint) => {
    addWeakPoint(wp.concept);
    setSavedWeakPoints((prev) => ({ ...prev, [wp.concept]: true }));
    toast.success(`Saved "${wp.concept}" to your Weakness Detector.`);
  };

  const handleOpenStudySheet = (topicOrConcept: string) => {
    const item = findCurriculumForTopic(topicOrConcept);
    setActiveStudyItem(item);
  };

  const dimensions = [
    { label: 'Technical Depth', value: report.dimensions.technicalKnowledge, desc: 'Accuracy, depth, and domain command' },
    { label: 'Problem Solving', value: report.dimensions.problemSolving, desc: 'Approach, trade-offs, and edge-case agility' },
    { label: 'Communication Clarity', value: report.dimensions.communicationClarity, desc: 'Articulation, vocal pacing, and conciseness' },
    { label: 'Answer Structure', value: report.dimensions.answerStructure, desc: 'STAR format, systematic reasoning progression' },
    { label: 'Company Fit', value: report.dimensions.companyRecruiterFit, desc: 'Alignment with target syllabus expectations' },
    { label: 'Composure & Fluency', value: report.dimensions.composureAndPacing, desc: 'Filler word control and speech confidence' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 pb-16">
      {/* Top Banner / Overall Score */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                Interview Performance Audit
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {report.config.interviewType}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              {report.config.targetRole} {report.config.targetCompany ? `@ ${report.config.targetCompany}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {report.actionableSummary}
            </p>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-border min-w-[130px]">
              <span className="text-xs uppercase font-medium text-muted-foreground">Overall Score</span>
              <span className={`text-4xl font-black mt-1 ${
                report.overallScore >= 75 ? 'text-emerald-500' : report.overallScore >= 60 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {report.overallScore}%
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {report.overallScore >= 75 ? 'Strong Candidate' : report.overallScore >= 60 ? 'Competitive' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        {/* Objective Speech Signals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> Speaking Pacing
            </span>
            <div className="text-base font-bold text-foreground mt-1">
              {report.metrics.wordsPerMinute} <span className="text-xs font-normal text-muted-foreground">WPM</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {report.metrics.wordsPerMinute >= 110 && report.metrics.wordsPerMinute <= 160 ? 'Optimal pace' : 'Fast or hesitant'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-primary" /> Filler Word Count
            </span>
            <div className="text-base font-bold text-foreground mt-1">
              {report.metrics.fillerWordCount} <span className="text-xs font-normal text-muted-foreground">words</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {report.metrics.fillerWordCount <= 4 ? 'High composure' : 'Work on silent pauses'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-primary" /> Total Spoken Words
            </span>
            <div className="text-base font-bold text-foreground mt-1">
              {report.metrics.totalWordsSpoken} <span className="text-xs font-normal text-muted-foreground">words</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Across {report.metrics.questionsAnswered} questions
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-primary" /> Session Duration
            </span>
            <div className="text-base font-bold text-foreground mt-1">
              {report.durationMinutes} <span className="text-xs font-normal text-muted-foreground">min</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {report.config.duration} mode
            </span>
          </div>
        </div>

        {report.metrics.fillerWordsDetected.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="text-[11px] font-medium">Detected filler words:</span>
            {report.metrics.fillerWordsDetected.map((w, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px]">
                "{w}"
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Dimensional Competency Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Multi-Dimensional Evaluation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{dim.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(dim.value)}`}>
                  {dim.value}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dim.value >= 75 ? 'bg-emerald-500' : dim.value >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${dim.value}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                {dim.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CLOSED LEARNING LOOP: Actionable Weak Points */}
      {report.identifiedWeakPoints && report.identifiedWeakPoints.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Closed Learning Loop
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Identified Preparation Gaps & Study Actions
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              These items update your personalized readiness roadmap
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.identifiedWeakPoints.map((wp, idx) => {
              const isSaved = savedWeakPoints[wp.concept];
              return (
                <div key={idx} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">{wp.concept}</span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        wp.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        wp.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {wp.severity} priority
                      </span>
                    </div>
                    <span className="text-xs text-primary font-medium block">
                      Category: {wp.category}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {wp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <button
                      onClick={() => handleOpenStudySheet(wp.studyTopic || wp.concept)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-primary" /> Study Concept
                    </button>
                    <button
                      onClick={() => handleSaveWeakPoint(wp)}
                      disabled={isSaved}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isSaved 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added to Detector
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Save Weakness
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question-by-Question Deep Dive Analysis */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" /> Question-by-Question Breakdown
        </h2>

        <div className="space-y-3">
          {report.exchanges.map((ex, idx) => {
            const isExpanded = !!expandedExchanges[ex.id];
            const analysis = ex.analysis;

            return (
              <div 
                key={ex.id || idx} 
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all"
              >
                {/* Header / Question Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleExchange(ex.id)}
                  className="w-full p-4 md:p-5 flex items-start justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase font-semibold">
                        {ex.stage}
                      </span>
                      {analysis?.assessedSkill && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                          {analysis.assessedSkill}
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:text-base font-semibold text-foreground leading-snug">
                      "{ex.question}"
                    </p>
                  </div>

                  <div className="p-1 rounded-lg border border-border text-muted-foreground mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 md:p-5 pt-0 border-t border-border/60 space-y-4 text-xs md:text-sm">
                    {/* Candidate Transcript */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Your Spoken Answer
                      </span>
                      <p className="italic text-foreground leading-relaxed">
                        "{ex.answerTranscript || 'No response recorded.'}"
                      </p>
                    </div>

                    {analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* What was good */}
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> What Was Strong
                          </span>
                          <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
                            {analysis.strengths.map((s, sIdx) => (
                              <li key={sIdx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* What was missing */}
                        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> What Was Missing or Imprecise
                          </span>
                          <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
                            {analysis.weaknesses.map((w, wIdx) => (
                              <li key={wIdx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Technical Correction & Exemplar Answer */}
                    {analysis?.modelAnswer && (
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4" /> Recommended Model Answer
                        </span>
                        <p className="text-xs text-foreground leading-relaxed">
                          {analysis.modelAnswer}
                        </p>
                        {analysis.technicalCorrection && (
                          <p className="text-[11px] text-muted-foreground border-t border-primary/10 pt-2 mt-2">
                            <strong>Technical Guidance:</strong> {analysis.technicalCorrection}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quick Study CTA */}
                    {analysis?.studyTopic && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Study recommended topic: <strong className="text-foreground">{analysis.studyTopic}</strong>
                        </span>
                        <button
                          onClick={() => handleOpenStudySheet(analysis.studyTopic)}
                          className="py-1 px-3 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-primary" /> Review Notes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Concept Study Modal */}
      {activeStudyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeStudyItem.category}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">
                  {activeStudyItem.topicName}
                </h3>
              </div>
              <button
                onClick={() => setActiveStudyItem(null)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Core Concepts */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Core Concept Breakdown
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground">
                {activeStudyItem.conceptSummary.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Misconception */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Common Interview Misconception:
              </span>
              <p className="text-foreground/90">{activeStudyItem.misconception}</p>
            </div>

            {/* Curated Resources */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Curated Authoritative Resources
              </h4>
              <div className="space-y-2">
                {activeStudyItem.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 text-xs block group"
                  >
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {res.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {res.source} · {res.duration} · {res.level}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setActiveStudyItem(null)}
                className="py-2 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
              >
                Close Study Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation CTAs */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBackToConfig}
          className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/60 text-xs font-semibold transition-colors"
        >
          Change Role / Settings
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/weakness')}
            className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> View Weakness Detector
          </button>
          <button
            onClick={onRetake}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake Mock Interview
          </button>
        </div>
      </div>
    </div>
  );
};
