import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, formatAuthError } from '@/integrations/supabase/client';
import {
  useStationStore,
  type Domain,
  type StudentSkill,
  type ReadinessLevel,
  type StudentExperience,
  type BaselineAssessmentResult,
  type TopicCompetency,
} from '@/store/useStationStore';

export interface UpdateProfileData {
  name?: string;
  city?: string;
  college?: string;
  domain?: Domain;
  specialization?: string;
  dream_company?: string;
  degree?: string;
  year?: string;
  semester?: string;
  graduation_year?: string;
  target_role?: string;
  target_companies?: string[];
  preparing_for?: string;
  target_job_type?: string;
  target_goal?: string;
  target_salary?: string;
  timeline?: string;
  experience?: StudentExperience;
  topic_competencies?: Record<string, TopicCompetency>;
  baseline_assessment?: BaselineAssessmentResult;
  personality_trait?: string;
  skills?: StudentSkill[];
  dsa_level?: ReadinessLevel;
  cs_fundamentals_level?: ReadinessLevel;
  aptitude_level?: ReadinessLevel;
  communication_level?: ReadinessLevel;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isPasswordRecovery: boolean;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId: string) => Promise<boolean>;
  updateProfile: (updates: UpdateProfileData) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  recordProgress: (options: { scoreDelta?: number; taskCompleted?: boolean; streak?: number }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isPasswordRecovery: false,
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => false,
  updateProfile: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  updateEmail: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ error: null }),
  recordProgress: async () => {},
});

