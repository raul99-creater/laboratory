import { supabase, hasSupabaseConfig } from '../lib/supabase-client.js';

function requireClient() {
  if (!hasSupabaseConfig() || !supabase) throw new Error('config.js 에 Supabase URL / Publishable Key를 먼저 입력해줘.');
  return supabase;
}

export async function getSession() {
  const client = requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function loadAdminBundle() {
  const client = requireClient();
  const [programs, forms, questions, options, submissions, faqs] = await Promise.all([
    client.from('programs').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    client.from('forms').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    client.from('form_questions').select('*').order('sort_order', { ascending: true }),
    client.from('form_options').select('*').order('sort_order', { ascending: true }),
    client.from('submissions').select('id,form_id,participant_name,participant_phone,created_at').order('created_at', { ascending: false }).limit(50),
    client.from('faqs').select('*').order('sort_order', { ascending: true })
  ]);

  for (const result of [programs, forms, questions, options, submissions, faqs]) {
    if (result.error) throw result.error;
  }

  return {
    programs: programs.data || [],
    forms: forms.data || [],
    questions: questions.data || [],
    options: options.data || [],
    submissions: submissions.data || [],
    faqs: faqs.data || []
  };
}

export async function insertProgram(payload) {
  const client = requireClient();
  const { data, error } = await client.from('programs').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProgram(id, payload) {
  const client = requireClient();
  const { data, error } = await client.from('programs').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProgram(id) {
  const client = requireClient();
  const { error } = await client.from('programs').delete().eq('id', id);
  if (error) throw error;
}

export async function insertForm(payload) {
  const client = requireClient();
  const { data, error } = await client.from('forms').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateForm(id, payload) {
  const client = requireClient();
  const { data, error } = await client.from('forms').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteForm(id) {
  const client = requireClient();
  const { error } = await client.from('forms').delete().eq('id', id);
  if (error) throw error;
}

export async function insertQuestion(payload) {
  const client = requireClient();
  const { data, error } = await client.from('form_questions').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, payload) {
  const client = requireClient();
  const { data, error } = await client.from('form_questions').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQuestion(id) {
  const client = requireClient();
  const { error } = await client.from('form_questions').delete().eq('id', id);
  if (error) throw error;
}

export async function insertOption(payload) {
  const client = requireClient();
  const { data, error } = await client.from('form_options').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateOption(id, payload) {
  const client = requireClient();
  const { data, error } = await client.from('form_options').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOption(id) {
  const client = requireClient();
  const { error } = await client.from('form_options').delete().eq('id', id);
  if (error) throw error;
}

export async function insertFaq(payload) {
  const client = requireClient();
  const { data, error } = await client.from('faqs').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateFaq(id, payload) {
  const client = requireClient();
  const { data, error } = await client.from('faqs').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFaq(id) {
  const client = requireClient();
  const { error } = await client.from('faqs').delete().eq('id', id);
  if (error) throw error;
}
