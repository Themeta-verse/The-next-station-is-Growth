import { useNavigate } from 'react-router-dom';
import { useStationStore, type StudentSkill } from '@/store/useStationStore';
import {
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Brain,
  CheckCircle2,
  Award,
} from 'lucide-react';

export default function StudentSkillProfile() {
  const navigate = useNavigate();
  const { user } = useStationStore();

  const skills: StudentSkill[] = user?.skills || [];
  const weakPoints = user?.weakPoints || [];
  const baseline = user?.baselineAssessment;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Verified Competency & Skill Matrix
            </h3>
            {user?.personalityTrait && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold border border-accent/20">
                {user.personalityTrait}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Differentiating your self-reported familiarity from objective assessed mastery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/baseline')}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {baseline ? 'Retake Diagnostic' : 'Take Baseline Diagnostic'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Assessed Baseline</p>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            {baseline ? `${baseline.score}%` : 'Pending'}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {baseline?.assessedLevel || 'Self-Reported Only'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Tracked Skills</p>
          <p className="text-base font-extrabold text-foreground mt-0.5">{skills.length}</p>
          <span className="text-[10px] text-muted-foreground">Languages & Tech</span>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Target Role</p>
          <p className="text-sm font-bold text-foreground mt-0.5 truncate">
            {user?.targetRole || user?.dreamJob || 'SDE-1'}
          </p>
          <span className="text-[10px] text-accent truncate block">
            {user?.dreamCompany || 'Target Tech'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Weak Points</p>
          <p className="text-base font-extrabold text-amber-500 mt-0.5">{weakPoints.length}</p>
          <span className="text-[10px] text-muted-foreground">Needs Reinforcement</span>
        </div>
      </div>

      {/* Skills Table / List with Dual Level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          <span>Skill & Category</span>
          <span>Self-Reported vs. Assessed</span>
        </div>

        {skills.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground space-y-2">
            <p>No skills recorded yet. Complete onboarding or add skills in your Profile.</p>
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="text-accent underline font-semibold"
            >
              Update Profile Skills
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => {
              const isWeak = weakPoints.some(
                (w) => w.toLowerCase() === skill.name.toLowerCase()
              );
              const hasAssessed = Boolean(skill.assessedLevel);

              return (
                <div
                  key={skill.name}
                  className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    {isWeak ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : hasAssessed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Brain className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{skill.name}</span>
                        {isWeak && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 font-bold">
                            Weak Point
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {skill.category || 'core'}
                        </span>
                        {skill.evidence && skill.evidence.length > 0 && (
                          <span className="text-[9px] text-accent">
                            • Verified via {skill.evidence[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual Level Comparison */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Self-Reported</p>
                      <p className="text-xs font-semibold text-foreground">
                        {skill.selfReportedLevel || skill.proficiency || 'Intermediate'}
                      </p>
                    </div>

                    <div className="w-px h-6 bg-border" />

                    <div className="text-right min-w-[70px]">
                      <p className="text-[10px] text-muted-foreground">Assessed</p>
                      {skill.assessedLevel ? (
                        <p className="text-xs font-bold text-emerald-500">
                          {skill.assessedLevel} {skill.score ? `(${skill.score}%)` : ''}
                        </p>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Not verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weak Points Remediation Strip */}
      {weakPoints.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Target Weak Areas:</strong> {weakPoints.slice(0, 3).join(', ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/vault')}
            className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1 shrink-0"
          >
            Review Formulas & Notes <ArrowRight className="w-3.5 h-3.5 text-accent" />
          </button>
        </div>
      )}
    </div>
  );
}
