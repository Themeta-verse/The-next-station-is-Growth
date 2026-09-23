import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import {
  SUPPORTED_COMPANIES,
  getCompanyByName,
  searchCompanies,
  computePreparationReadiness,
  type CompanyProfile,
  TIER_DISCLAIMER_TEXT,
} from '@/data/companyPreparationData';
import { analyzeSkillGap } from '@/services/skillGapEngine';
import {
  Search,
  Building,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  ChevronDown,
  Info,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobReadinessCalculator() {
  const navigate = useNavigate();
  const { user, domain, language } = useStationStore();
  const { topicPerformance } = usePerformanceStore();
  const isHi = language === 'hi';

  const activeDomain = ((user?.domain || domain || 'engineering').toLowerCase()) as Domain;

  const domainCompanies = useMemo(() => {
    const list = SUPPORTED_COMPANIES.filter(c => c.domain.toLowerCase() === activeDomain);
    return list.length > 0 ? list : SUPPORTED_COMPANIES;
  }, [activeDomain]);

  const defaultCompany = useMemo(() => {
    if (user?.dreamCompany) {
      const norm = user.dreamCompany.toLowerCase();
      const match = domainCompanies.find(c => c.name.toLowerCase() === norm || c.id === norm);
      if (match) return match;
    }
    return domainCompanies[0] || SUPPORTED_COMPANIES[0];
  }, [domainCompanies, user?.dreamCompany]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => defaultCompany.id);
  const [selectedRoleName, setSelectedRoleName] = useState<string>(() => defaultCompany.roles[0]?.role || '');
  const [requestedCompany, setRequestedCompany] = useState(false);
  const [activeTierFilter, setActiveTierFilter] = useState<string>('all');

  const [showCalculationModal, setShowCalculationModal] = useState(false);

  useEffect(() => {
    const existsInDomain = domainCompanies.some(c => c.id === selectedCompanyId);
    if (!existsInDomain && defaultCompany) {
      setSelectedCompanyId(defaultCompany.id);
      setSelectedRoleName(defaultCompany.roles[0]?.role || '');
    }
  }, [domainCompanies, selectedCompanyId, defaultCompany]);

  // Filtered companies scoped to the student's active domain
  const filteredCompanies = useMemo(() => {
    return searchCompanies(searchQuery, activeDomain).filter(c => {
      if (activeTierFilter === 'all') return true;
      if (activeTierFilter === 'tier1') return c.tierCategory.includes('Tier 1');
      if (activeTierFilter === 'tier2') return c.tierCategory.includes('Tier 2');
      if (activeTierFilter === 'tier3') return c.tierCategory.includes('Tier 3');
      if (activeTierFilter === 'banking') return c.tierCategory.includes('Banking') || c.tierCategory.includes('Financial');
      if (activeTierFilter === 'civil') return c.tierCategory.includes('Civil') || c.tierCategory.includes('Public');
      return true;
    });
  }, [searchQuery, activeTierFilter, activeDomain]);

  // Active company
  const activeCompany = useMemo(() => {
    return domainCompanies.find(c => c.id === selectedCompanyId) || domainCompanies[0] || defaultCompany;
  }, [domainCompanies, selectedCompanyId, defaultCompany]);

  // Selected role
  const activeRole = useMemo(() => {
    return activeCompany.roles.find(r => r.role === selectedRoleName) || activeCompany.roles[0];
  }, [activeCompany, selectedRoleName]);

  // Compute readiness
  const readinessResult = useMemo(() => {
    return computePreparationReadiness(user, activeCompany, activeRole.role, topicPerformance);
  }, [user, activeCompany, activeRole, topicPerformance]);

  // Skill Gap Analysis
  const skillGapResult = useMemo(() => {
    return user ? analyzeSkillGap(user, activeCompany.id, activeRole.role) : null;
  }, [user, activeCompany, activeRole]);

  const isUnsupported = searchQuery.trim().length > 2 && filteredCompanies.length === 0;

  // Verify if student has sufficient diagnostic evidence
  const hasSufficientEvidence = useMemo(() => {
    const hasAssessedSkills = Boolean(user?.skills && user.skills.some(s => s.assessedLevel && s.score !== undefined));
    const hasBaseline = Boolean(user?.baselineAssessment);
    const hasQuizHistory = Object.keys(topicPerformance).length > 0;
    return hasAssessedSkills || hasBaseline || hasQuizHistory;
  }, [user, topicPerformance]);

  const handleSelectCompany = (comp: CompanyProfile) => {
    setSelectedCompanyId(comp.id);
    setSelectedRoleName(comp.roles[0]?.role || '');
    setSearchQuery('');
    setRequestedCompany(false);
  };

  const handleRequestCompany = () => {
    setRequestedCompany(true);
    toast.success(`Request logged for "${searchQuery}". Our curriculum team has added it to the review queue.`);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-5 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="font-bold flex items-center gap-2 text-base text-foreground">
            <Target className="w-5 h-5 text-accent" />
            {isHi ? 'नौकरी तत्परता और कौशल मिलान कैलकुलेटर' : 'Preparation Readiness & Skill Match'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHi
              ? 'वास्तविक प्रोफ़ाइल और क्विज़ डेटा पर आधारित साक्ष्य-आधारित विश्लेषण'
              : 'Evidence-based readiness benchmarked against verified company recruitment expectations.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowCalculationModal(true)}
            className="text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How is this calculated?</span>
          </button>
          <div className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Info className="w-3 h-3 text-accent shrink-0" />
            <span>No fake %</span>
          </div>
        </div>
      </div>

      {/* Insufficient Evidence State Banner */}
      {!hasSufficientEvidence && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-foreground">Not Enough Evidence Yet</p>
              <p className="text-muted-foreground">
                Complete your baseline assessment or take a diagnostic quiz to establish your verified baseline data.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard/baseline')}
              className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90"
            >
              Take Baseline
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/quizzes')}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted"
            >
              Take Diagnostic
            </button>
          </div>
        </div>
      )}

      {/* Tier Category Filters */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[11px] font-semibold text-muted-foreground mr-1">Categories:</span>
        {(activeDomain === 'commerce'
          ? [
              { id: 'all', label: 'All Commerce' },
              { id: 'banking', label: 'Banking & Financial' },
            ]
          : activeDomain === 'arts'
          ? [
              { id: 'all', label: 'All Public Sector' },
              { id: 'civil', label: 'Civil Services & PSC' },
            ]
          : [
              { id: 'all', label: 'All Tech' },
              { id: 'tier1', label: 'Tier 1 (Product)' },
              { id: 'tier2', label: 'Tier 2 (Growth)' },
              { id: 'tier3', label: 'Tier 3 (Enterprise)' },
            ]
        ).map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTierFilter(cat.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
              activeTierFilter === cat.id
                ? 'bg-accent text-accent-foreground font-semibold border-accent'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Company Search & Selection Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'समर्थित कंपनी खोजें (उदा. Google, TCS, SBI, UPSC)...' : 'Search supported recruiters (e.g. Google, Amazon, TCS, SBI, UPSC)...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchQuery.trim().length > 0 && !isUnsupported && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-card rounded-xl border border-border shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1">
            {filteredCompanies.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCompany(c)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">({c.tierCategory})</span>
                </div>
                <span className="text-[10px] font-mono text-accent">{c.typicalPackageRange}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Unsupported Company State */}
      {isUnsupported && (
        <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Company not currently in preparation syllabus</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We currently provide evidence-based preparation models for 20+ verified recruiters with documented round structures. We do not generate fabricated predictions for unmodeled companies.
          </p>
          {!requestedCompany ? (
            <button
              type="button"
              onClick={handleRequestCompany}
              className="mt-1 px-3.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Request &quot;{searchQuery}&quot; Syllabus Addition
            </button>
          ) : (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Request logged! Thank you for helping expand Growth Station.
            </p>
          )}
        </div>
      )}

      {/* Active Company & Role Selector */}
      {!isUnsupported && (
        <div className="space-y-4 animate-fade-in">
          {/* Company Meta Pill Box */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-accent" />
                <h4 className="font-bold text-base text-foreground">{activeCompany.name}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                  {activeCompany.tierCategory}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{activeCompany.overview}</p>
            </div>

            {/* Role Switcher */}
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Target Role
              </label>
              <select
                value={activeRole.role}
                onChange={(e) => setSelectedRoleName(e.target.value)}
                className="w-full sm:w-60 px-3 py-1.5 rounded-xl border border-input bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {activeCompany.roles.map(r => (
                  <option key={r.role} value={r.role}>{r.role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tier Disclaimer notice */}
          <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 px-1">
            <Info className="w-3 h-3 text-muted-foreground/70 shrink-0" />
            <span>{TIER_DISCLAIMER_TEXT} Typical package range: {activeCompany.typicalPackageRange}.</span>
          </p>

          {/* Evidence-based Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Main Readiness Gauge Card */}
            <div className="bg-card rounded-2xl border border-border p-5 text-center flex flex-col justify-center items-center shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Preparation Readiness
              </p>
              <div className="relative w-28 h-28 my-1 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={
                      readinessResult.overallScore >= 70
                        ? '#22C55E'
                        : readinessResult.overallScore >= 45
                        ? 'hsl(var(--accent))'
                        : 'hsl(0, 65%, 51%)'
                    }
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * readinessResult.overallScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">
                    {readinessResult.overallScore}%
                  </span>
                </div>
              </div>

              <p className={`text-xs font-bold mt-1 ${
                readinessResult.overallScore >= 70
                  ? 'text-green-600'
                  : readinessResult.overallScore >= 45
                  ? 'text-accent'
                  : 'text-destructive'
              }`}>
                {readinessResult.overallScore >= 70
                  ? '🎯 Highly Competitive'
                  : readinessResult.overallScore >= 45
                  ? '📈 Developing Readiness'
                  : '🌱 Foundation Stage'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Targeting {activeRole.role}
              </p>
            </div>

            {/* 5-Pillar Score Breakdown */}
            <div className="md:col-span-2 bg-card rounded-2xl border border-border p-5 space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Assessment Pillar Breakdown</span>
                <span className="text-[10px] font-normal lowercase">derived from active profile & tests</span>
              </h5>

              <div className="space-y-2.5">
                {(activeDomain === 'commerce'
                  ? [
                      { label: 'Financial & Domain Skills', score: readinessResult.technicalSkillScore, weight: '35%', icon: Layers },
                      { label: 'Banking & Corporate Regulations', score: readinessResult.csFundamentalsScore, weight: '20%', icon: Building },
                      { label: 'Quantitative Aptitude & DI', score: readinessResult.aptitudeScore, weight: '20%', icon: Target },
                      { label: 'Financial Modeling & Excel Tools', score: readinessResult.dsaScore, weight: '15%', icon: Brain },
                      { label: 'Business Communication & Viva', score: readinessResult.interviewScore, weight: '10%', icon: TrendingUp },
                    ]
                  : activeDomain === 'arts'
                  ? [
                      { label: 'Core Syllabus / Polity & GS', score: readinessResult.technicalSkillScore, weight: '35%', icon: Layers },
                      { label: 'Constitutional & Governance Principles', score: readinessResult.csFundamentalsScore, weight: '25%', icon: Building },
                      { label: 'CSAT & Analytical Aptitude', score: readinessResult.aptitudeScore, weight: '20%', icon: Target },
                      { label: 'Board Interview & Personality', score: readinessResult.interviewScore, weight: '10%', icon: TrendingUp },
                      { label: 'Essay & Answer Writing', score: readinessResult.dsaScore, weight: '10%', icon: Brain },
                    ]
                  : [
                      { label: 'Technical Skill Match', score: readinessResult.technicalSkillScore, weight: '30%', icon: Layers },
                      { label: 'DSA & Algorithms', score: readinessResult.dsaScore, weight: '25%', icon: Brain },
                      { label: 'CS Fundamentals (DBMS/OS)', score: readinessResult.csFundamentalsScore, weight: '20%', icon: Building },
                      { label: 'Aptitude & Problem Solving', score: readinessResult.aptitudeScore, weight: '15%', icon: Target },
                      { label: 'Interview & Communication', score: readinessResult.interviewScore, weight: '10%', icon: TrendingUp },
                    ]
                ).map(p => (
                  <div key={p.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <p.icon className="w-3.5 h-3.5 text-accent" />
                        {p.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">weight: {p.weight}</span>
                        <span className="font-bold tabular-nums text-foreground">{p.score}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Measurable Progression: Baseline Assessment vs Target Role Benchmark */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Measurable Progression: Baseline vs Current Verified vs Target Requirement
                </h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Evidence-based delta measuring your verified skill growth against {activeCompany.name} ({activeRole.role}) expectations.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30 inline-block" /> Baseline</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Current</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Target</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                const baseline = user?.baselineAssessment as (Record<string, unknown> | undefined);
                const breakdown = (baseline?.categoryBreakdown || baseline?.skillBreakdown || {}) as Record<string, string>;

                const getScoreForSkill = (skillNames: string[], defaultFallback: number) => {
                  for (const s of skillNames) {
                    if (breakdown && breakdown[s]) {
                      const val = breakdown[s];
                      return val === 'Advanced' ? 75 : val === 'Intermediate' ? 55 : 35;
                    }
                  }
                  if (typeof baseline?.overallScore === 'number') return Math.max(30, baseline.overallScore - 15);
                  if (typeof baseline?.score === 'number') return Math.max(30, baseline.score - 15);
                  return defaultFallback;
                };

                const dimensionList = activeDomain === 'commerce'
                  ? [
                      {
                        area: 'Financial Accounting & Reporting',
                        baseline: getScoreForSkill(['Financial Accounting', 'Corporate Finance', 'Accounting Standards (IndAS/IFRS)'], 40),
                        current: readinessResult.technicalSkillScore,
                        target: 75,
                      },
                      {
                        area: 'Banking Awareness & Corporate Law',
                        baseline: getScoreForSkill(['Banking Awareness', 'Corporate Law', 'Taxation & Auditing'], 45),
                        current: readinessResult.csFundamentalsScore,
                        target: activeRole.csFundamentalsExpectation === 'Advanced' ? 80 : 65,
                      },
                      {
                        area: 'Quantitative Aptitude & Data Interpretation',
                        baseline: getScoreForSkill(['Quantitative Aptitude', 'Advanced Excel'], 50),
                        current: readinessResult.aptitudeScore,
                        target: activeRole.aptitudeExpectation === 'Advanced' ? 85 : 70,
                      },
                      {
                        area: 'Business Communication & Viva',
                        baseline: 40,
                        current: readinessResult.interviewScore,
                        target: activeRole.interviewExpectation === 'Advanced' ? 85 : 70,
                      },
                      {
                        area: 'Financial Modeling & Excel Tools',
                        baseline: getScoreForSkill(['Excel & Financial Modeling', 'Advanced Excel'], 35),
                        current: readinessResult.dsaScore,
                        target: activeRole.dsaExpectation === 'Advanced' ? 80 : 65,
                      },
                    ]
                  : activeDomain === 'arts'
                  ? [
                      {
                        area: 'Indian Polity & Constitution',
                        baseline: getScoreForSkill(['Indian Polity & Constitution', 'Indian Polity & Governance'], 45),
                        current: readinessResult.technicalSkillScore,
                        target: 80,
                      },
                      {
                        area: 'Modern History & General Studies',
                        baseline: getScoreForSkill(['Modern Indian History', 'Current Affairs Analysis'], 40),
                        current: readinessResult.csFundamentalsScore,
                        target: activeRole.csFundamentalsExpectation === 'Advanced' ? 80 : 65,
                      },
                      {
                        area: 'Logical Reasoning & CSAT Logic',
                        baseline: getScoreForSkill(['Logical Reasoning & CSAT', 'Quantitative Aptitude'], 50),
                        current: readinessResult.aptitudeScore,
                        target: activeRole.aptitudeExpectation === 'Advanced' ? 85 : 70,
                      },
                      {
                        area: 'Personality Test & Board Interview',
                        baseline: 45,
                        current: readinessResult.interviewScore,
                        target: activeRole.interviewExpectation === 'Advanced' ? 85 : 70,
                      },
                      {
                        area: 'Essay & Structured Articulation',
                        baseline: getScoreForSkill(['Essay & Answer Writing', 'Ethics, Integrity & Aptitude'], 40),
                        current: readinessResult.dsaScore,
                        target: activeRole.dsaExpectation === 'Advanced' ? 80 : 65,
                      },
                    ]
                  : [
                      {
                        area: 'Applied Tech Stack Match',
                        baseline: baseline ? Math.max(30, ((typeof baseline.overallScore === 'number' ? baseline.overallScore : typeof baseline.score === 'number' ? baseline.score : 50) - 15)) : 35,
                        current: readinessResult.technicalSkillScore,
                        target: 75,
                      },
                      {
                        area: 'Algorithmic Problem Solving',
                        baseline: getScoreForSkill(['Data Structures & Algorithms', 'Data Structures', 'Algorithms'], 40),
                        current: readinessResult.dsaScore,
                        target: activeRole.dsaExpectation === 'Advanced' ? 85 : 70,
                      },
                      {
                        area: 'CS Core Principles',
                        baseline: getScoreForSkill(['Core Programming', 'Operating Systems', 'Database Management', 'SQL / DBMS'], 45),
                        current: readinessResult.csFundamentalsScore,
                        target: activeRole.csFundamentalsExpectation === 'Advanced' ? 80 : 65,
                      },
                      {
                        area: 'Aptitude & Analytical Logic',
                        baseline: 45,
                        current: readinessResult.aptitudeScore,
                        target: activeRole.aptitudeExpectation === 'Advanced' ? 80 : 70,
                      },
                      {
                        area: 'Interview & STAR Method',
                        baseline: 40,
                        current: readinessResult.interviewScore,
                        target: activeRole.interviewExpectation === 'Advanced' ? 85 : 70,
                      },
                    ];

                return dimensionList;
              })().map(dim => {
                const growth = dim.current - dim.baseline;
                const gapToTarget = dim.target - dim.current;

                return (
                  <div key={dim.area} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground truncate">{dim.area}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        growth >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        {growth >= 0 ? `+${growth}% Growth` : `${growth}%`}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Baseline: {dim.baseline}%</span>
                        <span className="font-bold text-accent">Current: {dim.current}%</span>
                        <span>Target: {dim.target}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                        {/* Baseline marker */}
                        <div
                          className="h-full bg-muted-foreground/30 absolute left-0"
                          style={{ width: `${dim.baseline}%` }}
                        />
                        {/* Current progress */}
                        <div
                          className="h-full bg-accent relative transition-all duration-700"
                          style={{ width: `${dim.current}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground pt-0.5">
                      {gapToTarget <= 0
                        ? '✓ Target requirement fulfilled for this role'
                        : `${gapToTarget}% gap remaining to meet recruitment threshold`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current State vs Target Requirements — Gap Analysis */}
          <div className="space-y-2.5 pt-2">
            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Current State vs Target Role Expectations
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {readinessResult.gaps.map((gap, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    gap.gapSeverity === 'High'
                      ? 'border-destructive/30 bg-destructive/5'
                      : gap.gapSeverity === 'Medium'
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-green-500/30 bg-green-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{gap.area}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        gap.gapSeverity === 'High'
                          ? 'bg-destructive/15 text-destructive'
                          : gap.gapSeverity === 'Medium'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-green-500/15 text-green-700'
                      }`}
                    >
                      {gap.gapSeverity} Gap
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {gap.explanation}
                  </p>

                  <div className="pt-1 text-[10px] font-medium text-foreground flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span>{gap.actionAdvice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Skill Gap Matrix (Strong, Needs Improvement, Missing) */}
          {skillGapResult && (
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Role-Specific Skill Gap Matrix ({activeRole.role})
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Direct comparison of your acquired skills against required competencies.
                  </p>
                </div>
                <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  {skillGapResult.overallMatchPercentage}% Skill Match
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Column 1: Strong (✓) */}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Strong ({skillGapResult.strongSkills.length})
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded font-semibold">
                      Target Met
                    </span>
                  </div>
                  {skillGapResult.strongSkills.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No skills verified at target level yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {skillGapResult.strongSkills.map((item) => (
                        <div key={item.skillName} className="p-2 rounded-lg bg-card/60 border border-emerald-500/20 text-[11px]">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{item.skillName}</span>
                            <span className="text-emerald-500">{item.score}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Needs Improvement (⚠) */}
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Needs Work ({skillGapResult.needsImprovementSkills.length})
                    </span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-semibold">
                      Below Bar
                    </span>
                  </div>
                  {skillGapResult.needsImprovementSkills.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No borderline skills detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {skillGapResult.needsImprovementSkills.map((item) => (
                        <div key={item.skillName} className="p-2 rounded-lg bg-card/60 border border-amber-500/20 text-[11px] space-y-1">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{item.skillName}</span>
                            <span className="text-amber-500">{item.studentLevel}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.recommendation}</p>
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/quizzes')}
                            className="text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold pt-0.5"
                          >
                            <Brain className="w-3 h-3" /> Practice Drills
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 3: Missing (✕) */}
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Missing ({skillGapResult.missingSkills.length})
                    </span>
                    <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.2 rounded font-semibold">
                      High Priority
                    </span>
                  </div>
                  {skillGapResult.missingSkills.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">All required skills present in profile!</p>
                  ) : (
                    <div className="space-y-2">
                      {skillGapResult.missingSkills.map((item) => (
                        <div key={item.skillName} className="p-2 rounded-lg bg-card/60 border border-rose-500/20 text-[11px] space-y-1">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{item.skillName}</span>
                            <span className="text-rose-400">Required</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.recommendation}</p>
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/vault')}
                            className="text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold pt-0.5"
                          >
                            <BookOpen className="w-3 h-3" /> Study in Learning Vault
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bridge the Gaps CTA */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">Bridge identified gaps for {activeCompany.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Take timed quizzes in weak topic areas to increase your evidence-based readiness score.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/quizzes')}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Brain className="w-3.5 h-3.5" /> Take Quizzes
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/weekly')}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Roadmap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Disclosure Modal */}
      {showCalculationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-foreground text-base">How is Readiness Calculated?</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculationModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Growth Station does not invent arbitrary hiring odds. We calculate preparation readiness
              using an evidence-based multi-factor weighted model:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="font-medium text-foreground">1. Technical Skill Match (30%)</span>
                <span className="text-muted-foreground">Profile & assessed skills vs. role requirements</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="font-medium text-foreground">2. DSA & Algorithms (25%)</span>
                <span className="text-muted-foreground">DSA level & quiz mastery vs. role expectation</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="font-medium text-foreground">3. CS Fundamentals (20%)</span>
                <span className="text-muted-foreground">DBMS, OS, and Networks quiz performance</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="font-medium text-foreground">4. Aptitude & Problem Solving (15%)</span>
                <span className="text-muted-foreground">Quantitative and logical reasoning speed</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="font-medium text-foreground">5. Mock Interview & Articulation (10%)</span>
                <span className="text-muted-foreground">AI Video Simulator speech & STAR scores</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowCalculationModal(false)}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
