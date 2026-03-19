import { getBootstrapData } from './bootstrap-data.js';
import { getCurrentUser, getSiteSlug, getSupabaseClient, isApprovedAdmin, isSupabaseConfigured, getStorageModeLabel } from './supabase-client.js';

const STORAGE_KEY = 'gyulgyul_admin_data_v2';
const PROFILE_KEY = 'gyulgyul_admin_profile_v1';

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
    const [{ data: stateRow }, user, approved] = await Promise.all([
      client.from('site_state').select('payload').eq('slug', getSiteSlug()).maybeSingle(),
      getCurrentUser(),
      isApprovedAdmin()
    ]);

    const remoteBase = stateRow?.payload ? normalizeData({ ...stateRow.payload, submissions: [] }) : normalizeData(localState);
    stateCache = normalizeData({ ...remoteBase, submissions: localState.submissions || [] });

    if (user && approved) {
      const { data: submissions } = await client.from('submissions').select('id, form_id, viewer_key, viewer_name, viewer_phone, answers, selected_events, created_at').order('created_at', { ascending: false });
      stateCache.submissions = (submissions || []).map((item) => ({
        id: item.id,
        formId: item.form_id,
        viewerKey: item.viewer_key || '',
        viewerName: item.viewer_name || '',
        viewerPhone: item.viewer_phone || '',
        answers: item.answers || [],
        selectedEvents: item.selected_events || [],
        createdAt: item.created_at
      }));
    }
    writeLocalState(stateCache);
  } catch (error) {
    console.warn('[admin-storage:initStorage]', error);
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

export async function pushToRemote() {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'Supabase 미설정' };
  const approved = await isApprovedAdmin();
  if (!approved) return { ok: false, reason: '승인된 관리자 계정이 아님' };
  const payload = loadData();
  const body = {
    slug: getSiteSlug(),
    payload: {
      lectures: payload.lectures || [],
      forms: payload.forms || []
    },
    updated_at: new Date().toISOString()
  };
  const { error } = await getSupabaseClient().from('site_state').upsert(body, { onConflict: 'slug' });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function pullFromRemote() {
  return initStorage();
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
