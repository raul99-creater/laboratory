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

export function getStorageModeLabel() {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}
