import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useStationStore,
  type Domain,
  type StudentSkill,
  type SkillProficiency,
  type ReadinessLevel,
  type StudentExperience,
  type TopicCompetency,
} from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { formatAuthError } from '@/integrations/supabase/client';
import { SUPPORTED_COMPANIES } from '@/data/companyPreparationData';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Globe,
  Sparkles,
  Loader2,
  AlertCircle,
  GraduationCap,
  Target,
  Code2,
  Brain,
  Briefcase,
  Building,
  Award,
  Plus,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const DOMAIN_SKILL_RECOMMENDATIONS: Record<Domain, Array<{ name: string; category: StudentSkill['category'] }>> = {
  engineering: [
    { name: 'Data Structures & Algorithms', category: 'core' },
    { name: 'Java', category: 'language' },
    { name: 'C++', category: 'language' },
    { name: 'Python', category: 'language' },
    { name: 'SQL / DBMS', category: 'database' },
    { name: 'Operating Systems', category: 'core' },
    { name: 'Computer Networks', category: 'core' },
    { name: 'React', category: 'framework' },
    { name: 'Node.js', category: 'framework' },
    { name: 'System Design', category: 'core' },
  ],
  commerce: [
    { name: 'Financial Modeling', category: 'core' },
    { name: 'Advanced Excel', category: 'tool' },
    { name: 'Corporate Finance', category: 'core' },
    { name: 'Accounting Standards (IndAS/IFRS)', category: 'core' },
    { name: 'Taxation & Auditing', category: 'core' },
    { name: 'Power BI / Tableau', category: 'tool' },
    { name: 'Business Valuation', category: 'core' },
  ],
  arts: [
    { name: 'Indian Polity & Governance', category: 'core' },
    { name: 'Modern Indian History', category: 'core' },
    { name: 'International Relations', category: 'core' },
    { name: 'Quantitative Aptitude', category: 'core' },
    { name: 'Logical Reasoning & CSAT', category: 'core' },
    { name: 'Essay & Answer Writing', category: 'core' },
    { name: 'Current Affairs Analysis', category: 'core' },
  ],
};

const PREPARING_FOR_OPTIONS = [
  'On-Campus Placements',
  'Off-Campus Recruitment Drives',
  'Tech Internship',
  'Government & Civil Services',
  'Higher Studies / GATE / CAT',
];

