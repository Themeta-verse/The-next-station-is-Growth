import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore, type SkillProficiency } from '@/store/useStationStore';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface DiagnosticQuestion {
  id: string;
  category: string;
  skillTested: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'dsa-1',
    category: 'Data Structures & Algorithms',
    skillTested: 'Data Structures & Algorithms',
    question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (BST) of n elements?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'In a balanced BST, each comparison halves the search space, yielding O(log n) average and worst-case time complexity.',
    difficulty: 'Easy',
  },
  {
    id: 'dsa-2',
    category: 'Data Structures & Algorithms',
    skillTested: 'Data Structures & Algorithms',
    question: 'Which data structure is ideal for implementing LRU (Least Recently Used) cache with O(1) get and put operations?',
    options: ['Stack + Array', 'Doubly Linked List + Hash Map', 'Binary Heap + Array', 'Queue + Balanced Tree'],
    correctIndex: 1,
    explanation: 'A Hash Map provides O(1) lookup, while a Doubly Linked List allows O(1) removal and insertion of recently used nodes.',
    difficulty: 'Medium',
  },
  {
    id: 'prog-1',
    category: 'Core Programming',
    skillTested: 'Problem Solving',
    question: 'In object-oriented programming, which principle allows a child class to provide a specific implementation of a method that is already provided by its parent class?',
    options: ['Encapsulation', 'Abstraction', 'Method Overriding (Polymorphism)', 'Multiple Inheritance'],
    correctIndex: 2,
    explanation: 'Method overriding is runtime polymorphism where a subclass provides its own specific implementation of an inherited parent method.',
    difficulty: 'Easy',
  },
  {
    id: 'dbms-1',
    category: 'Database Management',
    skillTested: 'SQL / DBMS',
    question: 'Which ACID property guarantees that once a transaction completes successfully, changes are permanently saved even if a system crashes immediately after?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctIndex: 3,
    explanation: 'Durability ensures that committed transaction state survives system crashes, power failures, or OS crashes via write-ahead logging.',
    difficulty: 'Medium',
  },
  {
    id: 'os-1',
    category: 'Operating Systems',
    skillTested: 'Operating Systems',
    question: 'Which of the following is NOT one of Coffman’s four necessary conditions for a Deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption allowed', 'Circular Wait'],
    correctIndex: 2,
    explanation: 'The condition is NO preemption (resources cannot be forcibly taken away). If preemption is allowed, deadlock cannot occur.',
    difficulty: 'Medium',
  },
  {
    id: 'net-1',
    category: 'Computer Networks',
    skillTested: 'Computer Networks',
    question: 'During a TCP 3-way handshake to establish a connection, what is the exact packet exchange sequence?',
    options: ['SYN → ACK → SYN-ACK', 'SYN → SYN-ACK → ACK', 'ACK → SYN → ACK-SYN', 'PING → PONG → ACK'],
    correctIndex: 1,
    explanation: 'Client sends SYN, server responds with SYN-ACK, and client completes handshake by replying with ACK.',
    difficulty: 'Easy',
  },
];

