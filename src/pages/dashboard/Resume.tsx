import { useState, useRef, useMemo } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { FileText, CheckCircle, AlertCircle, Download, X, Plus, Trash2, Eye, Sparkles, Loader2, ArrowRight, Upload, Building, User, Briefcase, GraduationCap, Award, Code, ArrowLeft, Image, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai';

interface ResumeData {
  objective: string;
  education: { degree: string; college: string; year: string; gpa: string }[];
  skills: string[];
  experience: { title: string; company: string; duration: string; desc: string }[];
  projects: { name: string; desc: string; tech: string }[];
  achievements: string[];
}

type ActiveTab = 'ai-generate' | 'builder' | 'analyzer';
type ResumeStyle = 'google' | 'startup' | 'corporate' | 'consulting' | 'government' | 'custom';

const COMPANY_STYLES: Record<ResumeStyle, { label: string; desc: string; icon: string }> = {
  google: { label: 'FAANG / Big Tech', desc: 'Clean, project-focused, strong DSA/system design emphasis', icon: '🏢' },
  startup: { label: 'Startup / Product', desc: 'Impact-driven, growth metrics, side projects highlighted', icon: '🚀' },
  corporate: { label: 'Corporate / MNC', desc: 'Structured, professional, certifications & team experience', icon: '🏛️' },
  consulting: { label: 'Consulting / Analyst', desc: 'Case studies, analytical skills, communication emphasis', icon: '📊' },
  government: { label: 'Government / PSU', desc: 'Formal, exam scores, public service orientation', icon: '🇮🇳' },
  custom: { label: 'Custom Company', desc: 'Enter any specific company for tailored resume', icon: '✨' },
};

export default function Resume() {
  const { domain, user, language } = useStationStore();
  const { quizHistory, topicPerformance } = usePerformanceStore();
  const config = domainConfig[domain];
  const isHi = language === 'hi';
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-generate');
  const [selectedTemplate, setSelectedTemplate] = useState<'Classic' | 'Minimal' | 'Bold'>('Classic');
  const [showPreview, setShowPreview] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // AI Generate state
  const [aiStep, setAiStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>('google');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [resume, setResume] = useState<ResumeData>({
    objective: '',
    education: [{ degree: user?.specialization || '', college: user?.college || '', year: user?.year || '', gpa: '' }],
    skills: [],
    experience: [{ title: '', company: '', duration: '', desc: '' }],
    projects: [{ name: '', desc: '', tech: '' }],
    achievements: [''],
  });

  // Analyzer
  const [analyzerText, setAnalyzerText] = useState('');
  const [analyzerResult, setAnalyzerResult] = useState('');
  const [analyzerLoading, setAnalyzerLoading] = useState(false);

  const analyzeResume = async () => {
    if (!analyzerText.trim()) return;
    setAnalyzerLoading(true);
    setAnalyzerResult('');
    let full = '';
    await streamChat({
      messages: [{ role: 'user', content: `Analyze this resume for an Indian ${config.label} student targeting ${user?.dreamCompany || 'top companies'}. Give ATS score out of 100, strengths, weaknesses, missing keywords, and specific improvement suggestions.\n\nResume:\n${analyzerText}` }],
      mode: 'resume-analysis',
      onDelta: (chunk) => { full += chunk; setAnalyzerResult(full); },
      onDone: () => setAnalyzerLoading(false),
      onError: () => { setAnalyzerResult('Failed to analyze. Please try again.'); setAnalyzerLoading(false); },
    });
  };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gather all student data for AI
  const studentProfile = useMemo(() => {
    const topics = Object.values(topicPerformance);
    const strongTopics = topics.filter(t => t.attempts > 0 && (t.correct / t.attempts) >= 0.7).map(t => t.topic);
    const totalQuizzes = quizHistory.length;
    return {
      name: user?.name || 'Student',
      college: user?.college || '',
      specialization: user?.specialization || config.label,
      year: user?.year || '',
      city: user?.city || '',
      state: user?.state || '',
      dreamCompany: user?.dreamCompany || '',
      dreamJob: user?.dreamJob || '',
      domain: config.label,
      strongTopics: strongTopics.join(', ') || 'N/A',
      totalQuizzes,
      // Builder data if filled
      skills: resume.skills.join(', '),
      projects: resume.projects.filter(p => p.name).map(p => `${p.name} (${p.tech}): ${p.desc}`).join('; '),
      experience: resume.experience.filter(e => e.title).map(e => `${e.title} at ${e.company} (${e.duration}): ${e.desc}`).join('; '),
      achievements: resume.achievements.filter(Boolean).join(', '),
      objective: resume.objective,
    };
  }, [user, topicPerformance, quizHistory, resume, config]);

  // AI Resume Generation
  const generateAIResume = async () => {
    setAiStep('generating');
    setGenLoading(true);
    setGenProgress('Analyzing your profile...');
    setGeneratedHTML('');

    const targetCompany = resumeStyle === 'custom' ? customCompanyName : COMPANY_STYLES[resumeStyle].label;
    const styleDesc = COMPANY_STYLES[resumeStyle].desc;

    const prompt = `Generate a COMPLETE, professional, ATS-friendly resume for this student. Output as clean HTML that can be printed as PDF.

STUDENT PROFILE:
- Name: ${studentProfile.name}
- College: ${studentProfile.college}
- Specialization: ${studentProfile.specialization}
- Year: ${studentProfile.year}
- Location: ${studentProfile.city}, ${studentProfile.state}
- Dream Job: ${studentProfile.dreamJob || 'Not specified'}
- Domain: ${studentProfile.domain}
- Strong Topics (from quiz data): ${studentProfile.strongTopics}
- Total Quizzes Taken: ${studentProfile.totalQuizzes}
${studentProfile.skills ? `- Skills: ${studentProfile.skills}` : ''}
${studentProfile.projects ? `- Projects: ${studentProfile.projects}` : ''}
${studentProfile.experience ? `- Experience: ${studentProfile.experience}` : ''}
${studentProfile.achievements ? `- Achievements: ${studentProfile.achievements}` : ''}
${studentProfile.objective ? `- Objective: ${studentProfile.objective}` : ''}
${additionalInfo ? `- Additional Info from student: ${additionalInfo}` : ''}

TARGET: ${targetCompany}
STYLE NOTES: ${styleDesc}

CRITICAL RULES:
1. Output ONLY valid HTML — no markdown, no code fences, no explanation
2. Use inline CSS styles only (no external stylesheets)
3. Make it A4 size, single page ideally
4. Use professional fonts: font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
5. Keep colors professional — dark text, subtle accent lines
6. Include ALL these sections (generate realistic content if student hasn't provided):
   - Contact Info (name, email placeholder, phone placeholder, location)
   - Career Objective / Summary (tailored to ${targetCompany})
   - Education
   - Technical Skills (tailored to what ${targetCompany} looks for)
   - Projects (with tech stack and impact — generate if not provided)
   - Experience / Internships (generate realistic entry if not provided)
   - Achievements & Certifications
   - Extra-curricular / Leadership
7. Use bullet points for descriptions
8. Add relevant keywords for ${targetCompany} ATS systems
9. If the student is engineering domain, emphasize technical skills and projects
10. If commerce, emphasize analytical skills and certifications
11. If arts/civil services, emphasize communication and public service

The resume should look DIFFERENT based on company type:
- FAANG: Clean, project-heavy, metrics-driven, no photo
- Startup: Creative, impact-focused, shows initiative
- Corporate: Formal structure, certifications prominent
- Government: Traditional format, exam scores, achievements

Generate a COMPLETE, ready-to-print resume. Make it look professional and polished.`;

    let fullHTML = '';
    setGenProgress('AI is writing your resume...');

    await streamChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'resume-generate',
      context: { domain },
      onDelta: (chunk) => {
        fullHTML += chunk;
        // Clean up code fences if AI adds them
        const cleaned = fullHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        setGeneratedHTML(cleaned);
      },
      onDone: () => {
        setGenLoading(false);
        setGenProgress('');
        setAiStep('preview');
        // Final cleanup
        const cleaned = fullHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        setGeneratedHTML(cleaned);
      },
      onError: () => {
        setGenLoading(false);
        setGenProgress('');
        setGeneratedHTML(getFallbackResume());
        setAiStep('preview');
      },
    });
  };

  const getFallbackResume = () => {
    return `<div style="font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a;">
      <h1 style="margin: 0; font-size: 28px; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">${studentProfile.name}</h1>
      <p style="color: #666; margin: 4px 0;">${studentProfile.specialization} | ${studentProfile.college} | ${studentProfile.city}</p>
      <h2 style="font-size: 16px; color: #2563eb; margin-top: 20px;">Objective</h2>
      <p style="font-size: 13px; line-height: 1.5;">Seeking a challenging role at ${user?.dreamCompany || 'a leading organization'} where I can apply my ${studentProfile.domain} expertise.</p>
      <h2 style="font-size: 16px; color: #2563eb;">Education</h2>
      <p style="font-size: 13px;"><strong>${studentProfile.specialization}</strong> — ${studentProfile.college} (${studentProfile.year})</p>
      <h2 style="font-size: 16px; color: #2563eb;">Skills</h2>
      <p style="font-size: 13px;">${studentProfile.skills || 'Add skills in the Builder tab'}</p>
      <p style="color: #999; font-size: 11px; margin-top: 30px; text-align: center;">Generated by Growth Station AI</p>
    </div>`;
  };

  // Download as HTML file
  const downloadResume = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume - ${studentProfile.name}</title>
<style>
  @media print {
    body { margin: 0; padding: 0; }
    @page { margin: 0.5in; size: A4; }
  }
  body { margin: 0; padding: 20px; background: white; }
</style>
</head>
<body>
${photoData ? `<img src="${photoData}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;position:absolute;top:40px;right:40px;" />` : ''}
${generatedHTML}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_${studentProfile.name.replace(/\s+/g, '_')}_${COMPANY_STYLES[resumeStyle].label.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print as PDF
  const printResume = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Resume - ${studentProfile.name}</title>
<style>
  @media print { body { margin: 0; } @page { margin: 0.5in; size: A4; } }
  body { margin: 20px; background: white; }
</style></head><body>
${photoData ? `<img src="${photoData}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;float:right;margin:0 0 10px 10px;" />` : ''}
${generatedHTML}
</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  const atsChecks = [
    { ok: !!(user?.name), text: 'Contact information' },
    { ok: resume.skills.length >= 3, text: 'At least 3 skills listed' },
    { ok: resume.objective.length > 20, text: 'Career objective written' },
    { ok: resume.education[0].college.length > 0, text: 'Education details' },
    { ok: resume.projects[0].name.length > 0, text: 'At least one project' },
    { ok: resume.experience[0].title.length > 0, text: 'Experience or internship' },
    { ok: (resume.achievements[0]?.length || 0) > 0, text: 'Achievements listed' },
  ];
  const atsScore = Math.round((atsChecks.filter(c => c.ok).length / atsChecks.length) * 100);

  const addSkill = () => {
    if (newSkill.trim() && !resume.skills.includes(newSkill.trim())) {
      setResume(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };
  const removeSkill = (skill: string) => setResume(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));

  return (
    <div className="max-w-4xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isHi ? 'रेज़्यूमे' : 'Resume'}</h1>
          <p className="text-sm text-muted-foreground">{isHi ? 'AI से बनाएं, विश्लेषण करें, अनुकूलित करें' : 'AI-generate, analyze, and optimize'}</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([
            { id: 'ai-generate' as ActiveTab, label: isHi ? 'AI बनाएं' : 'AI Generate', icon: Sparkles },
            { id: 'builder' as ActiveTab, label: isHi ? 'बिल्डर' : 'Builder', icon: FileText },
            { id: 'analyzer' as ActiveTab, label: isHi ? 'विश्लेषक' : 'Analyzer', icon: Target },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ AI GENERATE TAB ═══════════ */}
      {activeTab === 'ai-generate' && aiStep === 'input' && (
        <div className="space-y-5 animate-fade-in">
          {/* Hero */}
          <div className="rounded-2xl overflow-hidden p-6 text-center relative" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
              <h2 className="text-lg font-bold text-primary-foreground">{isHi ? 'AI रेज़्यूमे जनरेटर' : 'AI Resume Generator'}</h2>
              <p className="text-xs text-primary-foreground/70 mt-1 max-w-md mx-auto">
                {isHi ? 'कंपनी के हिसाब से ATS-friendly रेज़्यूमे — आपके प्रोफाइल और क्विज़ डेटा से' : 'Company-specific ATS-friendly resume — built from your profile + quiz performance data'}
              </p>
            </div>
          </div>

          {/* Company Style Selector */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-accent" />
              {isHi ? 'किस तरह की कंपनी के लिए?' : 'What type of company?'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(COMPANY_STYLES) as ResumeStyle[]).map(style => (
                <button key={style} onClick={() => setResumeStyle(style)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resumeStyle === style ? 'border-accent bg-accent/10 ring-1 ring-accent/30' : 'border-border hover:border-accent/50'
                  }`}>
                  <span className="text-lg">{COMPANY_STYLES[style].icon}</span>
                  <p className="text-xs font-semibold mt-1">{COMPANY_STYLES[style].label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{COMPANY_STYLES[style].desc}</p>
                </button>
              ))}
            </div>
            {resumeStyle === 'custom' && (
              <input value={customCompanyName} onChange={e => setCustomCompanyName(e.target.value)}
                placeholder={isHi ? 'कंपनी का नाम लिखें (जैसे TCS, Flipkart)' : 'Enter company name (e.g. TCS, Flipkart, Razorpay)'}
                className={`${inputClass} mt-3`} />
            )}
          </div>

          {/* Photo + Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Photo Upload */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-accent" />
                {isHi ? 'फोटो (वैकल्पिक)' : 'Photo (Optional)'}
              </h3>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
              {photoData ? (
                <div className="flex items-center gap-3">
                  <img src={photoData} alt="Profile" className="w-16 h-16 rounded-xl object-cover border border-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isHi ? 'फोटो अपलोड हो गई' : 'Photo uploaded'}</p>
                    <button onClick={() => setPhotoData(null)} className="text-[10px] text-destructive mt-1">{isHi ? 'हटाएं' : 'Remove'}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-all flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">{isHi ? 'फोटो अपलोड करें' : 'Upload Photo'}</span>
                </button>
              )}
              <p className="text-[9px] text-muted-foreground mt-2">{isHi ? 'नोट: FAANG कंपनियों के लिए फोटो न रखें' : 'Note: Avoid photo for FAANG/Big Tech resumes'}</p>
            </div>

            {/* Additional Info */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" />
                {isHi ? 'अतिरिक्त जानकारी' : 'Additional Info'}
              </h3>
              <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                placeholder={isHi ? 'कोई भी अतिरिक्त जानकारी — इंटर्नशिप, सर्टिफिकेशन, हॉबी, ओपन सोर्स, कोई भी चीज़...' : 'Any extra info — internships, certifications, hobbies, open source contributions, anything you want to highlight...'}
                rows={5}
                className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* What AI knows about you */}
          <div className="bg-muted/30 rounded-2xl border border-border p-4">
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">{isHi ? 'AI को यह पता है आपके बारे में:' : 'AI already knows about you:'}</h3>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {studentProfile.name && <span className="px-2 py-1 rounded bg-accent/10 text-accent font-medium">{studentProfile.name}</span>}
              {studentProfile.college && <span className="px-2 py-1 rounded bg-muted text-foreground">{studentProfile.college}</span>}
              {studentProfile.specialization && <span className="px-2 py-1 rounded bg-muted text-foreground">{studentProfile.specialization}</span>}
              {studentProfile.dreamJob && <span className="px-2 py-1 rounded bg-muted text-foreground">{studentProfile.dreamJob}</span>}
              {studentProfile.strongTopics !== 'N/A' && <span className="px-2 py-1 rounded bg-green-500/10 text-green-600">Strong: {studentProfile.strongTopics}</span>}
              {studentProfile.totalQuizzes > 0 && <span className="px-2 py-1 rounded bg-muted text-foreground">{studentProfile.totalQuizzes} quizzes taken</span>}
              {studentProfile.skills && <span className="px-2 py-1 rounded bg-muted text-foreground">Skills: {studentProfile.skills.slice(0, 40)}...</span>}
            </div>
            <p className="text-[9px] text-muted-foreground mt-2">{isHi ? 'Builder में जो भी भरा है वो भी शामिल होगा' : 'Builder tab data will also be included if filled'}</p>
          </div>

          {/* Generate button */}
          <button onClick={generateAIResume} disabled={genLoading}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
            <Sparkles className="w-5 h-5" />
            {isHi ? `${COMPANY_STYLES[resumeStyle].label} के लिए रेज़्यूमे बनाएं` : `Generate Resume for ${resumeStyle === 'custom' ? customCompanyName || 'Custom' : COMPANY_STYLES[resumeStyle].label}`}
          </button>
        </div>
      )}

      {/* GENERATING */}
      {activeTab === 'ai-generate' && aiStep === 'generating' && (
        <div className="space-y-6 animate-fade-in text-center py-8">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
            <FileText className="w-6 h-6 text-accent absolute inset-0 m-auto" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">{isHi ? 'AI रेज़्यूमे बना रहा है...' : 'AI is Building Your Resume...'}</h2>
            <p className="text-sm text-muted-foreground">{genProgress || (isHi ? 'कंपनी-विशिष्ट ATS अनुकूलन...' : 'Company-specific ATS optimization...')}</p>
          </div>
          {generatedHTML && (
            <div className="bg-white rounded-2xl border border-border p-6 text-left max-h-[400px] overflow-y-auto shadow-sm">
              <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
            </div>
          )}
        </div>
      )}

      {/* PREVIEW */}
      {activeTab === 'ai-generate' && aiStep === 'preview' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button onClick={() => setAiStep('input')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> {isHi ? 'वापस' : 'Back'}
            </button>
            <div className="flex gap-2">
              <button onClick={downloadResume}
                className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium flex items-center gap-2 hover:bg-muted/80">
                <Download className="w-3.5 h-3.5" /> HTML
              </button>
              <button onClick={printResume}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-medium flex items-center gap-2 hover-scale">
                <Download className="w-3.5 h-3.5" /> {isHi ? 'PDF डाउनलोड करें' : 'Save as PDF'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isHi ? `${COMPANY_STYLES[resumeStyle].label} के लिए ATS-अनुकूलित रेज़्यूमे तैयार है। "Save as PDF" दबाकर डाउनलोड करें।` : `ATS-optimized resume for ${resumeStyle === 'custom' ? customCompanyName : COMPANY_STYLES[resumeStyle].label} is ready. Click "Save as PDF" to download.`}
            </p>
          </div>

          {/* Resume preview */}
          <div ref={printRef} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-8 text-[#1a1a1a] relative">
              {photoData && (
                <img src={photoData} alt="Profile" className="w-20 h-20 rounded-full object-cover absolute top-8 right-8 border-2 border-gray-200" />
              )}
              <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
            </div>
          </div>

          {/* Regenerate with different style */}
          <div className="flex gap-3">
            <button onClick={() => { setAiStep('input'); }}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover-scale text-sm flex items-center justify-center gap-2">
              <Building className="w-4 h-4" /> {isHi ? 'अलग कंपनी के लिए बनाएं' : 'Try Different Company'}
            </button>
            <button onClick={generateAIResume}
              className="flex-1 py-3 rounded-xl font-medium hover-scale text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))', color: 'hsl(var(--accent-foreground))' }}>
              <Sparkles className="w-4 h-4" /> {isHi ? 'फिर से बनाएं' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ BUILDER TAB ═══════════ */}
      {activeTab === 'builder' && (
        <div className="space-y-4 animate-fade-in">
          {/* ATS Score */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">ATS Readiness</h3>
              <span className={`text-2xl font-bold ${atsScore >= 70 ? 'text-accent' : 'text-destructive'}`}>{atsScore}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${atsScore >= 70 ? 'bg-accent' : 'bg-destructive'}`} style={{ width: `${atsScore}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {atsChecks.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  {item.ok ? <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" /> : <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />}
                  <span className={item.ok ? '' : 'text-muted-foreground'}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Objective */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-medium text-sm mb-2">Career Objective</h4>
            <textarea value={resume.objective} onChange={(e) => setResume(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="Write a brief career objective..." className={`${inputClass} resize-none`} rows={2} />
          </div>

          {/* Education */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-medium text-sm mb-2">Education</h4>
            {resume.education.map((edu, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                <input placeholder="Degree" value={edu.degree} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], degree: e.target.value }; setResume(prev => ({ ...prev, education: n })); }} className={inputClass} />
                <input placeholder="College" value={edu.college} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], college: e.target.value }; setResume(prev => ({ ...prev, education: n })); }} className={inputClass} />
                <input placeholder="Year" value={edu.year} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], year: e.target.value }; setResume(prev => ({ ...prev, education: n })); }} className={inputClass} />
                <input placeholder="GPA / %" value={edu.gpa} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], gpa: e.target.value }; setResume(prev => ({ ...prev, education: n })); }} className={inputClass} />
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-medium text-sm mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {resume.skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-medium">
                  {s} <button onClick={() => removeSkill(s)}><Trash2 className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()} className={inputClass} />
              <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Projects</h4>
              <button onClick={() => setResume(prev => ({ ...prev, projects: [...prev.projects, { name: '', desc: '', tech: '' }] }))}
                className="text-[10px] text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {resume.projects.map((proj, i) => (
              <div key={i} className="grid gap-2 mb-3 pb-3 border-b border-border last:border-0">
                <input placeholder="Project name" value={proj.name} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], name: e.target.value }; setResume(prev => ({ ...prev, projects: n })); }} className={inputClass} />
                <input placeholder="Description" value={proj.desc} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], desc: e.target.value }; setResume(prev => ({ ...prev, projects: n })); }} className={inputClass} />
                <input placeholder="Tech stack" value={proj.tech} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], tech: e.target.value }; setResume(prev => ({ ...prev, projects: n })); }} className={inputClass} />
              </div>
            ))}
          </div>

          {/* Experience */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Experience</h4>
              <button onClick={() => setResume(prev => ({ ...prev, experience: [...prev.experience, { title: '', company: '', duration: '', desc: '' }] }))}
                className="text-[10px] text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {resume.experience.map((exp, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-border last:border-0">
                <input placeholder="Title" value={exp.title} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], title: e.target.value }; setResume(prev => ({ ...prev, experience: n })); }} className={inputClass} />
                <input placeholder="Company" value={exp.company} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], company: e.target.value }; setResume(prev => ({ ...prev, experience: n })); }} className={inputClass} />
                <input placeholder="Duration" value={exp.duration} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], duration: e.target.value }; setResume(prev => ({ ...prev, experience: n })); }} className={inputClass} />
                <input placeholder="Description" value={exp.desc} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], desc: e.target.value }; setResume(prev => ({ ...prev, experience: n })); }} className={inputClass} />
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Achievements</h4>
              <button onClick={() => setResume(prev => ({ ...prev, achievements: [...prev.achievements, ''] }))}
                className="text-[10px] text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {resume.achievements.map((a, i) => (
              <input key={i} placeholder={`Achievement ${i + 1}`} value={a} onChange={(e) => {
                const n = [...resume.achievements]; n[i] = e.target.value; setResume(prev => ({ ...prev, achievements: n }));
              }} className={`${inputClass} mb-2`} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ ANALYZER TAB ═══════════ */}
      {activeTab === 'analyzer' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> AI Resume Analyzer
            </h3>
            <textarea value={analyzerText} onChange={e => setAnalyzerText(e.target.value)}
              placeholder="Paste your resume content here..."
              className={`${inputClass} resize-none`} rows={8} />
          </div>
          <button onClick={analyzeResume} disabled={!analyzerText.trim() || analyzerLoading}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-medium flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-40">
            {analyzerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isHi ? 'AI से विश्लेषण करें' : 'Analyze with AI'}
          </button>
          {analyzerResult && (
            <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in">
              <div className="prose prose-sm max-w-none text-sm [&_strong]:text-accent">
                <ReactMarkdown>{analyzerResult}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
