import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, SUPABASE_SITE_SLUG } from './config.js';

let client;

export function getSupabaseKey() {
  return SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY || '';
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && getSupabaseKey());
}

export function getSiteSlug() {
  return SUPABASE_SITE_SLUG || 'gyulgyul-main';
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, getSupabaseKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function signUpWithPassword(email, password) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase 미설정') };
  return getSupabaseClient().auth.signUp({ email, password });
}

export async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured()) return { error: new Error('Supabase 미설정') };
  return getSupabaseClient().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!isSupabaseConfigured()) return { error: null };
  return getSupabaseClient().auth.signOut();
}

export async function isApprovedAdmin() {
  const user = await getCurrentUser();
  if (!user?.email || !isSupabaseConfigured()) return false;
  const { data, error } = await getSupabaseClient()
    .from('admin_emails')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();
  return !error && !!data;
}

export function getStorageModeLabel() {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}
