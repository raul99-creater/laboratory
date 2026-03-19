import { getBootstrapData } from './bootstrap-data.js';
import { getSupabaseClient, getStorageModeLabel, getSiteSlug, isSupabaseConfigured } from './supabase-client.js';

const STORAGE_KEY = 'gyulgyul_hub_data_v2';
const PROFILE_KEY = 'gyulgyul_hub_viewer_profile_v1';

let stateCache = null;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeData(value) {
  return {
    lectures: Array.isArray(value?.lectures) ? value.lectures : [],
    forms: Array.isArray(value?.forms) ? value.forms : [],
    submissions: Array.isArray(value?.submissions) ? value.submissions : []
  };
}

function mergeSubmissions(publicSubs = [], localSubs = []) {
  const map = new Map();
  publicSubs.forEach((item) => map.set(item.id, item));
  localSubs.forEach((item) => {
    const current = map.get(item.id) || {};
    map.set(item.id, { ...current, ...item });
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function getDefaultData() {
  return deepClone(getBootstrapData());
}

function readLocalState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return normalizeData(JSON.parse(raw));
  } catch {
    const initial = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeLocalState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

export async function initStorage() {
  const localState = readLocalState();
  stateCache = normalizeData(localState);
  if (!isSupabaseConfigured()) return deepClone(stateCache);

  try {
    const client = getSupabaseClient();
    const [{ data: stateRow }, { data: publicSubs }] = await Promise.all([
      client.from('site_state').select('payload').eq('slug', getSiteSlug()).maybeSingle(),
      client.from('submission_public').select('id, form_id, answers, selected_events, created_at').order('created_at', { ascending: false })
    ]);

    const remoteBase = stateRow?.payload ? normalizeData({ ...stateRow.payload, submissions: [] }) : normalizeData(localState);
    const remoteSubs = (publicSubs || []).map((item) => ({
      id: item.id,
      formId: item.form_id,
      answers: item.answers || [],
      selectedEvents: item.selected_events || [],
      createdAt: item.created_at
    }));

    stateCache = normalizeData({
      ...remoteBase,
      submissions: mergeSubmissions(remoteSubs, localState.submissions || [])
    });
    writeLocalState(stateCache);
  } catch (error) {
    console.warn('[storage:initStorage]', error);
  }

  return deepClone(stateCache);
}

export function loadData() {
  if (!stateCache) stateCache = readLocalState();
  return deepClone(stateCache);
}

export function saveData(data) {
  stateCache = normalizeData(data);
  writeLocalState(stateCache);
  return Promise.resolve({ ok: true, mode: getStorageModeLabel() });
}

export function resetData() {
  stateCache = getDefaultData();
  writeLocalState(stateCache);
}

export async function submitSubmission(submission) {
  const localState = loadData();
  localState.submissions.unshift(submission);
  saveData(localState);

  if (!isSupabaseConfigured()) {
    return { ok: true, mode: 'local' };
  }

  try {
    const { error } = await getSupabaseClient().from('submissions').insert({
      id: submission.id,
      form_id: submission.formId,
      viewer_key: submission.viewerKey || '',
      viewer_name: submission.viewerName || '',
      viewer_phone: submission.viewerPhone || '',
      answers: submission.answers || [],
      selected_events: submission.selectedEvents || [],
      created_at: submission.createdAt
    });
    if (error) throw error;
    await initStorage();
    return { ok: true, mode: 'supabase' };
  } catch (error) {
    console.warn('[storage:submitSubmission]', error);
    return { ok: false, mode: 'supabase', error };
  }
}

export function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return { viewerKey: '', viewerName: '', viewerPhone: '' };
  try {
    return JSON.parse(raw);
  } catch {
    return { viewerKey: '', viewerName: '', viewerPhone: '' };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