const JOB_TYPE_OPTIONS = ['Full-time Role', 'Internship', 'Remote / Hybrid'];

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, refreshProfile, recordProgress, updateProfile, hasCompletedOnboarding } = useAuth();
  const {
    user: storeUser,
    domain,
    language,
    login,
    setLanguage,
  } = useStationStore();

  const userName =
    (location.state as { name?: string } | null)?.name ||
    storeUser?.name ||
    authUser?.user_metadata?.name ||
    'Student';

  const isHi = language === 'hi';

  const [step, setStep] = useState(0);
  const totalSteps = 6;
  const [selectedDomain, setSelectedDomain] = useState<Domain>(storeUser?.domain || domain || 'engineering');

  // Step 1: Basic Profile & Academics
  const [form, setForm] = useState({
    city: storeUser?.city || '',
    state: storeUser?.state || '',
    college: storeUser?.college || '',
    degree: storeUser?.degree || 'B.Tech / B.E.',
    specialization: storeUser?.specialization || '',
    year: storeUser?.year || '3rd Year',
    semester: storeUser?.semester || 'Semester 5',
    graduationYear: storeUser?.graduationYear || '2026',
    // Step 2: Career Target
    preparingFor: storeUser?.preparingFor || 'On-Campus Placements',
    targetRole: storeUser?.targetRole || storeUser?.dreamJob || 'Software Development Engineer',
    targetJobType: storeUser?.targetJobType || 'Full-time Role',
    // Step 6: Goal & Package
    dreamCompany: storeUser?.dreamCompany || 'Google',
    targetSalary: storeUser?.targetSalary || '12-18 LPA',
    timeline: storeUser?.timeline || '6',
  });

  // Step 3: Tech Skills
  const [skills, setSkills] = useState<StudentSkill[]>(
    storeUser?.skills && storeUser.skills.length > 0
      ? storeUser.skills
      : [
          { name: 'Data Structures & Algorithms', category: 'core', selfReportedLevel: 'Intermediate', proficiency: 'Intermediate' },
          { name: 'Java', category: 'language', selfReportedLevel: 'Intermediate', proficiency: 'Intermediate' },
          { name: 'SQL / DBMS', category: 'database', selfReportedLevel: 'Beginner', proficiency: 'Beginner' },
        ]
  );
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkillLevel, setCustomSkillLevel] = useState<SkillProficiency>('Intermediate');

  // Step 4: DSA & CS Fundamentals Competency Taxonomy
  const [competencies, setCompetencies] = useState<{
    dsaLevel: ReadinessLevel;
    csFundamentalsLevel: ReadinessLevel;
    aptitudeLevel: ReadinessLevel;
    communicationLevel: ReadinessLevel;
  }>({
    dsaLevel: storeUser?.dsaLevel || 'Intermediate',
    csFundamentalsLevel: storeUser?.csFundamentalsLevel || 'Beginner',
    aptitudeLevel: storeUser?.aptitudeLevel || 'Intermediate',
    communicationLevel: storeUser?.communicationLevel || 'Intermediate',
  });

  // Step 5: Experience & Projects
  const [experience, setExperience] = useState<StudentExperience>({
    projects: storeUser?.experience?.projects || [
      { title: 'Campus Placement Portal', description: 'Full-stack application', techStack: ['React', 'Node.js'] },
    ],
    internships: storeUser?.experience?.internships || [],
    hackathons: storeUser?.experience?.hackathons || ['Smart India Hackathon Participant'],
    githubUrl: storeUser?.experience?.githubUrl || '',
    previousInterviewExperience: storeUser?.experience?.previousInterviewExperience || '',
  });

  // Step 6: Target Companies
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    storeUser?.targetCompanies && storeUser.targetCompanies.length > 0
      ? storeUser.targetCompanies
      : ['Google', 'TCS']
  );

  const [stepError, setStepError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    if (storeUser) {
      setForm((prev) => ({
        ...prev,
        city: prev.city || storeUser.city || '',
        college: prev.college || storeUser.college || '',
        specialization: prev.specialization || storeUser.specialization || '',
        dreamCompany: prev.dreamCompany || storeUser.dreamCompany || 'Google',
        targetRole: prev.targetRole || storeUser.targetRole || storeUser.dreamJob || 'Software Development Engineer',
      }));
      if (storeUser.domain) setSelectedDomain(storeUser.domain);
    }
  }, [storeUser]);

  const domainSupportedCompanies = SUPPORTED_COMPANIES.filter(
    (c) => c.domain === selectedDomain
  );

  const toggleCompany = (compName: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(compName) ? prev.filter((c) => c !== compName) : [...prev, compName]
    );
    if (!form.dreamCompany) {
      setForm((prev) => ({ ...prev, dreamCompany: compName }));
    }
  };

  const toggleSkill = (skillName: string, category: StudentSkill['category']) => {
    setSkills((prev) => {
      const exists = prev.find((s) => s.name === skillName);
      if (exists) {
        return prev.filter((s) => s.name !== skillName);
      }
      return [
        ...prev,
        {
          name: skillName,
          category,
          selfReportedLevel: 'Intermediate',
          proficiency: 'Intermediate',
        },
      ];
    });
  };

  const updateSkillSelfReported = (skillName: string, level: SkillProficiency) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.name === skillName
          ? { ...s, selfReportedLevel: level, proficiency: level }
          : s
      )
    );
  };

  const addCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    const name = customSkillInput.trim();
    if (!skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setSkills((prev) => [
        ...prev,
        {
          name,
          category: 'tool',
          selfReportedLevel: customSkillLevel,
          proficiency: customSkillLevel,
        },
      ]);
    }
    setCustomSkillInput('');
  };

  const removeSkill = (skillName: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
  };

  const validateStep = (currentStep: number): boolean => {
    setStepError('');

    if (currentStep === 0) {
      if (!form.city.trim()) {
        setStepError(isHi ? 'कृपया अपना शहर या क्षेत्र दर्ज करें।' : 'Please enter your city or locality.');
        return false;
      }
      if (!form.college.trim()) {
        setStepError(isHi ? 'कृपया अपने कॉलेज / संस्थान का नाम दर्ज करें।' : 'Please enter your college / institute name.');
        return false;
      }
    } else if (currentStep === 1) {
      if (!form.degree.trim()) {
        setStepError(isHi ? 'कृपया अपनी डिग्री चुनें।' : 'Please select your degree.');
        return false;
      }
      if (!form.specialization.trim()) {
        setStepError(isHi ? 'कृपया अपनी शाखा या विशेषज्ञता दर्ज करें।' : 'Please specify your branch / specialization.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!form.targetRole.trim()) {
        setStepError(isHi ? 'कृपया अपना लक्ष्य पद दर्ज करें।' : 'Please enter your target role.');
        return false;
      }
    } else if (currentStep === 3) {
      if (skills.length === 0) {
        setStepError(isHi ? 'कृपया कम से कम एक कौशल चुनें।' : 'Please select or add at least one technical skill.');
        return false;
      }
    } else if (currentStep === 5) {
      if (selectedCompanies.length === 0 && !form.dreamCompany) {
        setStepError(isHi ? 'कृपया कम से कम एक लक्षित कंपनी चुनें।' : 'Please choose at least one target company.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setStepError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    if (!validateStep(5)) return;

    setIsSaving(true);
    setStepError('');

    try {
      const primaryCompany = form.dreamCompany || 'Google';
      const targetRole = form.targetRole || 'Software Development Engineer';

      const topicCompetencies: Record<string, TopicCompetency> = {
        dsa: { selfReported: competencies.dsaLevel },
        csFundamentals: { selfReported: competencies.csFundamentalsLevel },
        aptitude: { selfReported: competencies.aptitudeLevel },
        communication: { selfReported: competencies.communicationLevel },
      };

      const updatedProfile = {
        name: userName,
        state: form.state,
        city: form.city.trim(),
        college: form.college.trim(),
        domain: selectedDomain,
        degree: form.degree,
        specialization: form.specialization.trim(),
        year: form.year,
        semester: form.semester,
        graduationYear: form.graduationYear,
        preparingFor: form.preparingFor,
        targetRole,
        targetJobType: form.targetJobType,
        targetCompanies: selectedCompanies.length > 0 ? selectedCompanies : [primaryCompany],
        dreamCompany: primaryCompany,
        dreamJob: targetRole,
        targetSalary: form.targetSalary.trim(),
        timeline: form.timeline,
        skills,
        experience,
        topicCompetencies,
        dsaLevel: competencies.dsaLevel,
        csFundamentalsLevel: competencies.csFundamentalsLevel,
        aptitudeLevel: competencies.aptitudeLevel,
        communicationLevel: competencies.communicationLevel,
        personalityScore: storeUser?.personalityScore || { iq: 50, eq: 50, rq: 50 },
        weakPoints: storeUser?.weakPoints || [],
      };

      // 1. Update Zustand store immediately
      login(updatedProfile, {
        score: storeUser?.score && storeUser.score > 0 ? storeUser.score : 100,
        tasksDone: storeUser?.tasksDone && storeUser.tasksDone > 0 ? storeUser.tasksDone : 1,
        streak: storeUser?.streak && storeUser.streak > 0 ? storeUser.streak : 1,
      });

      // 2. Persist to Supabase if authenticated
      if (authUser?.id) {
        const { error: updateErr } = await updateProfile({
          name: userName,
          city: form.city.trim(),
          college: form.college.trim(),
          domain: selectedDomain,
          degree: form.degree,
          specialization: form.specialization.trim(),
          year: form.year,
          semester: form.semester,
          graduation_year: form.graduationYear,
          preparing_for: form.preparingFor,
          target_role: targetRole,
          target_job_type: form.targetJobType,
          target_companies: selectedCompanies.length > 0 ? selectedCompanies : [primaryCompany],
          dream_company: primaryCompany,
          target_salary: form.targetSalary.trim(),
          timeline: form.timeline,
          skills,
          experience,
          topic_competencies: topicCompetencies,
          dsa_level: competencies.dsaLevel,
          cs_fundamentals_level: competencies.csFundamentalsLevel,
          aptitude_level: competencies.aptitudeLevel,
          communication_level: competencies.communicationLevel,
          onboarding_completed: true,
        });

        if (updateErr) {
          throw updateErr;
        }

        await refreshProfile(authUser.id);
        await recordProgress({ scoreDelta: 20, streak: 1 });
      }

      setShowCompletionModal(true);
    } catch (err) {
      const errorMsg = formatAuthError(err);
      setStepError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <div className="w-full max-w-2xl animate-slide-up">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Growth Station</span>
            <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold">
              Step {step + 1} of {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasCompletedOnboarding && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
              >
                <span>{isHi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setLanguage(isHi ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              type="button"
            >
              <Globe className="w-3.5 h-3.5" />
              {isHi ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-accent' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Card Container */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-lg space-y-6">
          {/* Validation Banner */}
          {stepError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 0: Personal & Academic Profile */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Personal & College Details</h2>
                  <p className="text-xs text-muted-foreground">
                    Academic & Institute Profile — Tell us where and what you are studying.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    City / Locality *
                  </label>
                  <input
                    placeholder="e.g., Mumbai, Pune, Bangalore, Hyderabad"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    College / Institute *
                  </label>
                  <input
                    placeholder="e.g., IIT Bombay, COEP, Delhi University"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Degree / Program
                  </label>
                  <select
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className={inputClass}
                  >
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="BCA / MCA">BCA / MCA</option>
                    <option value="B.Sc / M.Sc Computer Science">B.Sc / M.Sc CS</option>
                    <option value="B.Com / M.Com">B.Com / M.Com</option>
                    <option value="BBA / MBA">BBA / MBA</option>
                    <option value="BA / Civil Services Track">BA / Civil Services Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Branch / Specialization *
                  </label>
                  <input
                    placeholder="e.g. Computer Science, AI & ML, E&TC"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Current Year
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className={inputClass}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Graduated">Graduated / Job Seeker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Graduation Year
                  </label>
                  <select
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className={inputClass}
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Academic & Domain Track */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Academic & Domain Track</h2>
                  <p className="text-xs text-muted-foreground">
                    Select your focus domain and academic track.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Career Domain
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['engineering', 'commerce', 'arts'] as Domain[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDomain(d)}
                      className={`p-4 rounded-xl border text-left transition ${
                        selectedDomain === d
                          ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <span className="font-semibold text-sm capitalize block text-foreground">
                        {d === 'engineering' ? 'Engineering & Tech' : d === 'commerce' ? 'Commerce & Finance' : 'Civil & Humanities'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {d === 'engineering' ? 'SDE, Cloud, Data, AI' : d === 'commerce' ? 'Finance, Analytics, Audit' : 'Govt Exams, Policy, UPSC'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Semester
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className={inputClass}
                  >
                    {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Career Target */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Career Target & Role</h2>
                  <p className="text-xs text-muted-foreground">
                    Define what you are targeting so we calibrate your roadmap.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Preparation Target *
                  </label>
                  <select
                    value={form.preparingFor}
                    onChange={(e) => setForm({ ...form, preparingFor: e.target.value })}
                    className={inputClass}
                  >
                    {PREPARING_FOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Target Role *
                  </label>
                  <input
                    placeholder="e.g. Software Development Engineer, Data Analyst, Cloud DevOps"
                    value={form.targetRole}
                    onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Job Type Preference
                  </label>
                  <select
                    value={form.targetJobType}
                    onChange={(e) => setForm({ ...form, targetJobType: e.target.value })}
                    className={inputClass}
                  >
                    {JOB_TYPE_OPTIONS.map((jt) => (
                      <option key={jt} value={jt}>{jt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Technical Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Skills & Tech Stack</h2>
                  <p className="text-xs text-muted-foreground">
                    Select skills you know and indicate your self-reported proficiency.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Recommended for your domain (Click to add/remove)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(DOMAIN_SKILL_RECOMMENDATIONS[selectedDomain] || []).map((sk) => {
                      const isSelected = skills.some((s) => s.name === sk.name);
                      return (
                        <button
                          key={sk.name}
                          type="button"
                          onClick={() => toggleSkill(sk.name, sk.category)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-accent text-accent-foreground shadow-sm'
                              : 'bg-muted/40 border border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {sk.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Skill Input */}
                <div className="flex gap-2">
                  <input
                    placeholder="Add custom skill (e.g. Flutter, Kubernetes)"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                    className={inputClass}
                  />
                  <select
                    value={customSkillLevel}
                    onChange={(e) => setCustomSkillLevel(e.target.value as SkillProficiency)}
                    className="px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Selected Skills List with Proficiencies */}
                {skills.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">
                      Selected Skills ({skills.length}) & Self-Reported Level
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {skills.map((sk) => (
                        <div key={sk.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border text-xs">
                          <span className="font-semibold text-foreground">{sk.name}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={sk.selfReportedLevel || sk.proficiency}
                              onChange={(e) => updateSkillSelfReported(sk.name, e.target.value as SkillProficiency)}
                              className="px-2 py-1 rounded-lg border border-input bg-background text-foreground text-xs"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeSkill(sk.name)}
                              className="p-1 text-muted-foreground hover:text-destructive transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Competencies & Readiness Levels */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Core Competencies Self-Rating</h2>
                  <p className="text-xs text-muted-foreground">
                    Rate your comfort in core areas. We calibrate interview questions accordingly.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { key: 'dsaLevel', label: 'Data Structures & Algorithms', desc: 'Arrays, Trees, Graphs, DP' },
                  { key: 'csFundamentalsLevel', label: 'Computer Science Fundamentals', desc: 'OS, DBMS, Networks, OOP' },
                  { key: 'aptitudeLevel', label: 'Quantitative & Logical Aptitude', desc: 'Puzzles, Speed Math, Reasoning' },
                  { key: 'communicationLevel', label: 'Communication & Behavioral Interviewing', desc: 'STAR method, fluency, confidence' },
                ].map((item) => (
                  <div key={item.key} className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-xs text-foreground block">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                      </div>
                      <select
                        value={competencies[item.key as keyof typeof competencies]}
                        onChange={(e) => setCompetencies({ ...competencies, [item.key]: e.target.value as ReadinessLevel })}
                        className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs font-medium"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Experience & Projects */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Projects, Target Recruiters & Package</h2>
                  <p className="text-xs text-muted-foreground">
                    Final calibration — portfolio links, target companies, and salary goals.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      GitHub Profile URL
                    </label>
                    <input
                      placeholder="https://github.com/your-handle"
                      value={experience.githubUrl || ''}
                      onChange={(e) => setExperience({ ...experience, githubUrl: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Target Salary Package
                    </label>
                    <select
                      value={form.targetSalary}
                      onChange={(e) => setForm({ ...form, targetSalary: e.target.value })}
                      className={inputClass}
                    >
                      <option value="4-8 LPA">4 - 8 LPA</option>
                      <option value="8-15 LPA">8 - 15 LPA</option>
                      <option value="15-25 LPA">15 - 25 LPA</option>
                      <option value="25+ LPA">25+ LPA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Primary Dream Company *
                    </label>
                    <select
                      value={form.dreamCompany}
                      onChange={(e) => setForm({ ...form, dreamCompany: e.target.value })}
                      className={inputClass}
                    >
                      {domainSupportedCompanies.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Preparation Timeline
                    </label>
                    <select
                      value={form.timeline}
                      onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                      className={inputClass}
                    >
                      <option value="1">1 Month (Sprint)</option>
                      <option value="3">3 Months (Intensive)</option>
                      <option value="6">6 Months (Comprehensive)</option>
                      <option value="12">12 Months (Foundational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Select Target Companies
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {domainSupportedCompanies.map((c) => {
                      const isSel = selectedCompanies.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCompany(c.name)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                            isSel
                              ? 'bg-accent/15 border-accent text-accent font-bold'
                              : 'bg-muted/20 border-border text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <span>{c.name}</span>
                          {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold transition hover:opacity-90 shadow-md"
              >
                Continue / Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Personalizing Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Complete Profile Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal Offering Baseline Assessment */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-scale-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">
                Profile Calibrated Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We have registered your self-reported profile. To distinguish your self-reported
                comfort from evidence-based mastery, we recommend taking a quick 5-minute Adaptive Baseline Diagnostic.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => navigate('/dashboard/baseline')}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:opacity-90 text-accent-foreground font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Take Baseline Diagnostic (Recommended)
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 px-4 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition"
              >
                Skip & Proceed to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
