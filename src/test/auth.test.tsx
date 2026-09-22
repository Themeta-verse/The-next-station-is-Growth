import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { formatAuthError, isSupabaseConfigured } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as AuthContextModule from '@/context/AuthContext';

describe('formatAuthError', () => {
  it('translates "Failed to fetch" into a clear, actionable message', () => {
    const error = new Error('Failed to fetch');
    const result = formatAuthError(error);
    expect(result).toContain('Unable to connect to the authentication server');
    expect(result).toContain('VITE_SUPABASE_URL');
  });

  it('translates "fetch failed" into a clear, actionable message', () => {
    const error = { message: 'fetch failed' };
    const result = formatAuthError(error);
    expect(result).toContain('Unable to connect to the authentication server');
  });

  it('translates AuthRetryableFetchError into a clear message', () => {
    const error = { name: 'AuthRetryableFetchError', message: 'AuthRetryableFetchError: Failed to fetch' };
    const result = formatAuthError(error);
    expect(result).toContain('Unable to connect to the authentication server');
  });

  it('translates "Invalid login credentials"', () => {
    const error = { message: 'Invalid login credentials' };
    const result = formatAuthError(error);
    expect(result).toBe('Invalid email or password. Please verify your credentials and try again.');
  });

  it('translates "User already registered"', () => {
    const error = { message: 'User already registered' };
    const result = formatAuthError(error);
    expect(result).toBe('An account with this email already exists. Please sign in instead.');
  });

  it('translates password length errors', () => {
    const error = { message: 'Password should be at least 6 characters' };
    const result = formatAuthError(error);
    expect(result).toContain('Password must be at least 6 characters long');
  });

  it('translates rate limit errors', () => {
    const error = { message: 'email rate limit exceeded' };
    const result = formatAuthError(error);
    expect(result).toContain('Email rate limit exceeded');
  });

  it('translates user not found errors', () => {
    const error = { message: 'user not found' };
    const result = formatAuthError(error);
    expect(result).toContain('No account was found with this email address.');
  });

  it('translates same password error', () => {
    const error = { message: 'New password should be different from the old password' };
    const result = formatAuthError(error);
    expect(result).toContain('Your new password must be different from your current password.');
  });

  it('translates "provider is not enabled" into actionable dashboard setup instructions', () => {
    const error = { message: 'Unsupported provider: provider is not enabled' };
    const result = formatAuthError(error);
    expect(result).toContain('Google sign-in is not yet enabled in your Supabase project dashboard');
    expect(result).toContain('Authentication > Providers');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatAuthError(null)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('isSupabaseConfigured', () => {
  it('returns a boolean value indicating configuration status', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });
});

describe('ProtectedRoute component', () => {
  it('shows loading state while auth is being initialized', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      signOut: async () => {},
      refreshProfile: async () => false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users away from protected route to /auth', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: async () => {},
      refreshProfile: async () => false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/auth" element={<div>Auth Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Auth Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to view protected content', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'test-user-id' } as unknown as import('@supabase/supabase-js').User,
      session: { user: { id: 'test-user-id' } } as unknown as import('@supabase/supabase-js').Session,
      isLoading: false,
      isAuthenticated: true,
      signOut: async () => {},
      refreshProfile: async () => true,
    });


    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Dashboard Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
  });

  it('blocks unauthenticated access to /profile and redirects to /auth', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: async () => {},
      refreshProfile: async () => false,
    });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Auth Page')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('blocks unauthenticated access to /settings and redirects to /auth', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: async () => {},
      refreshProfile: async () => false,
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div>Settings Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Auth Page')).toBeInTheDocument();
    expect(screen.queryByText('Settings Page')).not.toBeInTheDocument();
  });
});
