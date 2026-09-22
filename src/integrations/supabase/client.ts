import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check whether Supabase has a valid-looking configuration
export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (rawUrl.includes('your-project-id') || rawUrl.includes('placeholder')) return false;
  return true;
};

// Safe fallback for client initialization so the application does not crash
// if environment variables are missing during initial setup
const SUPABASE_URL = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = rawKey && rawKey.length > 0 ? rawKey : 'placeholder-anon-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Formats authentication and network errors into clear, actionable user messages
 * rather than exposing raw technical errors like "Failed to fetch".
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : String(error);

  const lower = message.toLowerCase();

  // Network / Reachability / DNS / CORS errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('authretryablefetcherror')
  ) {
    return 'Unable to connect to the authentication server. The configured Supabase project appears unreachable or offline. Please check your internet connection or verify the VITE_SUPABASE_URL in your .env file.';
  }

  // Common Supabase auth messages
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (lower.includes('user already registered') || lower.includes('email already in use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (lower.includes('password should be at least') || lower.includes('weak password')) {
    return 'Password must be at least 6 characters long and meet security requirements.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (lower.includes('over_email_send_rate_limit') || lower.includes('email rate limit exceeded')) {
    return 'Email rate limit exceeded. Please wait a few minutes before requesting another verification or reset email.';
  }

  if (lower.includes('user not found')) {
    return 'No account was found with this email address.';
  }

  if (lower.includes('same password') || lower.includes('different from the old password')) {
    return 'Your new password must be different from your current password.';
  }

  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'Google sign-in is not yet enabled in your Supabase project dashboard. Please enable Google under Authentication > Providers in Supabase.';
  }

  // Google OAuth cancellation / access denied
  if (
    lower.includes('access_denied') ||
    lower.includes('user cancelled') ||
    lower.includes('consent_denied') ||
    lower.includes('user_denied')
  ) {
    return 'Google sign-in was cancelled or access was denied. Please try again.';
  }

  if (lower.includes('popup_closed_by_user') || lower.includes('window closed')) {
    return 'The Google sign-in window was closed before completing authentication.';
  }

  // Session expiration
  if (
    lower.includes('session expired') ||
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('token is expired or invalid') ||
    lower.includes('otp_expired')
  ) {
    return 'Your authentication session has expired. Please sign in again.';
  }

  // Temporary service outage
  if (
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('bad gateway') ||
    lower.includes('gateway timeout') ||
    lower.includes('service unavailable')
  ) {
    return 'The authentication service is temporarily unavailable. Please try again in a few moments.';
  }

  if (lower.includes('email address is invalid') || lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (lower.includes('signup is disabled') || lower.includes('signups not allowed')) {
    return 'Account registrations are currently disabled on this project.';
  }

  return message;
}

/**
 * Detects and extracts authentication errors passed via URL query parameters
 * or hash fragments (commonly returned by OAuth providers upon cancellation or failure).
 */
export function getUrlAuthError(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check query parameters (?error=...&error_description=...)
    const searchParams = new URLSearchParams(window.location.search);
    const searchDesc = searchParams.get('error_description');
    const searchErr = searchParams.get('error');
    if (searchDesc || searchErr) {
      return formatAuthError(searchDesc || searchErr);
    }

    // 2. Check hash parameters (#error=...&error_description=...)
    if (window.location.hash) {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const hashDesc = hashParams.get('error_description');
      const hashErr = hashParams.get('error');
      if (hashDesc || hashErr) {
        return formatAuthError(hashDesc || hashErr);
      }
    }
  } catch {
    // URL parsing guard
  }

  return null;
}

/**
 * Removes auth hash and query error parameters from browser history without reloading the page.
 */
export function clearUrlAuthParams(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  try {
    const url = new URL(window.location.href);
    let changed = false;

    if (url.searchParams.has('error') || url.searchParams.has('error_description') || url.searchParams.has('error_code')) {
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('error_code');
      changed = true;
    }

    if (url.hash && (url.hash.includes('error=') || url.hash.includes('error_description='))) {
      url.hash = '';
      changed = true;
    }

    if (changed) {
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    }
  } catch {
    // History mutation guard
  }
}
