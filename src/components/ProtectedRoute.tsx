import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, RotateCcw } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasCompletedOnboarding, signOut } = useAuth();
  const location = useLocation();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isLoading) {
      timer = setTimeout(() => setShowSlowNotice(true), 3500);
    } else {
      setShowSlowNotice(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in text-center max-w-xs">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground font-medium">Verifying authentication...</p>
          {showSlowNotice && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <p className="text-xs text-muted-foreground">Connecting took longer than expected.</p>
              <div className="flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Sign In Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination so user can be redirected after successful login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but hasn't completed onboarding, and is trying to access dashboard
  if (!hasCompletedOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