export default function BaselineAssessment() {
  const navigate = useNavigate();
  const { user, updateSkillEvidence, setBaselineAssessment, updateUserReadinessLevels } = useStationStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQ = DIAGNOSTIC_QUESTIONS[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;

  const handleSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};
    const skillScores: Record<string, { correct: number; total: number }> = {};

    DIAGNOSTIC_QUESTIONS.forEach((q, idx) => {
      const isCorrect = selectedAnswers[idx] === q.correctIndex;
      if (isCorrect) correctCount += 1;

      // Category breakdown
      if (!categoryScores[q.category]) categoryScores[q.category] = { correct: 0, total: 0 };
      categoryScores[q.category].total += 1;
      if (isCorrect) categoryScores[q.category].correct += 1;

      // Skill breakdown
      if (!skillScores[q.skillTested]) skillScores[q.skillTested] = { correct: 0, total: 0 };
      skillScores[q.skillTested].total += 1;
      if (isCorrect) skillScores[q.skillTested].correct += 1;
    });

    const overallPct = Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100);

    const mapPctToProficiency = (pct: number): SkillProficiency => {
      if (pct >= 80) return 'Advanced';
      if (pct >= 60) return 'Intermediate';
      return 'Beginner';
    };

    // Update individual skill evidence
    const skillBreakdown: Record<string, SkillProficiency> = {};
    Object.entries(skillScores).forEach(([skill, data]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      const proficiency = mapPctToProficiency(pct);
      skillBreakdown[skill] = proficiency;
      updateSkillEvidence(skill, proficiency, pct, 'Baseline Diagnostic');
    });

    // Update general readiness levels
    const dsaPct = categoryScores['Data Structures & Algorithms']
      ? Math.round((categoryScores['Data Structures & Algorithms'].correct / categoryScores['Data Structures & Algorithms'].total) * 100)
      : overallPct;
    const csPct = (
      (categoryScores['Database Management']?.correct || 0) +
      (categoryScores['Operating Systems']?.correct || 0) +
      (categoryScores['Computer Networks']?.correct || 0)
    ) / 3 * 100;

    updateUserReadinessLevels({
      dsaLevel: mapPctToProficiency(dsaPct),
      csFundamentalsLevel: mapPctToProficiency(csPct),
    });

    // Store baseline result
    setBaselineAssessment({
      completedAt: new Date().toISOString(),
      score: overallPct,
      skillBreakdown,
      assessedLevel: mapPctToProficiency(overallPct),
    });

    setIsSubmitted(true);
  };

  const correctCount = DIAGNOSTIC_QUESTIONS.filter((q, idx) => selectedAnswers[idx] === q.correctIndex).length;
  const overallPct = Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Evidence-Based Assessment
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Adaptive Baseline Diagnostic
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Growth Station measures your actual preparation through objective problem solving.
              This calibrates your roadmap and differentiates self-reported comfort from assessed mastery.
            </p>
          </div>
          {user?.baselineAssessment && !isSubmitted && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 px-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Previous Diagnostic</p>
                <p className="text-sm font-bold text-white">{user.baselineAssessment.score}% ({user.baselineAssessment.assessedLevel})</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isSubmitted ? (
        /* Active Quiz Interface */
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Progress Bar & Meta */}
          <div className="flex items-center justify-between text-xs text-gray-400 pb-4 border-b border-gray-800">
            <span className="font-semibold text-blue-400">
              Question {currentIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[11px]">
                {currentQ.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  currentQ.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : currentQ.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {currentQ.difficulty}
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h2 className="text-lg md:text-xl font-semibold text-white leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between text-sm md:text-base ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-gray-800/40 border-gray-700/60 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Action Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-800">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            {currentIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length < DIAGNOSTIC_QUESTIONS.length}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
              >
                Complete Diagnostic
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-800">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Diagnostic Complete
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Your Assessed Baseline: {overallPct}%
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {overallPct >= 75
                    ? 'Strong foundation across core problem solving and fundamentals.'
                    : overallPct >= 50
                    ? 'Solid start with clear target improvement areas identified.'
                    : 'Foundational gaps detected. Targeted drills have been added to your Today Focus.'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                  <p className="text-xs text-gray-400">Score</p>
                  <p className="text-2xl font-extrabold text-blue-400">
                    {correctCount}/{DIAGNOSTIC_QUESTIONS.length}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                  <p className="text-xs text-gray-400">Verified Level</p>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {overallPct >= 80 ? 'Advanced' : overallPct >= 60 ? 'Intermediate' : 'Beginner'}
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison: Self-Reported vs Assessed */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Self-Reported vs. Evidence-Based Assessed Level
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <span className="text-xs text-blue-400 font-medium">Self-Reported Comfort</span>
                  <p className="text-base font-semibold text-white mt-1">
                    {user?.dsaLevel || 'Intermediate'} (DSA) / {user?.csFundamentalsLevel || 'Beginner'} (CS Core)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Entered during onboarding or profile editing.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 font-medium">Verified Diagnostic Evidence</span>
                  <p className="text-base font-semibold text-white mt-1">
                    {overallPct >= 80 ? 'Advanced' : overallPct >= 60 ? 'Intermediate' : 'Beginner'} ({overallPct}% Accuracy)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Backed by {DIAGNOSTIC_QUESTIONS.length} objective technical problem checkpoints.
                  </p>
                </div>
              </div>
            </div>

            {/* Question by question feedback */}
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-semibold text-gray-300">Detailed Question Breakdown</h3>
              <div className="space-y-3">
                {DIAGNOSTIC_QUESTIONS.map((q, idx) => {
                  const isCorrect = selectedAnswers[idx] === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-sm ${
                        isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-rose-500/5 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="font-semibold text-white">{q.category}</span>
                            <span className="text-xs text-gray-400">• {q.skillTested}</span>
                          </div>
                          <p className="text-gray-300 text-xs">{q.question}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            <span className="font-medium text-gray-300">Explanation:</span> {q.explanation}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Needs Review'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentIndex(0);
                  setSelectedAnswers({});
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Diagnostic
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard/vault')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Review Learning Vault
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20"
                >
                  Go to Personalized Cockpit
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