function isNetworkFetchError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message).toLowerCase()
    : String(error).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('authretryablefetcherror') ||
    msg.includes('timeout')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const { login } = useStationStore();

  const syncUserProfile = useCallback(async (userId: string, defaultName?: string): Promise<boolean> => {
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout') }), 3500)
      );

      const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]);
      const currentStore = useStationStore.getState();
      const currentUser = currentStore.user;

      let authUserMeta = user?.id === userId ? user?.user_metadata : undefined;
      if (!authUserMeta) {
        try {
          const { data: authUserData } = await supabase.auth.getUser();
          if (authUserData?.user?.id === userId) {
            authUserMeta = authUserData.user.user_metadata;
          }
        } catch {
          // Non-blocking
        }
      }
      const metaProfile = ((authUserMeta?.profile || {}) as Record<string, unknown>);

      if (profile && !error) {
        const p = profile as Record<string, unknown>;
        const isOnboarded = Boolean(
          (p.onboarding_completed as boolean) ||
          (authUserMeta?.onboarding_completed as boolean) ||
          (metaProfile.onboarding_completed as boolean) ||
          (p.city && String(p.city).trim() !== '' && p.college && String(p.college).trim() !== '') ||
          (metaProfile.city && String(metaProfile.city).trim() !== '' && metaProfile.college && String(metaProfile.college).trim() !== '')
        );
        setHasCompletedOnboarding(isOnboarded);

        login({
          name: (p.name as string) || (metaProfile.name as string) || (authUserMeta?.name as string) || defaultName || currentUser?.name || 'Student',
          state: (currentUser?.state as string) || '',
          city: (p.city as string) || (metaProfile.city as string) || currentUser?.city || '',
          college: (p.college as string) || (metaProfile.college as string) || currentUser?.college || '',
          domain: ((p.domain as Domain) || (metaProfile.domain as Domain) || currentUser?.domain || 'engineering'),
          degree: (p.degree as string) || (metaProfile.degree as string) || currentUser?.degree || '',
          specialization: (p.specialization as string) || (metaProfile.specialization as string) || currentUser?.specialization || '',
          year: (metaProfile.year as string) || currentUser?.year || '',
          semester: (p.semester as string) || (metaProfile.semester as string) || currentUser?.semester || '',
          graduationYear: (p.graduation_year as string) || (metaProfile.graduation_year as string) || (metaProfile.graduationYear as string) || currentUser?.graduationYear || '',
          targetRole: (p.target_role as string) || (metaProfile.target_role as string) || (metaProfile.targetRole as string) || currentUser?.targetRole || '',
          targetCompanies: Array.isArray(p.target_companies) ? (p.target_companies as string[]) : (Array.isArray(metaProfile.target_companies) ? (metaProfile.target_companies as string[]) : (currentUser?.targetCompanies || [])),
          dreamCompany: (p.dream_company as string) || (metaProfile.dream_company as string) || (metaProfile.dreamCompany as string) || currentUser?.dreamCompany || '',
          dreamJob: (p.target_role as string) || (metaProfile.target_role as string) || currentUser?.dreamJob || '',
          targetSalary: (metaProfile.target_salary as string) || (metaProfile.targetSalary as string) || currentUser?.targetSalary || '',
          timeline: (metaProfile.timeline as string) || currentUser?.timeline || '6',
          preparingFor: (p.preparing_for as string) || (metaProfile.preparing_for as string) || (metaProfile.preparingFor as string) || currentUser?.preparingFor,
          targetJobType: (p.target_job_type as string) || (metaProfile.target_job_type as string) || (metaProfile.targetJobType as string) || currentUser?.targetJobType,
          targetGoal: (p.target_goal as string) || (metaProfile.target_goal as string) || (metaProfile.targetGoal as string) || currentUser?.targetGoal,
          experience: (p.experience as StudentExperience) || (metaProfile.experience as StudentExperience) || currentUser?.experience,
          baselineAssessment: (p.baseline_assessment as BaselineAssessmentResult) || (metaProfile.baseline_assessment as BaselineAssessmentResult) || (metaProfile.baselineAssessment as BaselineAssessmentResult) || currentUser?.baselineAssessment,
          topicCompetencies: (p.topic_competencies as Record<string, TopicCompetency>) || (metaProfile.topic_competencies as Record<string, TopicCompetency>) || (metaProfile.topicCompetencies as Record<string, TopicCompetency>) || currentUser?.topicCompetencies,
          personalityTrait: (p.personality_trait as string) || (metaProfile.personality_trait as string) || currentUser?.personalityTrait,
          skills: Array.isArray(p.skills) && p.skills.length > 0 ? (p.skills as StudentSkill[]) : (Array.isArray(metaProfile.skills) ? (metaProfile.skills as StudentSkill[]) : (currentUser?.skills || [])),
          dsaLevel: (p.dsa_level as ReadinessLevel) || (metaProfile.dsa_level as ReadinessLevel) || (metaProfile.dsaLevel as ReadinessLevel) || currentUser?.dsaLevel,
          csFundamentalsLevel: (p.cs_fundamentals_level as ReadinessLevel) || (metaProfile.cs_fundamentals_level as ReadinessLevel) || (metaProfile.csFundamentalsLevel as ReadinessLevel) || currentUser?.csFundamentalsLevel,
          aptitudeLevel: (p.aptitude_level as ReadinessLevel) || (metaProfile.aptitude_level as ReadinessLevel) || (metaProfile.aptitudeLevel as ReadinessLevel) || currentUser?.aptitudeLevel,
          communicationLevel: (p.communication_level as ReadinessLevel) || (metaProfile.communication_level as ReadinessLevel) || (metaProfile.communicationLevel as ReadinessLevel) || currentUser?.communicationLevel,
          personalityScore: currentUser?.personalityScore || { iq: 50, eq: 50, rq: 50 },
          weakPoints: currentUser?.weakPoints || [],
        }, {
          score: (p.score as number) || currentStore.score || 0,
          tasksDone: (p.tasks_done as number) || currentStore.tasksDone || 0,
          streak: (p.streak as number) || currentStore.streak || 1,
        });

        useStationStore.getState().setStats({
          score: (p.score as number) || currentStore.score || 0,
          tasksDone: (p.tasks_done as number) || currentStore.tasksDone || 0,
          streak: (p.streak as number) || currentStore.streak || 1,
        });

        return isOnboarded;
      }

      // If user profile wasn't in profiles table yet, check if auth user metadata has it
      if (authUserMeta?.onboarding_completed || (metaProfile.city && metaProfile.college)) {
        setHasCompletedOnboarding(true);
        login({
          name: (metaProfile.name as string) || (authUserMeta?.name as string) || defaultName || 'Student',
          state: '',
          city: (metaProfile.city as string) || '',
          college: (metaProfile.college as string) || '',
          domain: ((metaProfile.domain as Domain) || 'engineering'),
          degree: (metaProfile.degree as string) || '',
          specialization: (metaProfile.specialization as string) || '',
          year: (metaProfile.year as string) || '',
          semester: (metaProfile.semester as string) || '',
          graduationYear: (metaProfile.graduation_year as string) || '',
          targetRole: (metaProfile.target_role as string) || '',
          targetCompanies: Array.isArray(metaProfile.target_companies) ? (metaProfile.target_companies as string[]) : [],
          dreamCompany: (metaProfile.dream_company as string) || '',
          dreamJob: (metaProfile.target_role as string) || '',
          targetSalary: (metaProfile.target_salary as string) || '',
          timeline: (metaProfile.timeline as string) || '6',
          preparingFor: (metaProfile.preparing_for as string) || undefined,
          targetJobType: (metaProfile.target_job_type as string) || undefined,
          targetGoal: (metaProfile.target_goal as string) || undefined,
          experience: (metaProfile.experience as StudentExperience) || undefined,
          baselineAssessment: (metaProfile.baseline_assessment as BaselineAssessmentResult) || undefined,
          topicCompetencies: (metaProfile.topic_competencies as Record<string, TopicCompetency>) || undefined,
          personalityTrait: (metaProfile.personality_trait as string) || undefined,
          skills: Array.isArray(metaProfile.skills) ? (metaProfile.skills as StudentSkill[]) : [],
          dsaLevel: (metaProfile.dsa_level as ReadinessLevel) || undefined,
          csFundamentalsLevel: (metaProfile.cs_fundamentals_level as ReadinessLevel) || undefined,
          aptitudeLevel: (metaProfile.aptitude_level as ReadinessLevel) || undefined,
          communicationLevel: (metaProfile.communication_level as ReadinessLevel) || undefined,
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        }, {
          score: currentStore.score || 0,
          tasksDone: currentStore.tasksDone || 0,
          streak: currentStore.streak || 1,
        });
        return true;
      }
    } catch {
      // Profile fetch failed (e.g. backend unreachable)
    }

    // Default fallback in store only if user has not completed onboarding
    setHasCompletedOnboarding(false);
    login({
      name: defaultName || 'Student',
      state: '',
      city: '',
      college: '',
      domain: 'engineering',
      specialization: '',
      year: '',
      dreamCompany: '',
      dreamJob: '',
      targetSalary: '',
      timeline: '',
      personalityScore: { iq: 50, eq: 50, rq: 50 },
      weakPoints: [],
    }, {
      score: 0,
      tasksDone: 0,
      streak: 1,
    });
    return false;
  }, [login, user]);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to ensure authentication verification NEVER stalls indefinitely
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 4500);

    // 1. Initial session load
    const initializeAuth = async () => {
      try {
        const getSessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise<{ data: { session: null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: new Error('GetSession timeout') }), 3500)
        );

        const { data: { session: initialSession } } = await Promise.race([getSessionPromise, sessionTimeoutPromise]);
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const userName = (initialSession.user.user_metadata?.name as string) || 'Student';
          await syncUserProfile(initialSession.user.id, userName);
        }
      } catch {
        // If Supabase is unreachable, fail gracefully without crashing
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(authTimeout);
        }
      }
    };

    initializeAuth();

    // 2. Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setHasCompletedOnboarding(false);
        useStationStore.getState().logout();
        setIsLoading(false);
      } else if (currentSession?.user) {
        // Run sync asynchronously so it never deadlocks auth subscription
        const userName = (currentSession.user.user_metadata?.name as string) || 'Student';
        syncUserProfile(currentSession.user.id, userName)
          .catch(() => {})
          .finally(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out encountered error:', formatAuthError(e));
    } finally {
      logout();
      setSession(null);
      setUser(null);
      setIsPasswordRecovery(false);
      setIsLoading(false);
    }
  };

  const refreshProfile = async (userId: string): Promise<boolean> => {
    return syncUserProfile(userId);
  };

  const updateProfile = async (updates: UpdateProfileData): Promise<{ error: Error | null }> => {
    if (!user?.id) {
      return { error: new Error('User is not authenticated') };
    }

    try {
      const payload: Record<string, unknown> = {
        id: user.id,
      };
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.city !== undefined) payload.city = updates.city.trim();
      if (updates.college !== undefined) payload.college = updates.college.trim();
      if (updates.domain !== undefined) payload.domain = updates.domain;
      if (updates.specialization !== undefined) payload.specialization = updates.specialization.trim();
      if (updates.dream_company !== undefined) payload.dream_company = updates.dream_company.trim();
      if (updates.degree !== undefined) payload.degree = updates.degree.trim();
      if (updates.semester !== undefined) payload.semester = updates.semester.trim();
      if (updates.graduation_year !== undefined) payload.graduation_year = updates.graduation_year.trim();
      if (updates.target_role !== undefined) payload.target_role = updates.target_role.trim();
      if (updates.target_companies !== undefined) payload.target_companies = updates.target_companies;
      if (updates.preparing_for !== undefined) payload.preparing_for = updates.preparing_for.trim();
      if (updates.target_job_type !== undefined) payload.target_job_type = updates.target_job_type.trim();
      if (updates.target_goal !== undefined) payload.target_goal = updates.target_goal.trim();
      if (updates.experience !== undefined) payload.experience = updates.experience;
      if (updates.topic_competencies !== undefined) payload.topic_competencies = updates.topic_competencies;
      if (updates.baseline_assessment !== undefined) payload.baseline_assessment = updates.baseline_assessment;
      if (updates.personality_trait !== undefined) payload.personality_trait = updates.personality_trait.trim();
      if (updates.skills !== undefined) payload.skills = updates.skills;
      if (updates.dsa_level !== undefined) payload.dsa_level = updates.dsa_level;
      if (updates.cs_fundamentals_level !== undefined) payload.cs_fundamentals_level = updates.cs_fundamentals_level;
      if (updates.aptitude_level !== undefined) payload.aptitude_level = updates.aptitude_level;
      if (updates.communication_level !== undefined) payload.communication_level = updates.communication_level;
      if (updates.year !== undefined) payload.year = updates.year.trim();
      if (updates.target_salary !== undefined) payload.target_salary = updates.target_salary.trim();
      if (updates.timeline !== undefined) payload.timeline = updates.timeline;
      if (updates.onboarding_completed !== undefined) payload.onboarding_completed = updates.onboarding_completed;

      // 1. Always update Supabase Auth user metadata for zero data loss
      try {
        await supabase.auth.updateUser({
          data: {
            profile: {
              ...(user.user_metadata?.profile || {}),
              ...updates,
            },
            onboarding_completed: updates.onboarding_completed ?? true,
          },
        });
      } catch (authMetaErr) {
        console.warn('Auth user metadata update notice:', authMetaErr);
      }

      // 2. Persist to profiles table with retry on transient network issues
      let upsertError: unknown = null;
      let primaryResult = await supabase.from('profiles').upsert(payload);

      // Retry up to 2 times if transient network/fetch failure (handles Supabase container cold start)
      if (primaryResult.error && isNetworkFetchError(primaryResult.error)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        primaryResult = await supabase.from('profiles').upsert(payload);
        if (primaryResult.error && isNetworkFetchError(primaryResult.error)) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          primaryResult = await supabase.from('profiles').upsert(payload);
        }
      }
      if (primaryResult.error) {
        upsertError = primaryResult.error;
      }

      // Preserve draft updates in local store so entered form data is never lost
      const currentStoreUser = useStationStore.getState().user;
      if (currentStoreUser) {
        useStationStore.getState().login({
          ...currentStoreUser,
          name: updates.name !== undefined ? updates.name : currentStoreUser.name,
          city: updates.city !== undefined ? updates.city : currentStoreUser.city,
          college: updates.college !== undefined ? updates.college : currentStoreUser.college,
          domain: updates.domain !== undefined ? updates.domain : currentStoreUser.domain,
          specialization: updates.specialization !== undefined ? updates.specialization : currentStoreUser.specialization,
          degree: updates.degree !== undefined ? updates.degree : currentStoreUser.degree,
          year: updates.year !== undefined ? updates.year : currentStoreUser.year,
          semester: updates.semester !== undefined ? updates.semester : currentStoreUser.semester,
          graduationYear: updates.graduation_year !== undefined ? updates.graduation_year : currentStoreUser.graduationYear,
          targetRole: updates.target_role !== undefined ? updates.target_role : currentStoreUser.targetRole,
          targetCompanies: updates.target_companies !== undefined ? updates.target_companies : currentStoreUser.targetCompanies,
          dreamCompany: updates.dream_company !== undefined ? updates.dream_company : currentStoreUser.dreamCompany,
          targetSalary: updates.target_salary !== undefined ? updates.target_salary : currentStoreUser.targetSalary,
          timeline: updates.timeline !== undefined ? updates.timeline : currentStoreUser.timeline,
          preparingFor: updates.preparing_for !== undefined ? updates.preparing_for : currentStoreUser.preparingFor,
          targetJobType: updates.target_job_type !== undefined ? updates.target_job_type : currentStoreUser.targetJobType,
          targetGoal: updates.target_goal !== undefined ? updates.target_goal : currentStoreUser.targetGoal,
          experience: updates.experience !== undefined ? updates.experience : currentStoreUser.experience,
          topicCompetencies: updates.topic_competencies !== undefined ? updates.topic_competencies : currentStoreUser.topicCompetencies,
          baselineAssessment: updates.baseline_assessment !== undefined ? updates.baseline_assessment : currentStoreUser.baselineAssessment,
          personalityTrait: updates.personality_trait !== undefined ? updates.personality_trait : currentStoreUser.personalityTrait,
          skills: updates.skills !== undefined ? updates.skills : currentStoreUser.skills,
          dsaLevel: updates.dsa_level !== undefined ? updates.dsa_level : currentStoreUser.dsaLevel,
          csFundamentalsLevel: updates.cs_fundamentals_level !== undefined ? updates.cs_fundamentals_level : currentStoreUser.csFundamentalsLevel,
          aptitudeLevel: updates.aptitude_level !== undefined ? updates.aptitude_level : currentStoreUser.aptitudeLevel,
          communicationLevel: updates.communication_level !== undefined ? updates.communication_level : currentStoreUser.communicationLevel,
        });
      }

      // If cloud persistence failed, do NOT mark onboarding as completed and return the error
      if (upsertError) {
        return { error: new Error(formatAuthError(upsertError)) };
      }

      // Cloud persistence succeeded: mark onboarding complete
      if (updates.onboarding_completed || (updates.city && updates.college)) {
        setHasCompletedOnboarding(true);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(formatAuthError(err)) };
    }
  };

  const recordProgress = useCallback(
    async (options: { scoreDelta?: number; taskCompleted?: boolean; streak?: number }) => {
      const store = useStationStore.getState();
      const currentScore = store.score || 0;
      const currentTasks = store.tasksDone || 0;
      const currentStreak = store.streak || 1;

      const newScore = Math.max(0, currentScore + (options.scoreDelta || 0));
      const newTasks = Math.max(0, currentTasks + (options.taskCompleted ? 1 : 0));
      const newStreak = options.streak !== undefined ? options.streak : currentStreak;

      store.setStats({
        score: newScore,
        tasksDone: newTasks,
        streak: newStreak,
      });

      if (user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              score: newScore,
              tasks_done: newTasks,
              streak: newStreak,
            })
            .eq('id', user.id);
        } catch {
          // Offline / network failure resilience
        }
      }
    },
    [user]
  );

  const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(formatAuthError(err)) };
    }
  };

  const updateEmail = async (newEmail: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(formatAuthError(err)) };
    }
  };

  const resetPasswordForEmail = async (emailToReset: string): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(formatAuthError(err)) };
    }
  };

  const signInWithGoogle = async (options?: { redirectTo?: string }): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = options?.redirectTo || `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(formatAuthError(err)) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session?.user,
        hasCompletedOnboarding,
        isPasswordRecovery,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword,
        updateEmail,
        resetPasswordForEmail,
        recordProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
