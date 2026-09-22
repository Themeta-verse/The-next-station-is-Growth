import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, formatAuthError } from '@/integrations/supabase/client';
import { useStationStore, type Domain } from '@/store/useStationStore';

export interface UpdateProfileData {
  name?: string;
  city?: string;
  college?: string;
  domain?: Domain;
  specialization?: string;
  dream_company?: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const { login } = useStationStore();

  const syncUserProfile = useCallback(async (userId: string, defaultName?: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        const isOnboarded = Boolean(
          profile.city && profile.city.trim() !== '' &&
          profile.college && profile.college.trim() !== ''
        );
        setHasCompletedOnboarding(isOnboarded);

        login({
          name: profile.name || defaultName || 'Student',
          state: '',
          city: profile.city || '',
          college: profile.college || '',
          domain: (profile.domain as Domain) || 'engineering',
          specialization: profile.specialization || '',
          year: '',
          dreamCompany: profile.dream_company || '',
          dreamJob: '',
          targetSalary: '',
          timeline: '',
          personalityScore: { iq: 50, eq: 50, rq: 50 },
          weakPoints: [],
        }, {
          score: profile.score || 0,
          tasksDone: profile.tasks_done || 0,
          streak: profile.streak || 1,
        });

        useStationStore.getState().setStats({
          score: profile.score || 0,
          tasksDone: profile.tasks_done || 0,
          streak: profile.streak || 1,
        });

        return isOnboarded;
      }
    } catch {
      // Profile fetch failed (e.g. backend unreachable or new user without profile row)
    }

    // Default fallback in store if profile doesn't exist yet
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
  }, [login]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session load
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
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
        }
      }
    };

    initializeAuth();

    // 2. Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_IN' && currentSession?.user) {
        const userName = (currentSession.user.user_metadata?.name as string) || 'Student';
        await syncUserProfile(currentSession.user.id, userName);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setHasCompletedOnboarding(false);
        useStationStore.getState().logout();
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
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

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }

      // Sync Zustand store
      const currentStoreUser = useStationStore.getState().user;
      if (currentStoreUser) {
        useStationStore.getState().login({
          ...currentStoreUser,
          name: updates.name !== undefined ? updates.name : currentStoreUser.name,
          city: updates.city !== undefined ? updates.city : currentStoreUser.city,
          college: updates.college !== undefined ? updates.college : currentStoreUser.college,
          domain: updates.domain !== undefined ? updates.domain : currentStoreUser.domain,
          specialization: updates.specialization !== undefined ? updates.specialization : currentStoreUser.specialization,
          dreamCompany: updates.dream_company !== undefined ? updates.dream_company : currentStoreUser.dreamCompany,
        });
      }

      if (updates.city && updates.college) {
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
