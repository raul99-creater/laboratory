
import { supabase, hasSupabaseConfig } from '../lib/supabase-client.js';
import * as demo from '../lib/demo-db.js';

function requireClient() {
  if (!hasSupabaseConfig() || !supabase) return null;
  return supabase;
}

export function isDemoMode() {
  return !requireClient();
}

export function getModeBannerText() {
  return demo.getDemoBannerText('web');
}

export async function getPublishedPrograms() {
  const client = requireClient();
  if (!client) return demo.getPublishedPrograms();
  const { data, error } = await client
    .from('programs')
    .select('id,slug,name,summary,description,cover_note,is_published,sort_order,created_at')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPublishedForms() {
  const client = requireClient();
  if (!client) return demo.getPublishedForms();
  const { data, error } = await client
    .from('forms')
    .select(`
      id,title,description,global_deadline_at,max_responses,sort_order,program_id,
      programs!inner(id,name,slug,summary,is_published)
    `)
    .eq('is_published', true)
    .eq('programs.is_published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, program: row.programs }));
}

export async function getPublicFormBundle(formId) {
  const client = requireClient();
  if (!client) return demo.getPublicFormBundle(formId);
  const { data, error } = await client.rpc('get_public_form_bundle', { p_form_id: formId });
  if (error) throw error;
  return data;
}

export async function getOptionCounts(formId) {
  const client = requireClient();
  if (!client) return demo.getOptionCounts(formId);
  const { data, error } = await client.rpc('get_option_counts', { p_form_id: formId });
  if (error) throw error;
  return data || [];
}

export async function submitForm(payload) {
  const client = requireClient();
  if (!client) return demo.submitForm(payload);
  const { data, error } = await client.rpc('submit_form', {
    p_form_id: payload.formId,
    p_participant_name: payload.participantName,
    p_participant_phone: payload.participantPhone,
    p_participant_email: payload.participantEmail || null,
    p_answers: payload.answers
  });
  if (error) throw error;
  return data;
}

export async function getFaqs() {
  const client = requireClient();
  if (!client) return demo.getFaqs();
  const { data, error } = await client
    .from('faqs')
    .select('id,question,answer,sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
