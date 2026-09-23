import { useState, useMemo } from 'react';
import {
  findCurriculumForTopic,
  type LearningCurriculumItem,
  type LearningResource,
} from '@/data/learningCurriculum';
import {
  getReassessmentCheckpoint,
  evaluateReassessmentAttempt,
  type ReassessmentQuestion,
  type ReassessmentResult,
} from '@/services/learningPathEngine';
import { useStationStore, type SkillProficiency } from '@/store/useStationStore';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Brain,
  Lightbulb,
  Clock,
  Layers,
  HelpCircle,
  PlusCircle,
  Check,
  RotateCcw,
  X,
  GraduationCap,
  ShieldCheck,
  Award,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MissedQuizQuestion {
  q: string;
  topic?: string;
  options: string[];
  correct: number;
  selectedAnswer: number | null;
  explanation?: string;
  section: string;
  company?: string;
  difficulty?: string;
}

interface QuizLearningReportProps {
  missedQuestions: MissedQuizQuestion[];
  quizTopic: string;
  accuracy: number;
  onRetakeTopic?: (topic: string) => void;
}

export default function QuizLearningReport({
  missedQuestions,
  quizTopic,
  accuracy,
  onRetakeTopic,
}: QuizLearningReportProps) {
  const { user, addWeakPoint, updateSkillEvidence, language } = useStationStore();
  const isHi = language === 'hi';

  const [activeStudyItem, setActiveStudyItem] = useState<LearningCurriculumItem | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  // Reassessment checkpoint modal state
  const [activeCheckpointTopic, setActiveCheckpointTopic] = useState<string | null>(null);
  const [checkpointQuestions, setCheckpointQuestions] = useState<ReassessmentQuestion[]>([]);
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, number>>({});
  const [checkpointResult, setCheckpointResult] = useState<ReassessmentResult | null>(null);
  const [clearedTopics, setClearedTopics] = useState<Record<string, boolean>>({});

  // Helper to determine assessed level for a given topic
  const getAssessedLevelForTopic = (topicName: string): SkillProficiency => {
    const studentSkill = user?.skills?.find(
      s =>
        s.name.toLowerCase() === topicName.toLowerCase() ||
        topicName.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(topicName.toLowerCase())
    );
    return studentSkill?.assessedLevel || studentSkill?.selfReportedLevel || 'Beginner';
  };

  // Group missed questions by curriculum item
  const curriculumGaps = useMemo(() => {
    if (missedQuestions.length === 0) return [];

    const map = new Map<string, { curriculum: LearningCurriculumItem; questions: MissedQuizQuestion[] }>();

    missedQuestions.forEach(q => {
      const topic = q.topic || quizTopic;
      const curriculum = findCurriculumForTopic(topic, q.q);
      const existing = map.get(curriculum.id);
      if (existing) {
        existing.questions.push(q);
      } else {
        map.set(curriculum.id, { curriculum, questions: [q] });
      }
    });

    return Array.from(map.values());
  }, [missedQuestions, quizTopic]);

  const handleAddTask = (topicName: string, id: string) => {
    addWeakPoint(topicName);
    setAddedTasks(prev => ({ ...prev, [id]: true }));
    toast.success(`"${topicName}" added to your target focus areas and profile weak points.`);
  };

  // Start checkpoint quiz for a topic
  const handleOpenCheckpoint = (topicName: string) => {
    const questions = getReassessmentCheckpoint(topicName);
    setCheckpointQuestions(questions);
    setCheckpointAnswers({});
    setCheckpointResult(null);
    setActiveCheckpointTopic(topicName);
  };

  // Submit checkpoint answers
  const handleSubmitCheckpoint = () => {
    if (!activeCheckpointTopic) return;
    let correct = 0;
    checkpointQuestions.forEach((q, idx) => {
      if (checkpointAnswers[idx] === q.correct) {
        correct += 1;
      }
    });

    const previousLevel = getAssessedLevelForTopic(activeCheckpointTopic);
    const result = evaluateReassessmentAttempt(correct, checkpointQuestions.length, previousLevel);
    setCheckpointResult(result);

    if (result.isMastered) {
      updateSkillEvidence(
        activeCheckpointTopic,
        result.newAssessedLevel,
        result.scorePercentage,
        'Reassessment Checkpoint'
      );
      setClearedTopics(prev => ({ ...prev, [activeCheckpointTopic]: true }));
      toast.success(`Mastery verified for ${activeCheckpointTopic}! Weak point cleared from your profile.`);
    } else {
      toast.error(`Score: ${result.scorePercentage}%. 75% required for mastery. Review the resources and try again.`);
    }
  };

  return (
    <div className="space-y-6 pt-2 animate-fade-in" data-testid="quiz-learning-report">
      {/* Section Header */}
      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              {isHi ? 'लर्निंग रिकवरी और कॉन्सेप्ट प्लान' : 'Diagnostic Learning & Recovery System'}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                {missedQuestions.length === 0 ? 'Mastery Verified' : `${missedQuestions.length} Gaps Diagnosed`}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isHi
                ? 'गलत उत्तरों के आधार पर लक्षित अध्ययन सामग्री, मानसिक मॉडल और पुनर्मूल्यांकन'
                : 'Turn incorrect answers into permanent understanding with curated authoritative resources and verification checkpoints.'}
            </p>
          </div>
        </div>

        {onRetakeTopic && (
          <button
            type="button"
            onClick={() => onRetakeTopic(quizTopic)}
            className="px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isHi ? 'पुनः प्रयास करें' : 'Retake Focused Quiz'}
          </button>
        )}
      </div>

      {/* When 100% Correct / No Mistakes */}
      {missedQuestions.length === 0 && (
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-foreground">Perfect Session! No Conceptual Gaps Found</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You achieved 100% accuracy on this journey. All tested concepts are validated. Advance to higher difficulty platforms or simulate a live AI Video Mock Interview.
          </p>
        </div>
      )}

      {/* Structured Conceptual Learning Cards for Each Gap */}
      {curriculumGaps.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-accent" />
            Structured Concept Recovery Cards (Derived From Failed Questions)
          </h4>

          <div className="space-y-5">
            {curriculumGaps.map(({ curriculum, questions }) => {
              const currentLevel = getAssessedLevelForTopic(curriculum.topicName);
              const isCleared = Boolean(clearedTopics[curriculum.topicName]);

              return (
                <div
                  key={curriculum.id}
                  className={`bg-card rounded-2xl border transition-all p-5 space-y-4 shadow-sm ${
                    isCleared
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border hover:border-accent/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{curriculum.topicName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                          {curriculum.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                          Current Level: {currentLevel}
                        </span>
                        {isCleared ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Mastered & Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                            {questions.length} mistake{questions.length > 1 ? 's' : ''} detected
                          </span>
                        )}
                      </div>

                      {/* WHY YOU MISSED IT (Diagnostic Gap Reason) */}
                      <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 mt-1.5 text-xs text-foreground/90">
                        <p className="font-semibold text-destructive flex items-center gap-1.5 mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Common Trap: Why You Missed It:
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          {curriculum.misconception}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveStudyItem(curriculum)}
                        className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-accent" />
                        Learn Concept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCheckpoint(curriculum.topicName)}
                        className="px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Take Checkpoint
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddTask(curriculum.topicName, curriculum.id)}
                        disabled={Boolean(addedTasks[curriculum.id]) || isCleared}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          addedTasks[curriculum.id] || isCleared
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground border border-border'
                        }`}
                      >
                        {addedTasks[curriculum.id] || isCleared ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added to Focus
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" /> Add Focus Task
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* WHAT TO STUDY: Structured Subtopic Chain */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center flex-wrap gap-2 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1 mr-1">
                      <Layers className="w-3.5 h-3.5 text-accent" /> What to Study:
                    </span>
                    {curriculum.prerequisites.map((prereq, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-background border border-border text-[11px] text-muted-foreground">
                          {prereq}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    ))}
                    <span className="px-2.5 py-0.5 rounded-md bg-accent/15 text-accent font-bold text-[11px] border border-accent/30">
                      Target Objective
                    </span>
                  </div>

                  {/* QUESTION BREAKDOWN PREVIEW */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Session Mistake Analysis:
                    </p>
                    {questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-background border border-border text-xs space-y-2"
                      >
                        <p className="font-semibold text-foreground">{q.q}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              <strong>Your Answer:</strong>{' '}
                              {q.selectedAnswer !== null && q.selectedAnswer >= 0
                                ? q.options[q.selectedAnswer]
                                : 'Time expired / Unanswered'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              <strong>Correct Answer:</strong> {q.options[q.correct]}
                            </span>
                          </div>
                        </div>

                        {q.explanation && (
                          <p className="text-[11px] text-muted-foreground italic border-l-2 border-accent/50 pl-2 mt-1">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CURATED AUTHORITATIVE LEARNING RESOURCES */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-accent" /> Recommended High-Yield Preparation Resources: Curated Evidence-Based Resources
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Authoritative Sources
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {curriculum.resources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-accent/50 transition-all flex flex-col justify-between space-y-2 group shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span className="font-semibold px-2 py-0.5 rounded bg-muted text-foreground flex items-center gap-1">
                                {res.sourceType === 'official_doc' && '🏛️ Doc'}
                                {res.sourceType === 'institution' && '🎓 Institute'}
                                {res.sourceType === 'industry_standard' && '⭐ Standard'}
                                {res.sourceType === 'verified_educator' && '👨‍🏫 Verified'}
                                <span>{res.provider || res.source}</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" /> {res.duration}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors flex items-center justify-between gap-1">
                              <span>{res.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent shrink-0" />
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {res.whyRecommended}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                            <span className="capitalize">{res.type}</span>
                            <span className="font-semibold text-accent">{res.level}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* FOLLOW-UP PRACTICE DRILL */}
                  {curriculum.practiceDrills && curriculum.practiceDrills.length > 0 && (
                    <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-foreground flex items-center gap-1">
                          <Play className="w-3 h-3 text-accent" /> Recommended Follow-up Practice Action:
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {curriculum.practiceDrills[0].prompt}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenCheckpoint(curriculum.topicName)}
                        className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1"
                      >
                        Verify Mastery (Score ≥ 75%) <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REASSESSMENT CHECKPOINT MODAL */}
      {activeCheckpointTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActiveCheckpointTopic(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Verification Checkpoint (≥ 75% to Clear)
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">{activeCheckpointTopic}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheckpointTopic(null)}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions Form */}
            {!checkpointResult ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Answer these targeted diagnostic questions to verify conceptual retention and update your assessed level.
                </p>

                {checkpointQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-muted/20 border border-border space-y-3 text-xs">
                    <p className="font-semibold text-foreground">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = checkpointAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setCheckpointAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
                            }
                            className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center gap-2 ${
                              isSelected
                                ? 'bg-accent/15 border-accent font-semibold text-accent'
                                : 'bg-card border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-mono shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setActiveCheckpointTopic(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={Object.keys(checkpointAnswers).length < checkpointQuestions.length}
                    onClick={handleSubmitCheckpoint}
                    className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 shadow-sm"
                  >
                    Submit Checkpoint
                  </button>
                </div>
              </div>
            ) : (
              /* Checkpoint Result View */
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div
                  className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                    checkpointResult.isMastered
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {checkpointResult.isMastered ? (
                    <Award className="w-8 h-8" />
                  ) : (
                    <AlertTriangle className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">
                    {checkpointResult.isMastered ? 'Mastery Verified!' : 'Checkpoint Not Passed'}
                  </h4>
                  <p className="text-2xl font-black text-accent">{checkpointResult.scorePercentage}%</p>
                  <p className="text-xs text-muted-foreground">
                    {checkpointResult.correctCount} of {checkpointResult.totalQuestions} questions correct
                  </p>
                </div>

                <p className="text-xs text-foreground/90 max-w-sm mx-auto leading-relaxed bg-muted/40 p-3 rounded-xl border border-border">
                  {checkpointResult.feedbackMessage}
                </p>

                <div className="flex justify-center gap-2 pt-3">
                  {!checkpointResult.isMastered ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckpointAnswers({});
                        setCheckpointResult(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90"
                    >
                      Retry Checkpoint
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCheckpointTopic(null)}
                      className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90"
                    >
                      Done & Return to Results
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MASTER STUDY SHEET MODAL */}
      {activeStudyItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActiveStudyItem(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                  {activeStudyItem.category} · Conceptual Master Sheet
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">{activeStudyItem.topicName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveStudyItem(null)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prerequisites */}
            <div>
              <p className="text-xs font-bold text-foreground mb-1.5">Required Prerequisites:</p>
              <div className="flex flex-wrap gap-1.5">
                {activeStudyItem.prerequisites.map((p, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Concepts */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Core Conceptual Breakdown:</p>
              <div className="space-y-2">
                {activeStudyItem.conceptSummary.map((point, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-foreground leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulas or Rules */}
            {activeStudyItem.keyFormulasOrRules && activeStudyItem.keyFormulasOrRules.length > 0 && (
              <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-1.5">
                <p className="text-xs font-bold text-accent uppercase tracking-wide">
                  Formulas & Governing Invariants:
                </p>
                <ul className="text-xs text-foreground/90 space-y-1 font-mono list-disc list-inside">
                  {activeStudyItem.keyFormulasOrRules.map((formula, i) => (
                    <li key={i}>{formula}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practice Drills */}
            {activeStudyItem.practiceDrills && activeStudyItem.practiceDrills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground">Immediate Recovery Practice Drills:</p>
                <div className="space-y-2">
                  {activeStudyItem.practiceDrills.map((drill, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-border bg-background space-y-1.5">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        {drill.prompt}
                      </p>
                      <p className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg italic">
                        <strong>Approach / Hint:</strong> {drill.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 flex justify-between items-center border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setActiveStudyItem(null);
                  handleOpenCheckpoint(activeStudyItem.topicName);
                }}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90"
              >
                Take Verification Checkpoint
              </button>
              <button
                type="button"
                onClick={() => setActiveStudyItem(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Close & Return to Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
