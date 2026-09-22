import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStationStore, domainConfig, type Domain } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { supabase, formatAuthError } from '@/integrations/supabase/client';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Globe,
  Sparkles,
  Loader2,
  AlertCircle,
  Building,
  GraduationCap,
  Target,
  Calendar,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, refreshProfile, recordProgress } = useAuth();
  const {
    user: storeUser,
    domain,
    setDomain,
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
  const [selectedDomain, setSelectedDomain] = useState<Domain>(storeUser?.domain || domain || 'engineering');
  const [form, setForm] = useState({
    state: storeUser?.state || '',
    city: storeUser?.city || '',
    college: storeUser?.college || '',
    specialization: storeUser?.specialization || '',
    year: storeUser?.year || '',
    dreamCompany: storeUser?.dreamCompany || '',
    dreamJob: storeUser?.dreamJob || '',
    targetSalary: storeUser?.targetSalary || '',
    timeline: storeUser?.timeline || '6',
  });

  const [stepError, setStepError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync initial values if store user loads after mount
  useEffect(() => {
    if (storeUser) {
      setForm(prev => ({
        state: prev.state || storeUser.state || '',
        city: prev.city || storeUser.city || '',
        college: prev.college || storeUser.college || '',
        specialization: prev.specialization || storeUser.specialization || '',
        year: prev.year || storeUser.year || '',
        dreamCompany: prev.dreamCompany || storeUser.dreamCompany || '',
        dreamJob: prev.dreamJob || storeUser.dreamJob || '',
        targetSalary: prev.targetSalary || storeUser.targetSalary || '',
        timeline: prev.timeline || storeUser.timeline || '6',
      }));
      if (storeUser.domain) {
        setSelectedDomain(storeUser.domain);
      }
    }
  }, [storeUser]);

  const totalSteps = 3;
  const config = domainConfig[selectedDomain];

  const handleDomainChange = (newDomain: Domain) => {
    setSelectedDomain(newDomain);
    setDomain(newDomain);
  };

  const validateStep = (currentStep: number): boolean => {
    setStepError('');
    if (currentStep === 0) {
      if (!form.city.trim() || form.city.trim().length < 2) {
        setStepError(isHi ? 'कृपया अपना शहर / इलाका दर्ज करें।' : 'Please enter your city or locality.');
        return false;
      }
      if (!form.college.trim() || form.college.trim().length < 2) {
        setStepError(isHi ? 'कृपया अपने कॉलेज / विश्वविद्यालय का नाम दर्ज करें।' : 'Please enter your college or institute name.');
        return false;
      }
    } else if (currentStep === 1) {
      if (!form.specialization.trim() || form.specialization.trim().length < 2) {
        setStepError(
          isHi
            ? 'कृपया अपनी विशेषज्ञता (जैसे: कंप्यूटर साइंस, बी.कॉम, आदि) दर्ज करें।'
            : 'Please specify your specialization or branch (e.g., Computer Science, Finance).'
        );
        return false;
      }
      if (!form.year) {
        setStepError(isHi ? 'कृपया अपना वर्तमान शैक्षणिक वर्ष चुनें।' : 'Please select your current academic year.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!form.dreamJob.trim() || form.dreamJob.trim().length < 2) {
        setStepError(isHi ? 'कृपया अपने सपनों की नौकरी / भूमिका दर्ज करें।' : 'Please enter your target role or dream job.');
        return false;
      }
      if (!form.dreamCompany.trim() || form.dreamCompany.trim().length < 2) {
        setStepError(isHi ? 'कृपया अपनी लक्षित कंपनी का नाम दर्ज करें।' : 'Please specify your target company or institution.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(totalSteps - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setStepError('');
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    if (!validateStep(2)) return;

    setIsSaving(true);
    setStepError('');

    try {
      const updatedProfile = {
        name: userName,
        state: form.state.trim(),
        city: form.city.trim(),
        college: form.college.trim(),
        domain: selectedDomain,
        specialization: form.specialization.trim(),
        year: form.year,
        dreamCompany: form.dreamCompany.trim(),
        dreamJob: form.dreamJob.trim(),
        targetSalary: form.targetSalary.trim(),
        timeline: form.timeline,
        personalityScore: storeUser?.personalityScore || { iq: 50, eq: 50, rq: 50 },
        weakPoints: storeUser?.weakPoints || [],
      };

      // 1. Update Zustand store immediately
      login(updatedProfile, {
        score: storeUser?.score && storeUser.score > 0 ? storeUser.score : 100, // Welcome starter points
        tasksDone: storeUser?.tasksDone && storeUser.tasksDone > 0 ? storeUser.tasksDone : 1,
        streak: storeUser?.streak && storeUser.streak > 0 ? storeUser.streak : 1,
      });

      // 2. Persist to Supabase if authenticated
      if (authUser?.id) {
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: authUser.id,
          name: userName,
          city: form.city.trim(),
          college: form.college.trim(),
          domain: selectedDomain,
          specialization: form.specialization.trim(),
          dream_company: form.dreamCompany.trim(),
          score: 100,
          tasks_done: 1,
          streak: 1,
        });

        if (upsertErr) {
          throw upsertErr;
        }

        await refreshProfile(authUser.id);
        await recordProgress({ scoreDelta: 0, streak: 1 });
      }

      toast.success(
        isHi
          ? 'ऑनबोर्डिंग सफलतापूर्वक पूर्ण! स्टेशन में आपका स्वागत है।'
          : 'Onboarding completed! Welcome to Growth Station.',
        { duration: 4000 }
      );

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMsg = formatAuthError(err);
      setStepError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <div className="w-full max-w-xl animate-slide-up">
        {/* Top bar with language switcher */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Growth Station</span>
          </div>

          <button
            onClick={() => setLanguage(isHi ? 'en' : 'hi')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            type="button"
          >
            <Globe className="w-3.5 h-3.5" />
            {isHi ? 'English' : 'हिंदी'}
          </button>
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

        {/* Main Card */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-lg">
          {/* Validation Error Banner */}
          {stepError && (
            <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 0: Personal Details */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {isHi ? 'व्यक्तिगत और संस्थान विवरण' : 'Personal & College Details'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isHi ? `नमस्ते ${userName}, आइए आपकी यात्रा शुरू करें` : `Hi ${userName}, let's tailor your preparation`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'राज्य (वैकल्पिक)' : 'State (Optional)'}
                  </label>
                  <input
                    placeholder={isHi ? 'उदा. महाराष्ट्र, दिल्ली, कर्नाटक' : 'e.g., Maharashtra, Karnataka, Delhi'}
                    value={form.state}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, state: e.target.value });
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'शहर / इलाका *' : 'City / Locality *'}
                  </label>
                  <input
                    placeholder={isHi ? 'उदा. मुंबई, पुणे, बैंगलोर' : 'e.g., Mumbai, Pune, Bangalore, Hyderabad'}
                    value={form.city}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, city: e.target.value });
                    }}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'कॉलेज / विश्वविद्यालय का नाम *' : 'College / University Name *'}
                  </label>
                  <input
                    placeholder={isHi ? 'उदा. IIT बॉम्बे, COEP, दिल्ली विश्वविद्यालय' : 'e.g., IIT Bombay, COEP, Delhi University'}
                    value={form.college}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, college: e.target.value });
                    }}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Academic Info & Domain */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {isHi ? 'शैक्षणिक विवरण और डोमेन' : 'Academic & Domain Track'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isHi ? 'अपनी अध्ययन शाखा और डोमेन की पुष्टि करें' : 'Select your focus domain and branch'}
                  </p>
                </div>
              </div>

              {/* Domain selection cards */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {isHi ? 'लक्षित डोमेन' : 'Target Domain'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['engineering', 'commerce', 'arts'] as Domain[]).map((d) => {
                    const cfg = domainConfig[d];
                    const isSelected = selectedDomain === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDomainChange(d)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/15 ring-2 ring-accent/30'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-accent">{cfg.tag}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                        </div>
                        <p className="font-semibold text-xs mt-1 text-foreground">
                          {isHi ? cfg.labelHi : cfg.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'विशेषज्ञता / शाखा *' : 'Specialization / Branch *'}
                  </label>
                  <input
                    placeholder={
                      selectedDomain === 'engineering'
                        ? 'e.g., Computer Science, IT, Mechanical'
                        : selectedDomain === 'commerce'
                        ? 'e.g., B.Com, Finance, Banking, CA Foundation'
                        : 'e.g., Political Science, History, Economics'
                    }
                    value={form.specialization}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, specialization: e.target.value });
                    }}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'वर्तमान शैक्षणिक वर्ष *' : 'Current Academic Year *'}
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, year: e.target.value });
                    }}
                    className={inputClass}
                    required
                  >
                    <option value="">{isHi ? 'वर्ष चुनें...' : 'Select current year...'}</option>
                    <option value="1st Year">{isHi ? 'प्रथम वर्ष (1st Year)' : '1st Year'}</option>
                    <option value="2nd Year">{isHi ? 'द्वितीय वर्ष (2nd Year)' : '2nd Year'}</option>
                    <option value="3rd Year">{isHi ? 'तृतीय वर्ष (3rd Year)' : '3rd Year'}</option>
                    <option value="Final Year">{isHi ? 'अंतिम वर्ष (Final Year)' : 'Final Year'}</option>
                    <option value="Graduate">{isHi ? 'स्नातक / पास-आउट (Graduate)' : 'Graduate / Recent Passout'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Target & Timeline */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {isHi ? 'आपका करियर लक्ष्य' : 'Your Career Goal & Timeline'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isHi ? 'अपनी लक्षित नौकरी और सपनों की कंपनी निर्धारित करें' : 'Set your dream company, target role, and timeline'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'सपनों की भूमिका / नौकरी *' : 'Dream Job Role *'}
                  </label>
                  <input
                    placeholder={
                      selectedDomain === 'engineering'
                        ? 'e.g., Full Stack Engineer, Cloud Architect'
                        : selectedDomain === 'commerce'
                        ? 'e.g., Financial Analyst, Probationary Officer'
                        : 'e.g., Civil Servant, Content Strategist'
                    }
                    value={form.dreamJob}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, dreamJob: e.target.value });
                    }}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'सपनों की कंपनी / संगठन *' : 'Dream Company / Organization *'}
                  </label>
                  <input
                    placeholder={isHi ? 'कंपनी का नाम दर्ज करें' : 'e.g., TCS, Google, Infosys, SBI'}
                    value={form.dreamCompany}
                    onChange={(e) => {
                      setStepError('');
                      setForm({ ...form, dreamCompany: e.target.value });
                    }}
                    className={inputClass}
                    required
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-muted-foreground self-center mr-1">
                      {isHi ? 'सुझाव:' : 'Quick pick:'}
                    </span>
                    {config.companies.slice(0, 5).map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => {
                          setStepError('');
                          setForm({ ...form, dreamCompany: comp });
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          form.dreamCompany === comp
                            ? 'bg-accent/20 border-accent text-accent font-semibold'
                            : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {isHi ? 'अपेक्षित वेतन / पैकेज' : 'Target CTC / Salary (Optional)'}
                  </label>
                  <input
                    placeholder={isHi ? 'उदा. 6 - 12 LPA' : 'e.g., 6 - 12 LPA'}
                    value={form.targetSalary}
                    onChange={(e) => setForm({ ...form, targetSalary: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {isHi ? 'तैयारी की समयरेखा' : 'Preparation Timeline'}
                  </label>
                  <div className="flex gap-2">
                    {['3', '6', '12'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, timeline: t })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          form.timeline === t
                            ? 'border-accent bg-accent/15 text-accent font-bold ring-1 ring-accent'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {t} {isHi ? 'महीने' : 'months'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> {isHi ? 'पीछे' : 'Back'}
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs tracking-wide hover:opacity-90 transition-all hover-scale"
              >
                {isHi ? 'आगे बढ़ें' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs tracking-wide hover:opacity-90 transition-all hover-scale disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isHi ? 'सेटअप हो रहा है...' : 'Setting up your station...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{isHi ? 'स्टेशन शुरू करें' : 'Launch Station'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
