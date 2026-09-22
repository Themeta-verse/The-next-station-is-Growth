import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStationStore, domainConfig, type Domain } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Cpu, Landmark, BookOpen, Globe, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const domainIcons = { engineering: Cpu, commerce: Landmark, arts: BookOpen };

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { session, updatePassword, signOut } = useAuth();
  const { domain, setDomain, language, setLanguage } = useStationStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const isHi = language === 'hi';

  useEffect(() => {
    // Check if we have an active recovery session or access token
    const verifyRecoverySession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        // If hash contains access_token or type=recovery, Supabase automatically establishes a session
        if (!currentSession && !window.location.hash.includes('access_token')) {
          setError(
            isHi
              ? 'पासवर्ड रीसेट सत्र अमान्य या समाप्त हो गया है। कृपया एक नया रीसेट लिंक मांगें।'
              : 'Password reset link is invalid or has expired. Please request a new recovery link.'
          );
        }
      } catch {
        // Ignore session read error
      } finally {
        setCheckingSession(false);
      }
    };

    verifyRecoverySession();
  }, [isHi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(
        isHi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isHi
          ? 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।'
          : 'Passwords do not match. Please verify and try again.'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await updatePassword(password);
      if (updateErr) {
        setError(updateErr.message);
      } else {
        setIsSuccess(true);
        toast.success(
          isHi
            ? 'पासवर्ड सफलतापूर्वक अपडेट हो गया!'
            : 'Password updated successfully! Please sign in with your new password.'
        );
        // Cleanly clear temporary recovery session and redirect to login after short delay
        setTimeout(async () => {
          await signOut();
          navigate('/auth', { replace: true });
        }, 2000);
      }
    } catch {
      setError(
        isHi
          ? 'पासवर्ड अपडेट करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Unable to update password. Please try again.'
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
              {isHi ? 'नया पासवर्ड सेट करें' : 'Set New Password'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {isHi
                ? 'अपने खाते के लिए एक मजबूत और सुरक्षित नया पासवर्ड चुनें।'
                : 'Choose a strong and secure new password for your account.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {(!session && !window.location.hash.includes('access_token')) && (
                  <div className="mt-2">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      {isHi ? 'नया रीसेट लिंक प्राप्त करें' : 'Request a new recovery link'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-card border border-border text-center space-y-4 shadow-sm animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isHi ? 'पासवर्ड सफलतापूर्वक बदल गया!' : 'Password Changed Successfully!'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {isHi
                    ? 'आपको साइन इन पृष्ठ पर पुनर्निर्देशित किया जा रहा है...'
                    : 'Redirecting you to the sign-in page...'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/auth"
                  className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {isHi ? 'तुरंत साइन इन करें' : 'Sign in Now'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isHi ? 'नया पासवर्ड (कम से कम 6 अक्षर)' : 'New password (min. 6 characters)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  required
                  minLength={6}
                  disabled={loading || checkingSession}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle new password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={isHi ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm new password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  required
                  minLength={6}
                  disabled={loading || checkingSession}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || checkingSession}
                className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isHi ? 'पासवर्ड अपडेट करें' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
