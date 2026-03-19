import { supabase, hasSupabaseConfig } from '../lib/supabase-client.js';

function requireClient() {
  if (!hasSupabaseConfig() || !supabase) throw new Error('config.js 에 Supabase URL / Publishable Key를 먼저 입력해줘.');
  return supabase;
}

export async function getPublishedPrograms() {
  const client = requireClient();
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
  return (data || []).map((row) => ({
    ...row,
    program: row.programs
  }));
}

export async function getPublicFormBundle(formId) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_public_form_bundle', { p_form_id: formId });
  if (error) throw error;
  return data;
}

export async function getOptionCounts(formId) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_option_counts', { p_form_id: formId });
  if (error) throw error;
  return data || [];
}

export async function submitForm(payload) {
  const client = requireClient();
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
  const { data, error } = await client
    .from('faqs')
    .select('id,question,answer,sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
