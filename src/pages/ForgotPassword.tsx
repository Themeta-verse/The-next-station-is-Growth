import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStationStore, domainConfig, type Domain } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { Cpu, Landmark, BookOpen, Globe, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const domainIcons = { engineering: Cpu, commerce: Landmark, arts: BookOpen };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  const { domain, setDomain, language, setLanguage } = useStationStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isHi = language === 'hi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetErr } = await resetPasswordForEmail(trimmedEmail);
      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(
        isHi
          ? 'पासवर्ड रीसेट लिंक भेजने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Unable to send password reset link. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-sidebar-primary blur-3xl" />
        </div>
        <div className="relative z-10 text-primary-foreground text-center px-12 max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-accent/20 backdrop-blur flex items-center justify-center border border-accent/30">
            {(() => {
              const Icon = domainIcons[domain];
              return <Icon className="w-10 h-10 text-accent" />;
            })()}
          </div>
          <h2 className="text-4xl font-bold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            STATION
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-6 leading-relaxed">
            {isHi ? domainConfig[domain].affirmationHi : domainConfig[domain].affirmation}
          </p>
          <div className="flex gap-3 justify-center">
            {(['engineering', 'commerce', 'arts'] as Domain[]).map((d) => {
              const Icon = domainIcons[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomain(d)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-all border ${
                    domain === d
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-primary-foreground/20 text-primary-foreground/60 hover:border-primary-foreground/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isHi ? domainConfig[d].labelHi : domainConfig[d].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Top navigation & Language toggle */}
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isHi ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setLanguage(isHi ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> {isHi ? 'English' : 'हिंदी'}
            </button>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {isHi ? 'पासवर्ड भूल गए?' : 'Forgot Password'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {isHi
                ? 'अपना पंजीकृत ईमेल पता दर्ज करें और हम आपको एक पासवर्ड रीसेट लिंक भेजेंगे।'
                : 'Enter your registered email address and we will send you a password recovery link.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-6 rounded-2xl bg-card border border-border text-center space-y-4 shadow-sm animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isHi ? 'रीसेट लिंक भेजा गया!' : 'Recovery Link Sent!'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {isHi
                    ? `यदि ${email} से जुड़ा कोई खाता मौजूद है, तो आपको पासवर्ड रीसेट लिंक प्राप्त होगा। कृपया अपना इनबॉक्स और स्पैम फ़ोल्डर जांचें।`
                    : `If an account exists for ${email}, you will receive a password reset link. Please check your inbox and spam folder.`}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/auth"
                  className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {isHi ? 'साइन इन पर जाएं' : 'Return to Sign In'}
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {isHi ? 'दूसरा ईमेल आज़माएं' : 'Try another email address'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type="email"
                  placeholder={isHi ? 'पंजीकृत ईमेल' : 'Registered email address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {isHi ? 'रीसेट लिंक भेजें' : 'Send Recovery Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
