import { useState, useEffect } from 'react';
import { useStationStore, domainConfig } from '@/store/useStationStore';
import { useAuth } from '@/context/AuthContext';
import { supabase, formatAuthError } from '@/integrations/supabase/client';
import {
  Bell,
  Shield,
  User,
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
  LogOut,
  KeyRound,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user: storeUser, domain, language, setLanguage } = useStationStore();
  const { user: authUser, signOut, updateProfile, updatePassword, updateEmail } = useAuth();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState<string | null>('account');
  const [notifications, setNotifications] = useState({ daily: true, weekly: true, rank: false, social: true });
  const [privacy, setPrivacy] = useState({ profilePublic: true, showRank: true, showActivity: false });

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: storeUser?.name || '',
    city: storeUser?.city || '',
    college: storeUser?.college || '',
    specialization: storeUser?.specialization || '',
    dreamCompany: storeUser?.dreamCompany || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Email Form state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [savedSection, setSavedSection] = useState('');

  useEffect(() => {
    if (storeUser) {
      setProfileForm({
        name: storeUser.name || '',
        city: storeUser.city || '',
        college: storeUser.college || '',
        specialization: storeUser.specialization || '',
        dreamCompany: storeUser.dreamCompany || '',
      });
    }
  }, [storeUser]);

  const toggle = (key: string) => setExpanded(expanded === key ? null : key);

  // 1. Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSaved(false);

    if (!profileForm.name.trim()) {
      setProfileError('Name cannot be empty.');
      setProfileLoading(false);
      return;
    }

    const { error } = await updateProfile({
      name: profileForm.name.trim(),
      city: profileForm.city.trim(),
      college: profileForm.college.trim(),
      specialization: profileForm.specialization.trim(),
      dream_company: profileForm.dreamCompany.trim(),
      domain,
    });

    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSaved(true);
      toast.success('Profile details saved successfully!');
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileLoading(false);
  };

  // 2. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSaved(false);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.currentPassword && passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password.');
      setPasswordLoading(false);
      return;
    }

    try {
      // If current password provided and user has an email, verify it first
      if (passwordForm.currentPassword && authUser?.email) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: passwordForm.currentPassword,
        });

        if (verifyErr) {
          setPasswordError('Current password is incorrect. Please check and try again.');
          setPasswordLoading(false);
          return;
        }
      }

      const { error: updateErr } = await updatePassword(passwordForm.newPassword);
      if (updateErr) {
        setPasswordError(updateErr.message);
      } else {
        setPasswordSaved(true);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password updated successfully!');
        setTimeout(() => setPasswordSaved(false), 4000);
      }
    } catch (err) {
      setPasswordError(formatAuthError(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  // 3. Change Email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');
    setEmailSaved(false);

    const trimmed = newEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      setEmailLoading(false);
      return;
    }

    if (trimmed.toLowerCase() === authUser?.email?.toLowerCase()) {
      setEmailError('New email address must be different from your current email.');
      setEmailLoading(false);
      return;
    }

    try {
      const { error: updateErr } = await updateEmail(trimmed);
      if (updateErr) {
        setEmailError(updateErr.message);
      } else {
        setEmailSaved(true);
        setNewEmail('');
        toast.success('Confirmation email sent to your new address! Please check your inbox.');
      }
    } catch (err) {
      setEmailError(formatAuthError(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSimpleSave = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(''), 2500);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all';

  const sections = [
    {
      key: 'account',
      icon: User,
      title: 'Profile Information',
      desc: 'Manage your name, college, dream company, and area',
      content: (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
              <input
                placeholder="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Current Email (Managed via Auth)</label>
              <input
                value={authUser?.email || 'Authenticated User'}
                disabled
                className={`${inputClass} opacity-60 bg-muted cursor-not-allowed`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">College / Institution</label>
              <input
                placeholder="e.g. COEP Technological University"
                value={profileForm.college}
                onChange={(e) => setProfileForm((p) => ({ ...p, college: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">City / Region</label>
              <input
                placeholder="e.g. Pune, Maharashtra"
                value={profileForm.city}
                onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Specialization / Branch</label>
              <input
                placeholder="e.g. Computer Science"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm((p) => ({ ...p, specialization: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Dream Company</label>
              <input
                placeholder="e.g. Google, Microsoft, TCS"
                value={profileForm.dreamCompany}
                onChange={(e) => setProfileForm((p) => ({ ...p, dreamCompany: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {profileLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profileSaved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {profileSaved ? 'Profile Saved!' : 'Save Profile Changes'}
            </button>
            <span className="text-xs text-muted-foreground">
              Current Stream: <strong className="text-foreground capitalize">{domainConfig[domain].label}</strong>
            </span>
          </div>
        </form>
      ),
    },
    {
      key: 'security',
      icon: KeyRound,
      title: 'Security & Password',
      desc: 'Change your account password securely',
      content: (
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSaved && (
            <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Your password has been changed successfully.</span>
            </div>
          )}

          <div className="relative group">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className={inputClass}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className={inputClass}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      ),
    },
    {
      key: 'email',
      icon: Mail,
      title: 'Email Address',
      desc: 'Change your account email with confirmation verification',
      content: (
        <form onSubmit={handleChangeEmail} className="space-y-4">
          {emailError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSaved && (
            <div className="p-4 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Confirmation Link Sent!
              </p>
              <p>
                Supabase requires email verification for address updates. Please check your new email inbox and click the verification link to finalize this change.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">New Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <p className="text-xs text-muted-foreground">
            For security, changing your email requires clicking a confirmation link sent by Supabase Auth to your new address.
          </p>

          <button
            type="submit"
            disabled={emailLoading}
            className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Email Verification Link
          </button>
        </form>
      ),
    },
    {
      key: 'notifications',
      icon: Bell,
      title: 'Notifications',
      desc: 'Daily reminders, weekly reports, rank updates',
      content: (
        <div className="space-y-3">
          {[
            { key: 'daily' as const, label: 'Daily study reminders' },
            { key: 'weekly' as const, label: 'Weekly progress reports' },
            { key: 'rank' as const, label: 'Rank change alerts' },
            { key: 'social' as const, label: 'Social feed updates' },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm">{n.label}</span>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  notifications[n.key] ? 'bg-accent' : 'bg-border'
                }`}
                aria-label={`Toggle ${n.label}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-all ${
                    notifications[n.key] ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleSimpleSave('notifications')}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {savedSection === 'notifications' ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Preferences Saved!
              </span>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'language',
      icon: Globe,
      title: 'Language & Region',
      desc: 'Preferred language and regional settings',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Interface Language</label>
            <div className="flex gap-2">
              {[
                { code: 'en' as const, label: 'English' },
                { code: 'hi' as const, label: 'हिंदी (Hindi)' },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === l.code
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-border text-muted-foreground hover:border-accent/40'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-muted/50 text-sm space-y-1">
            <p className="font-medium text-foreground">
              Locality: {storeUser?.city || 'Not set'}, {storeUser?.state || 'India'}
            </p>
            <p className="text-xs text-muted-foreground">
              Your locality personalizes regional peer leaderboards and local company drives.
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'privacy',
      icon: Shield,
      title: 'Privacy & Sharing',
      desc: 'Manage data visibility and peer profile sharing',
      content: (
        <div className="space-y-3">
          {[
            { key: 'profilePublic' as const, label: 'Make profile visible on batch leaderboard' },
            { key: 'showRank' as const, label: 'Show global rank to peers' },
            { key: 'showActivity' as const, label: 'Show streak and completed quizzes in feed' },
          ].map((p) => (
            <div key={p.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm">{p.label}</span>
              <button
                type="button"
                onClick={() => setPrivacy((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  privacy[p.key] ? 'bg-accent' : 'bg-border'
                }`}
                aria-label={`Toggle ${p.label}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-all ${
                    privacy[p.key] ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleSimpleSave('privacy')}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {savedSection === 'privacy' ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Privacy Saved!
              </span>
            ) : (
              'Save Privacy Settings'
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account & Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Signed in as <strong className="text-foreground">{authUser?.email || storeUser?.name}</strong>
          </p>
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.key} className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggle(s.key)}
            className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
            </div>
            {expanded === s.key ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
          {expanded === s.key && (
            <div className="px-5 pb-5 border-t border-border pt-4 animate-fade-in">{s.content}</div>
          )}
        </div>
      ))}

      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-semibold flex items-center justify-center gap-2 hover:bg-destructive/10 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Sign Out of Growth Station
      </button>
    </div>
  );
}
