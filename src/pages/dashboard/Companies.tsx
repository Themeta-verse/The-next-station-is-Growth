import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import {
  SUPPORTED_COMPANIES,
  searchCompanies,
  computePreparationReadiness,
  type CompanyProfile,
  TIER_DISCLAIMER_TEXT,
} from '@/data/companyPreparationData';
import { analyzeSkillGap } from '@/services/skillGapEngine';
import {
  Building,
  ArrowRight,
  ChevronLeft,
  Target,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function Companies() {
  const navigate = useNavigate();
  const { domain, user, language } = useStationStore();
  const { topicPerformance } = usePerformanceStore();
  const isHi = language === 'hi';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Filter companies from authoritative database
  const filteredCompanies = useMemo(() => {
    return searchCompanies(searchQuery, undefined).filter(c => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'tier1') return c.tierCategory.includes('Tier 1');
      if (selectedCategory === 'tier2') return c.tierCategory.includes('Tier 2');
      if (selectedCategory === 'tier3') return c.tierCategory.includes('Tier 3');
      if (selectedCategory === 'banking') return c.tierCategory.includes('Banking');
      if (selectedCategory === 'civil') return c.tierCategory.includes('Civil');
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const isUnsupported = searchQuery.trim().length > 2 && filteredCompanies.length === 0;

  // Selected company object
  const activeCompany: CompanyProfile | undefined = useMemo(() => {
    if (!selectedCompanyId) return undefined;
    return SUPPORTED_COMPANIES.find(c => c.id === selectedCompanyId);
  }, [selectedCompanyId]);

  // Selected primary role
  const activeRole = activeCompany?.roles[0];

  // Evidence-based readiness
  const readinessResult = useMemo(() => {
    if (!activeCompany || !activeRole) return null;
    return computePreparationReadiness(user, activeCompany, activeRole.role, topicPerformance);
  }, [user, activeCompany, activeRole, topicPerformance]);

  // Role Skill Gap Matrix
  const skillGapResult = useMemo(() => {
    if (!activeCompany || !activeRole || !user) return null;
    return analyzeSkillGap(user, activeCompany.id, activeRole.role);
  }, [user, activeCompany, activeRole]);

  // DETAIL VIEW FOR SELECTED COMPANY
  if (activeCompany && activeRole && readinessResult) {
    const readiness = readinessResult.overallReadinessScore;
    const readinessData = [
      { value: readiness, color: 'hsl(var(--accent))' },
      { value: 100 - readiness, color: 'hsl(var(--muted))' },
    ];

    return (
      <div className="max-w-5xl space-y-6 animate-fade-in" data-testid="company-detail-view">
        <button
          type="button"
          onClick={() => setSelectedCompanyId(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {isHi ? 'सभी कंपनियां' : 'All Supported Companies'}
        </button>

        {/* Company Header */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-2xl font-bold text-accent shrink-0">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{activeCompany.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {activeCompany.tierCategory}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {activeCompany.overview}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Typical Compensation</p>
            <p className="text-xl font-black text-accent">{activeCompany.typicalPackageRange}</p>
          </div>
        </div>

        {/* Tier Disclaimer */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-accent shrink-0" />
          <span>{TIER_DISCLAIMER_TEXT}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Interview Process Stages */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-accent" /> {isHi ? 'साक्षात्कार प्रक्रिया और राउंड्स' : 'Recruitment Stages & Rounds'}
              </h3>
              <div className="space-y-2.5">
                {activeCompany.hiringRounds.map((round, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <span className="w-6 h-6 rounded-lg bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{round}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Highlights */}
            {activeRole.prepHighlights && activeRole.prepHighlights.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3 shadow-sm">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <BookOpen className="w-4 h-4 text-accent" /> {isHi ? 'मुख्य तैयारी फोकस क्षेत्र' : `Key Focus Areas for ${activeRole.role}`}
                </h3>
                <div className="space-y-2">
                  {activeRole.prepHighlights.map((hl, i) => (
                    <div key={i} className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-foreground flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gap Matrix */}
            {skillGapResult && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                    <Brain className="w-4 h-4 text-accent" /> Role Skill Competency Matrix
                  </h3>
                  <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                    {skillGapResult.overallMatchPercentage}% Skill Match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Strong ({skillGapResult.strongSkills.length})
                    </span>
                    {skillGapResult.strongSkills.map(s => (
                      <p key={s.skillName} className="text-[11px] text-muted-foreground truncate">• {s.skillName}</p>
                    ))}
                    {skillGapResult.strongSkills.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">None verified yet</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Work ({skillGapResult.needsImprovementSkills.length})
                    </span>
                    {skillGapResult.needsImprovementSkills.map(s => (
                      <p key={s.skillName} className="text-[11px] text-muted-foreground truncate">• {s.skillName}</p>
                    ))}
                    {skillGapResult.needsImprovementSkills.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">None borderline</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Missing ({skillGapResult.missingSkills.length})
                    </span>
                    {skillGapResult.missingSkills.map(s => (
                      <p key={s.skillName} className="text-[11px] text-muted-foreground truncate">• {s.skillName}</p>
                    ))}
                    {skillGapResult.missingSkills.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">None missing</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Evidence-Based Readiness Gauge */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-3 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isHi ? 'तैयारी संरेखण स्कोर' : 'Preparation Readiness Score'}
              </p>
              <div className="w-36 h-36 mx-auto relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={readinessData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                      {readinessData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">{readiness}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                    {readiness >= 75 ? 'Ready' : readiness >= 50 ? 'Developing' : 'Building'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculated from verified quiz performance, DSA mastery, and profile competencies. No arbitrary odds.
              </p>

              <button
                type="button"
                onClick={() => navigate('/dashboard/quizzes')}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Brain className="w-3.5 h-3.5" /> Bridge Gaps with Quizzes
              </button>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
              <p className="text-xs font-bold text-foreground">Next Action Steps:</p>
              <div className="space-y-2">
                {skillGapResult?.priorityActions.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/40">
                    <ArrowRight className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST / SEARCH VIEW
  return (
    <div className="max-w-5xl space-y-6 animate-fade-in" data-testid="companies-list-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isHi ? 'कंपनियां' : 'Supported Companies'}</h1>
          <p className="text-sm text-muted-foreground">
            {isHi
              ? 'सत्यापित पाठ्यक्रम और भर्ती अपेक्षाओं पर आधारित कंपनियां'
              : 'Evidence-based company preparation profiles with verified recruitment requirements.'}
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supported companies (e.g. Google, TCS, Microsoft, Amazon, Infosys)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {[
            { id: 'all', label: 'All Companies' },
            { id: 'tier1', label: 'Tier 1 (Product)' },
            { id: 'tier2', label: 'Tier 2 (Growth)' },
            { id: 'tier3', label: 'Tier 3 (Enterprise)' },
            { id: 'banking', label: 'Banking & Financial' },
            { id: 'civil', label: 'Civil Services' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedCategory === cat.id
                  ? 'bg-accent text-accent-foreground font-semibold border-accent'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unsupported Company Notice */}
      {isUnsupported && (
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-base text-foreground">Company Not Currently Supported</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Growth Station does not fabricate company hiring statistics or invent preparation syllabi for companies outside our verified dataset.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                navigate('/dashboard/weekly');
              }}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 shadow-sm"
            >
              Use General Role Preparation
            </button>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredCompanies.map((comp) => {
          const readiness = user
            ? computePreparationReadiness(user, comp, comp.roles[0]?.role || '', topicPerformance).overallReadinessScore
            : 0;

          return (
            <div
              key={comp.id}
              className="bg-card rounded-2xl border border-border p-6 hover:border-accent/50 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-xl shrink-0">
                    🏢
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    {comp.tierCategory.split(' ')[0]}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">{comp.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {comp.overview}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Typical Package:</span>
                  <span className="font-bold text-accent">{comp.typicalPackageRange}</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1 font-semibold">
                    <span>Preparation Readiness</span>
                    <span className="text-foreground font-bold">{readiness}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${readiness}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompanyId(comp.id)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors pt-2"
                >
                  <span>{isHi ? 'विवरण और रोडमैप देखें' : 'View Syllabus & Gaps'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
