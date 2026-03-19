
const STORAGE_KEY = 'gyulgyul-supabase-demo-v2';
const SESSION_KEY = 'gyulgyul-supabase-demo-session';

function uuid(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso(offsetDays = 0, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seed() {
  const program1 = 'p-open-house';
  const program2 = 'p-studio-tour';
  const program3 = 'p-community';

  const form1 = 'f-open-house';
  const form2 = 'f-studio-tour';
  const form3 = 'f-community';

  const q11 = 'q11';
  const q12 = 'q12';
  const q13 = 'q13';
  const q14 = 'q14';
  const q21 = 'q21';
  const q22 = 'q22';
  const q23 = 'q23';
  const q31 = 'q31';
  const q32 = 'q32';

  const created = nowIso(-2, 9, 0);

  return {
    programs: [
      {
        id: program1,
        slug: 'open-house',
        name: '귤귤 오픈하우스',
        summary: '공간 소개, 브랜드 흐름 설명, 간단한 네트워킹이 섞인 공개 일정',
        description: '처음 들어오는 사람도 한 번에 이해할 수 있도록 구성된 대표 프로그램입니다.',
        cover_note: '메인 비주얼 이미지는 나중에 넣고, 지금은 구조와 신청 흐름부터 먼저 확인하면 됩니다.',
        is_published: true,
        sort_order: 10,
        created_at: created,
        updated_at: created
      },
      {
        id: program2,
        slug: 'studio-tour',
        name: '스튜디오 투어 데이',
        summary: '시간대별 정원과 마감이 다르게 잡히는 현장 투어형 프로그램',
        description: '오프라인 현장형 신청 구조를 테스트하기 좋은 샘플입니다.',
        cover_note: null,
        is_published: true,
        sort_order: 20,
        created_at: created,
        updated_at: created
      },
      {
        id: program3,
        slug: 'community-round',
        name: '커뮤니티 라운드',
        summary: '관심 주제별 라운드 테이블 신청',
        description: '복수 선택 질문과 단일 일정 선택 질문을 함께 테스트할 수 있습니다.',
        cover_note: null,
        is_published: true,
        sort_order: 30,
        created_at: created,
        updated_at: created
      }
    ],
    forms: [
      {
        id: form1,
        program_id: program1,
        title: '4월 오픈하우스 신청',
        description: '가능한 시간대를 하나 고르면 신청 후 캘린더 파일도 바로 저장할 수 있습니다.',
        global_deadline_at: nowIso(7, 22, 0),
        max_responses: 80,
        is_published: true,
        sort_order: 10,
        created_at: created,
        updated_at: created
      },
      {
        id: form2,
        program_id: program2,
        title: '스튜디오 투어 좌석 신청',
        description: '현장 투어 좌석은 회차별 정원이 다릅니다.',
        global_deadline_at: nowIso(10, 18, 0),
        max_responses: 60,
        is_published: true,
        sort_order: 20,
        created_at: created,
        updated_at: created
      },
      {
        id: form3,
        program_id: program3,
        title: '커뮤니티 라운드 신청',
        description: '라운드 하나를 선택하고 관심 주제를 복수 선택할 수 있습니다.',
        global_deadline_at: nowIso(12, 19, 0),
        max_responses: 40,
        is_published: true,
        sort_order: 30,
        created_at: created,
        updated_at: created
      }
    ],
    questions: [
      { id: q11, form_id: form1, question_type: 'short', title: '이름', description: '', is_required: true, sort_order: 10, created_at: created, updated_at: created },
      { id: q12, form_id: form1, question_type: 'short', title: '연락처', description: '', is_required: true, sort_order: 20, created_at: created, updated_at: created },
      { id: q13, form_id: form1, question_type: 'single', title: '참여 시간대 선택', description: '가능한 회차를 하나 선택하세요.', is_required: true, sort_order: 30, created_at: created, updated_at: created },
      { id: q14, form_id: form1, question_type: 'paragraph', title: '남기고 싶은 메모', description: '', is_required: false, sort_order: 40, created_at: created, updated_at: created },
      { id: q21, form_id: form2, question_type: 'short', title: '이름', description: '', is_required: true, sort_order: 10, created_at: created, updated_at: created },
      { id: q22, form_id: form2, question_type: 'dropdown', title: '투어 회차 선택', description: '회차를 하나 선택하세요.', is_required: true, sort_order: 20, created_at: created, updated_at: created },
      { id: q23, form_id: form2, question_type: 'paragraph', title: '궁금한 점', description: '', is_required: false, sort_order: 30, created_at: created, updated_at: created },
      { id: q31, form_id: form3, question_type: 'dropdown', title: '원하는 라운드 선택', description: '주제를 하나 선택하세요.', is_required: true, sort_order: 10, created_at: created, updated_at: created },
      { id: q32, form_id: form3, question_type: 'multi', title: '관심 있는 운영 포인트', description: '복수 선택 가능', is_required: false, sort_order: 20, created_at: created, updated_at: created }
    ],
    options: [
      { id: 'o131', question_id: q13, label: '토요일 14:00 공간 투어', deadline_at: nowIso(5, 23, 0), capacity: 20, event_start_at: nowIso(8, 14, 0), event_end_at: nowIso(8, 16, 0), sort_order: 10, created_at: created, updated_at: created },
      { id: 'o132', question_id: q13, label: '토요일 17:00 네트워킹', deadline_at: nowIso(5, 23, 0), capacity: 24, event_start_at: nowIso(8, 17, 0), event_end_at: nowIso(8, 19, 0), sort_order: 20, created_at: created, updated_at: created },
      { id: 'o133', question_id: q13, label: '일요일 13:00 라이트 투어', deadline_at: nowIso(6, 23, 0), capacity: 18, event_start_at: nowIso(9, 13, 0), event_end_at: nowIso(9, 14, 30), sort_order: 30, created_at: created, updated_at: created },
      { id: 'o221', question_id: q22, label: '평일 16:00 스튜디오 투어', deadline_at: nowIso(8, 20, 0), capacity: 12, event_start_at: nowIso(11, 16, 0), event_end_at: nowIso(11, 17, 30), sort_order: 10, created_at: created, updated_at: created },
      { id: 'o222', question_id: q22, label: '주말 11:00 스튜디오 투어', deadline_at: nowIso(9, 18, 0), capacity: 18, event_start_at: nowIso(12, 11, 0), event_end_at: nowIso(12, 12, 30), sort_order: 20, created_at: created, updated_at: created },
      { id: 'o311', question_id: q31, label: '브랜드 톤 정리 라운드', deadline_at: nowIso(10, 17, 0), capacity: 10, event_start_at: nowIso(13, 19, 0), event_end_at: nowIso(13, 21, 0), sort_order: 10, created_at: created, updated_at: created },
      { id: 'o312', question_id: q31, label: '오프라인 운영 체크 라운드', deadline_at: nowIso(11, 17, 0), capacity: 12, event_start_at: nowIso(14, 14, 0), event_end_at: nowIso(14, 16, 0), sort_order: 20, created_at: created, updated_at: created },
      { id: 'o321', question_id: q32, label: '브랜딩', deadline_at: null, capacity: null, event_start_at: null, event_end_at: null, sort_order: 10, created_at: created, updated_at: created },
      { id: 'o322', question_id: q32, label: '현장 운영', deadline_at: null, capacity: null, event_start_at: null, event_end_at: null, sort_order: 20, created_at: created, updated_at: created },
      { id: 'o323', question_id: q32, label: '콘텐츠 흐름', deadline_at: null, capacity: null, event_start_at: null, event_end_at: null, sort_order: 30, created_at: created, updated_at: created }
    ],
    faqs: [
      { id: 'faq1', question: 'Supabase 연결 전에도 화면을 확인할 수 있어?', answer: '네. 이 패키지는 config.js를 비워둔 상태에서도 데모 모드로 UI와 폼 동작을 바로 확인할 수 있습니다.', is_published: true, sort_order: 10, created_at: created, updated_at: created },
      { id: 'faq2', question: '어드민 화면에서 미리 무엇을 테스트할 수 있어?', answer: '프로그램 추가, 폼 생성, 질문/선택지 편집, FAQ 등록, 제출 확인까지 전부 데모 모드에서 연습할 수 있습니다.', is_published: true, sort_order: 20, created_at: created, updated_at: created },
      { id: 'faq3', question: '나중에 카카오 일정봇도 붙일 수 있어?', answer: '가능합니다. 지금 구조는 programs / forms / questions / options / submissions 중심이라 Edge Functions와 챗봇 스킬 서버로 확장하기 좋습니다.', is_published: true, sort_order: 30, created_at: created, updated_at: created }
    ],
    submissions: [],
    submission_answers: []
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seed();
      saveDb(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    const seeded = seed();
    saveDb(seeded);
    return seeded;
  }
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

function updated(payload) {
  return { ...payload, updated_at: new Date().toISOString() };
}

function listBySort(rows) {
  return clone(rows).sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100) || new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

export function isDemoMode() {
  return true;
}

export function getDemoBannerText(scope = 'web') {
  return scope === 'admin'
    ? '데모 모드: 지금은 localStorage 샘플 데이터로 화면과 기능이 바로 동작합니다. config.js에 Supabase 값을 넣으면 실데이터 모드로 전환됩니다.'
    : '데모 모드: config.js를 아직 비워둔 상태여도 샘플 프로그램/신청 폼이 보입니다. Supabase 연결 후에는 같은 UI가 실데이터를 읽습니다.';
}

export function getDb() {
  return loadDb();
}

export function resetDb() {
  const seeded = seed();
  saveDb(seeded);
  return clone(seeded);
}

export function exportDb() {
  return JSON.stringify(loadDb(), null, 2);
}

export function importDb(jsonText) {
  const parsed = JSON.parse(jsonText);
  saveDb(parsed);
  return clone(parsed);
}

export function getDemoSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setDemoSession(email) {
  const session = { user: { email }, access_token: 'demo-token' };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearDemoSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function getPublishedPrograms() {
  const db = loadDb();
  return listBySort(db.programs.filter((row) => row.is_published));
}

export async function getFaqs() {
  const db = loadDb();
  return listBySort(db.faqs.filter((row) => row.is_published));
}

export async function getPublishedForms() {
  const db = loadDb();
  const programs = new Map(db.programs.filter((row) => row.is_published).map((row) => [row.id, row]));
  return listBySort(db.forms.filter((form) => form.is_published && programs.has(form.program_id))).map((form) => ({
    ...form,
    program: clone(programs.get(form.program_id))
  }));
}

export async function getPublicFormBundle(formId) {
  const db = loadDb();
  const form = db.forms.find((row) => row.id === formId && row.is_published);
  if (!form) throw new Error('공개된 폼이 아니야.');
  const program = db.programs.find((row) => row.id === form.program_id && row.is_published);
  if (!program) throw new Error('연결된 프로그램이 공개 상태가 아니야.');
  const questions = listBySort(db.questions.filter((row) => row.form_id === form.id)).map((question) => ({
    ...clone(question),
    options: listBySort(db.options.filter((opt) => opt.question_id === question.id))
  }));
  return {
    form: { ...clone(form), response_count: db.submissions.filter((row) => row.form_id === form.id).length },
    program: clone(program),
    questions
  };
}

export async function getOptionCounts(formId) {
  const db = loadDb();
  const answers = db.submission_answers.filter((row) => row.form_id === formId);
  const bucket = new Map();
  for (const answer of answers) {
    for (const optionId of answer.option_ids || []) {
      const key = `${answer.question_id}__${optionId}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }
  }
  return [...bucket.entries()].map(([key, used_count]) => {
    const [question_id, option_id] = key.split('__');
    return { question_id, option_id, used_count };
  });
}

export async function submitForm(payload) {
  const db = loadDb();
  const form = db.forms.find((row) => row.id === payload.formId && row.is_published);
  if (!form) throw new Error('공개된 폼이 아니야.');
  const program = db.programs.find((row) => row.id === form.program_id && row.is_published);
  if (!program) throw new Error('공개된 프로그램이 아니야.');
  if (!payload.participantName?.trim()) throw new Error('이름은 필수야.');
  if (!payload.participantPhone?.trim()) throw new Error('연락처는 필수야.');

  if (form.global_deadline_at && new Date(form.global_deadline_at).getTime() < Date.now()) throw new Error('전체 마감 시간이 지났어.');
  if (form.max_responses != null && db.submissions.filter((row) => row.form_id === form.id).length >= Number(form.max_responses)) throw new Error('전체 정원이 마감됐어.');

  for (const answer of payload.answers || []) {
    const question = db.questions.find((row) => row.id === answer.questionId && row.form_id === form.id);
    if (!question) throw new Error('질문 검증 실패');
    const selected = answer.optionIds || [];
    if (question.is_required) {
      const hasValue = selected.length || answer.valueText || answer.valueJson;
      if (!hasValue) throw new Error(`[${question.title}] 항목은 필수야.`);
    }
    for (const optionId of selected) {
      const option = db.options.find((row) => row.id === optionId && row.question_id === question.id);
      if (!option) throw new Error('선택지 검증 실패');
      if (option.deadline_at && new Date(option.deadline_at).getTime() < Date.now()) throw new Error('이미 마감된 선택지가 포함되어 있어.');
      if (option.capacity != null) {
        const used = db.submission_answers.filter((row) => row.question_id === question.id && (row.option_ids || []).includes(option.id)).length;
        if (used >= Number(option.capacity)) throw new Error('선택지 정원이 마감됐어.');
      }
    }
  }

  const submissionId = uuid('submission');
  const createdAt = new Date().toISOString();
  db.submissions.unshift({
    id: submissionId,
    form_id: form.id,
    program_id: program.id,
    participant_name: payload.participantName.trim(),
    participant_phone: payload.participantPhone.trim(),
    participant_email: payload.participantEmail?.trim() || null,
    created_at: createdAt
  });

  for (const answer of payload.answers || []) {
    db.submission_answers.push({
      id: uuid('answer'),
      submission_id: submissionId,
      form_id: form.id,
      question_id: answer.questionId,
      option_ids: answer.optionIds || [],
      value_text: answer.valueText || null,
      value_json: answer.valueJson ?? null,
      created_at: createdAt
    });
  }

  saveDb(db);
  return { submission_id: submissionId };
}

export async function getSession() {
  return getDemoSession();
}

export async function signIn(email, password) {
  if (!email) throw new Error('이메일을 입력해줘.');
  if (!password) throw new Error('비밀번호를 입력해줘.');
  return { session: setDemoSession(email), user: { email } };
}

export async function signUp(email, password) {
  if (!email) throw new Error('이메일을 입력해줘.');
  if (!password || password.length < 4) throw new Error('데모 모드에서는 비밀번호 4자 이상만 넣으면 돼.');
  return { session: setDemoSession(email), user: { email } };
}

export async function signOut() {
  clearDemoSession();
}

export async function loadAdminBundle() {
  const db = loadDb();
  return {
    programs: listBySort(db.programs),
    forms: listBySort(db.forms),
    questions: listBySort(db.questions),
    options: listBySort(db.options),
    submissions: clone(db.submissions).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100),
    faqs: listBySort(db.faqs)
  };
}

export async function insertProgram(payload) {
  const db = loadDb();
  const row = {
    id: uuid('program'),
    slug: payload.slug,
    name: payload.name,
    summary: payload.summary || null,
    description: payload.description || null,
    cover_note: payload.cover_note || null,
    is_published: payload.is_published ?? true,
    sort_order: payload.sort_order ?? ((db.programs.length + 1) * 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.programs.push(row);
  saveDb(db);
  return clone(row);
}

export async function updateProgram(id, payload) {
  const db = loadDb();
  const idx = db.programs.findIndex((row) => row.id === id);
  if (idx < 0) throw new Error('프로그램을 찾지 못했어.');
  db.programs[idx] = updated({ ...db.programs[idx], ...payload });
  saveDb(db);
  return clone(db.programs[idx]);
}

export async function deleteProgram(id) {
  const db = loadDb();
  const formIds = db.forms.filter((row) => row.program_id === id).map((row) => row.id);
  const questionIds = db.questions.filter((row) => formIds.includes(row.form_id)).map((row) => row.id);
  db.programs = db.programs.filter((row) => row.id !== id);
  db.forms = db.forms.filter((row) => row.program_id !== id);
  db.questions = db.questions.filter((row) => !formIds.includes(row.form_id));
  db.options = db.options.filter((row) => !questionIds.includes(row.question_id));
  db.submissions = db.submissions.filter((row) => row.program_id !== id);
  db.submission_answers = db.submission_answers.filter((row) => !formIds.includes(row.form_id));
  saveDb(db);
}

export async function insertForm(payload) {
  const db = loadDb();
  const row = {
    id: uuid('form'),
    program_id: payload.program_id,
    title: payload.title,
    description: payload.description || null,
    global_deadline_at: payload.global_deadline_at || null,
    max_responses: payload.max_responses ?? null,
    is_published: payload.is_published ?? true,
    sort_order: payload.sort_order ?? ((db.forms.length + 1) * 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.forms.push(row);
  saveDb(db);
  return clone(row);
}

export async function updateForm(id, payload) {
  const db = loadDb();
  const idx = db.forms.findIndex((row) => row.id === id);
  if (idx < 0) throw new Error('폼을 찾지 못했어.');
  db.forms[idx] = updated({ ...db.forms[idx], ...payload });
  saveDb(db);
  return clone(db.forms[idx]);
}

export async function deleteForm(id) {
  const db = loadDb();
  const questionIds = db.questions.filter((row) => row.form_id === id).map((row) => row.id);
  db.forms = db.forms.filter((row) => row.id !== id);
  db.questions = db.questions.filter((row) => row.form_id !== id);
  db.options = db.options.filter((row) => !questionIds.includes(row.question_id));
  db.submissions = db.submissions.filter((row) => row.form_id !== id);
  db.submission_answers = db.submission_answers.filter((row) => row.form_id !== id);
  saveDb(db);
}

export async function insertQuestion(payload) {
  const db = loadDb();
  const row = {
    id: uuid('question'),
    form_id: payload.form_id,
    question_type: payload.question_type,
    title: payload.title,
    description: payload.description || null,
    is_required: payload.is_required ?? false,
    sort_order: payload.sort_order ?? ((db.questions.filter((row) => row.form_id === payload.form_id).length + 1) * 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.questions.push(row);
  saveDb(db);
  return clone(row);
}

export async function updateQuestion(id, payload) {
  const db = loadDb();
  const idx = db.questions.findIndex((row) => row.id === id);
  if (idx < 0) throw new Error('질문을 찾지 못했어.');
  db.questions[idx] = updated({ ...db.questions[idx], ...payload });
  saveDb(db);
  return clone(db.questions[idx]);
}

export async function deleteQuestion(id) {
  const db = loadDb();
  db.questions = db.questions.filter((row) => row.id !== id);
  db.options = db.options.filter((row) => row.question_id !== id);
  db.submission_answers = db.submission_answers.filter((row) => row.question_id !== id);
  saveDb(db);
}

export async function insertOption(payload) {
  const db = loadDb();
  const row = {
    id: uuid('option'),
    question_id: payload.question_id,
    label: payload.label,
    deadline_at: payload.deadline_at || null,
    capacity: payload.capacity ?? null,
    event_start_at: payload.event_start_at || null,
    event_end_at: payload.event_end_at || null,
    sort_order: payload.sort_order ?? ((db.options.filter((row) => row.question_id === payload.question_id).length + 1) * 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.options.push(row);
  saveDb(db);
  return clone(row);
}

export async function updateOption(id, payload) {
  const db = loadDb();
  const idx = db.options.findIndex((row) => row.id === id);
  if (idx < 0) throw new Error('선택지를 찾지 못했어.');
  db.options[idx] = updated({ ...db.options[idx], ...payload });
  saveDb(db);
  return clone(db.options[idx]);
}

export async function deleteOption(id) {
  const db = loadDb();
  db.options = db.options.filter((row) => row.id !== id);
  db.submission_answers = db.submission_answers.map((row) => ({ ...row, option_ids: (row.option_ids || []).filter((opt) => opt !== id) }));
  saveDb(db);
}

export async function insertFaq(payload) {
  const db = loadDb();
  const row = {
    id: uuid('faq'),
    question: payload.question,
    answer: payload.answer,
    is_published: payload.is_published ?? true,
    sort_order: payload.sort_order ?? ((db.faqs.length + 1) * 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.faqs.push(row);
  saveDb(db);
  return clone(row);
}

export async function updateFaq(id, payload) {
  const db = loadDb();
  const idx = db.faqs.findIndex((row) => row.id === id);
  if (idx < 0) throw new Error('FAQ를 찾지 못했어.');
  db.faqs[idx] = updated({ ...db.faqs[idx], ...payload });
  saveDb(db);
  return clone(db.faqs[idx]);
}

export async function deleteFaq(id) {
  const db = loadDb();
  db.faqs = db.faqs.filter((row) => row.id !== id);
  saveDb(db);
}
