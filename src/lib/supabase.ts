import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthAccessMode = 'strict' | 'guest_readonly';

const configuredMode = String(import.meta.env.VITE_AUTH_ACCESS_MODE || 'strict').toLowerCase();

export const authAccessMode: AuthAccessMode =
  configuredMode === 'guest_readonly' ? 'guest_readonly' : 'strict';

export const allowGuestReadOnly = authAccessMode === 'guest_readonly';

export const requireEmailVerification =
  String(import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION ?? 'true').toLowerCase() !== 'false';

export function getAuthRedirectUrl() {
  const configuredRedirect = String(import.meta.env.VITE_AUTH_REDIRECT_URL || '').trim();
  if (configuredRedirect.length > 0) return configuredRedirect;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}
