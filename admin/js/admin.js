
import { initStorage, loadData, saveData, resetData, pullFromRemote, pushToRemote } from './storage.js';
import { getCurrentUser, getStorageModeLabel, isApprovedAdmin, isSupabaseConfigured, signInWithPassword, signOut, signUpWithPassword } from './supabase-client.js';
import { uid, nowIso, escapeHtml, fmtDate, toLocalInputValue, setStatus, qs, renderEmpty } from './utils.js';
import {
  normalizeForm,
  normalizeQuestion,
  getLecture,
  getForm,
  updateFormTimestamp,
  countFormSubmissions,
  countOptionSelections,
  computeFormStatus,
  getQuestionTypeName
} from './form-engine.js';

let currentFormId = null;


async function updateAuthPanel() {
  const modeEl = qs('authMode');
  const userEl = qs('authUser');
  const roleEl = qs('authRole');
  if (!modeEl || !userEl || !roleEl) return;

  modeEl.textContent = getStorageModeLabel();
  if (!isSupabaseConfigured()) {
    userEl.textContent = '-';
    roleEl.textContent = '로컬 모드';
    return;
  }

  const user = await getCurrentUser();
  userEl.textContent = user?.email || '-';
  roleEl.textContent = user ? ((await isApprovedAdmin()) ? '승인된 관리자' : '로그인됨 · admin_emails 미등록') : '로그인 전';
}

async function handleAuth(action) {
  if (!isSupabaseConfigured()) return setStatus('먼저 admin/js/config.js에 Supabase URL과 Key를 넣어줘.', 'err');
  const email = qs('authEmail').value.trim();
  const password = qs('authPassword').value.trim();
  if (!email || !password) return setStatus('이메일과 비밀번호를 입력해줘.', 'err');

  const result = action === 'signup'
    ? await signUpWithPassword(email, password)
    : await signInWithPassword(email, password);

  if (result.error) {
    setStatus(result.error.message || '인증 실패', 'err');
    await updateAuthPanel();
    return;
  }

  await initStorage();
  refreshAll();
  await updateAuthPanel();
  setStatus(action === 'signup' ? '회원가입 완료. email 인증이 켜져 있으면 메일부터 확인해줘.' : '로그인 완료', 'ok');
}

async function handleLogout() {
  const { error } = await signOut();
  if (error) return setStatus(error.message || '로그아웃 실패', 'err');
  await initStorage();
  refreshAll();
  await updateAuthPanel();
  setStatus('로그아웃 완료', 'ok');
}

async function handlePushSupabase() {
  const result = await pushToRemote();
  if (!result.ok) return setStatus(`업로드 실패: ${result.reason}`, 'err');
  setStatus('현재 폼/프로그램 구성을 Supabase에 업로드했어.', 'ok');
}

async function handlePullSupabase() {
  await pullFromRemote();
  refreshAll();
  await updateAuthPanel();
  setStatus('Supabase에서 다시 불러오기 완료', 'ok');
}

function hydratedData() {
  const data = loadData();
  data.forms = (data.forms || []).map(normalizeForm);
  return data;
}

function renderStats(data) {
  qs('statLectures').textContent = data.lectures.length;
  qs('statForms').textContent = data.forms.length;
  qs('statQuestions').textContent = data.forms.reduce((sum, form) => sum + form.questions.length, 0);
  qs('statOptions').textContent = data.forms.reduce((sum, form) => sum + form.questions.reduce((s, q) => s + (q.options?.length || 0), 0), 0);
  qs('statSubmissions').textContent = data.submissions.length;
  const badge = qs('statStorage');
  if (badge) badge.textContent = getStorageModeLabel();
}

function fillLectureSelect() {
  const data = hydratedData();
  qs('newFormLectureId').innerHTML = `<option value="">프로그램 선택</option>` + data.lectures.map((lecture) => `
    <option value="${escapeHtml(lecture.id)}">${escapeHtml(lecture.name)}</option>
  `).join('');
}

function renderLectureTable() {
  const data = hydratedData();
  const tbody = qs('lectureTableBody');
  if (!data.lectures.length) {
    tbody.innerHTML = renderEmpty(3, '등록된 프로그램이 없어');
    return;
  }
  tbody.innerHTML = data.lectures.map((lecture) => `
    <tr>
      <td><b>${escapeHtml(lecture.name)}</b></td>
      <td>${escapeHtml(lecture.description || '-')}</td>
      <td><button class="btn btn-danger small" data-delete-lecture="${lecture.id}">삭제</button></td>
    </tr>
  `).join('');
}

function renderSubmissionTable() {
  const data = hydratedData();
  const tbody = qs('submissionTableBody');
  if (!data.submissions.length) {
    tbody.innerHTML = renderEmpty(4, '제출 내역이 아직 없어');
    return;
  }
  tbody.innerHTML = data.submissions.map((submission) => {
    const form = getForm(data, submission.formId);
    const selectedEvents = (submission.selectedEvents || []).map((event) => event.label).join(', ') || '-';
    return `
      <tr>
        <td>${escapeHtml(form?.title || '-')}</td>
        <td>${escapeHtml(submission.viewerName || '-')} / ${escapeHtml(submission.viewerPhone || '-')}</td>
        <td>${escapeHtml(fmtDate(submission.createdAt))}</td>
        <td>${escapeHtml(selectedEvents)}</td>
      </tr>
    `;
  }).join('');
}

function renderFormList() {
  const data = hydratedData();
  const list = qs('formList');
  if (!data.forms.length) {
    list.innerHTML = `<div class="empty">아직 생성된 신청 폼이 없어</div>`;
    return;
  }
  list.innerHTML = data.forms.map((form) => {
    const lecture = getLecture(data, form.lectureId);
    const status = computeFormStatus(data, form);
    return `
      <div class="form-item ${currentFormId === form.id ? 'active' : ''}" data-select-form="${form.id}">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:900">${escapeHtml(form.title)}</div>
            <div class="muted" style="margin-top:4px">${escapeHtml(lecture?.name || '프로그램 미지정')}</div>
          </div>
          <span class="pill ${status.color}">${escapeHtml(status.label)}</span>
        </div>
        <div class="muted" style="margin-top:8px">질문 ${form.questions.length}개 · 제출 ${countFormSubmissions(data, form.id)}건</div>
      </div>
    `;
  }).join('');
}

function renderQuestionPreview(question) {
  const required = question.required ? '<span style="color:#dc2626">*</span>' : '';
  const title = `<div style="font-weight:900;margin-bottom:6px">${escapeHtml(question.title)} ${required}</div>`;
  const desc = question.description ? `<div class="muted" style="margin-bottom:10px">${escapeHtml(question.description)}</div>` : '';
  if (question.type === 'short') return title + desc + `<input class="input" disabled placeholder="단답형 입력">`;
  if (question.type === 'paragraph') return title + desc + `<textarea class="textarea" disabled placeholder="장문형 입력"></textarea>`;
  if (question.type === 'date') return title + desc + `<input class="input" type="date" disabled>`;
  if (question.type === 'time') return title + desc + `<input class="input" type="time" disabled>`;
  if (['single', 'multi', 'dropdown'].includes(question.type)) {
    if (question.type === 'dropdown') {
      return title + desc + `<select class="select" disabled><option>선택하세요</option>${(question.options || []).map((option) => `<option>${escapeHtml(option.label)}</option>`).join('')}</select>`;
    }
    return title + desc + `<div class="stack">${(question.options || []).map((option) => `<label class="row"><input type="${question.type === 'single' ? 'radio' : 'checkbox'}" disabled> ${escapeHtml(option.label)}</label>`).join('') || '<div class="muted">선택지 없음</div>'}</div>`;
  }
  return title + desc;
}

function questionTemplate(question, formId, qIndex) {
  const supportsOptions = ['single', 'multi', 'dropdown'].includes(question.type);
  const data = hydratedData();
  return `
    <div class="question-card">
      <div class="question-head">
        <div>
          <div class="pill">Q${qIndex + 1}</div>
          <div style="margin-top:10px;font-size:16px;font-weight:700">${escapeHtml(question.title || '질문')}</div>
          <div class="muted">${escapeHtml(getQuestionTypeName(question.type))}</div>
        </div>
        <div class="row">
          <button class="btn btn-outline small" data-move-question="up" data-form-id="${formId}" data-question-id="${question.id}">위로</button>
          <button class="btn btn-outline small" data-move-question="down" data-form-id="${formId}" data-question-id="${question.id}">아래로</button>
          <button class="btn btn-danger small" data-delete-question data-form-id="${formId}" data-question-id="${question.id}">삭제</button>
        </div>
      </div>
      <div class="grid-2">
        <div class="field"><label>질문 제목</label><input class="input" value="${escapeHtml(question.title)}" data-question-field="title" data-form-id="${formId}" data-question-id="${question.id}"></div>
        <div class="field"><label>질문 유형</label><select class="select" data-question-field="type" data-form-id="${formId}" data-question-id="${question.id}">${['short','paragraph','single','multi','dropdown','date','time'].map((type) => `<option value="${type}" ${question.type === type ? 'selected' : ''}>${getQuestionTypeName(type)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>설명</label><textarea class="textarea" data-question-field="description" data-form-id="${formId}" data-question-id="${question.id}">${escapeHtml(question.description || '')}</textarea></div>
      <div class="row" style="justify-content:space-between">
        <label class="row" style="font-weight:800"><input type="checkbox" ${question.required ? 'checked' : ''} data-question-required data-form-id="${formId}" data-question-id="${question.id}">필수 응답</label>
        ${supportsOptions ? `<button class="btn btn-soft small" data-add-option data-form-id="${formId}" data-question-id="${question.id}">선택지 추가</button>` : ''}
      </div>
      ${supportsOptions ? `<div class="stack"><div class="section-title">선택지별 마감/정원/행사시간</div>${(question.options || []).map((option) => `<div class="option-row"><div class="field"><label>선택지명</label><input class="input" value="${escapeHtml(option.label)}" data-option-field="label" data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}"></div><div class="field"><label>행사 시작</label><input class="input" type="datetime-local" value="${escapeHtml(option.eventStartAt || '')}" data-option-field="eventStartAt" data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}"></div><div class="field"><label>행사 종료</label><input class="input" type="datetime-local" value="${escapeHtml(option.eventEndAt || '')}" data-option-field="eventEndAt" data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}"></div><div class="field"><label>정원</label><input class="input" type="number" value="${escapeHtml(option.capacity)}" data-option-field="capacity" data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}"></div><button class="btn btn-danger small" data-delete-option data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}">삭제</button><div class="field" style="grid-column:1 / span 2"><label>마감 시각</label><input class="input" type="datetime-local" value="${escapeHtml(option.deadlineAt || '')}" data-option-field="deadlineAt" data-form-id="${formId}" data-question-id="${question.id}" data-option-id="${option.id}"></div><div class="field" style="grid-column:3 / span 2"><label>현재 선택 수</label><input class="input" disabled value="${countOptionSelections(data, formId, question.id, option.id)}"></div></div>`).join('') || `<div class="muted">선택지가 아직 없어</div>`}</div>` : ''}
      <div class="preview"><div class="section-title">참여 페이지 미리보기</div>${renderQuestionPreview(question)}</div>
    </div>
  `;
}

function renderBuilder() {
  const data = hydratedData();
  const area = qs('builderArea');
  const form = getForm(data, currentFormId);
  if (!form) {
    area.innerHTML = `<div class="empty">왼쪽에서 신청 폼을 선택해줘</div>`;
    return;
  }
  const lecture = getLecture(data, form.lectureId);
  const status = computeFormStatus(data, form);
  area.innerHTML = `
    <div class="stack">
      <div class="card" style="box-shadow:none;background:#fffdf9">
        <div class="card-body stack">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div>
              <div class="pill ${status.color}">${escapeHtml(status.label)}</div>
              <div style="font-size:21px;font-weight:700;margin-top:10px">${escapeHtml(form.title)}</div>
              <div class="muted" style="margin-top:4px">${escapeHtml(lecture?.name || '-')}</div>
            </div>
            <div class="row">
              <button class="btn btn-outline small" id="btnTogglePublish">${form.isPublished === false ? '공개로 전환' : '비공개로 전환'}</button>
              <button class="btn btn-danger small" id="btnDeleteForm">폼 삭제</button>
            </div>
          </div>
          <div class="grid-2">
            <div class="field"><label>폼 제목</label><input class="input" id="formTitleInput" value="${escapeHtml(form.title)}"></div>
            <div class="field"><label>프로그램 연결</label><select class="select" id="formLectureSelect">${data.lectures.map((lectureItem) => `<option value="${lectureItem.id}" ${lectureItem.id === form.lectureId ? 'selected' : ''}>${escapeHtml(lectureItem.name)}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>폼 설명</label><textarea class="textarea" id="formDescInput">${escapeHtml(form.description || '')}</textarea></div>
          <div class="grid-2">
            <div class="field"><label>전체 마감 시각</label><input class="input" type="datetime-local" id="formDeadlineInput" value="${escapeHtml(form.globalDeadlineAt || '')}"></div>
            <div class="field"><label>전체 최대 제출 수</label><input class="input" type="number" id="formCapacityInput" value="${escapeHtml(form.maxResponses)}"></div>
          </div>
          <div class="row muted" style="justify-content:space-between"><div>제출 수: <b>${countFormSubmissions(data, form.id)}</b></div><div>업데이트: ${escapeHtml(fmtDate(form.updatedAt))}</div></div>
        </div>
      </div>
      <div class="row">
        <button class="btn btn-primary small" data-add-question="short">단답형 추가</button>
        <button class="btn btn-soft small" data-add-question="paragraph">장문형 추가</button>
        <button class="btn btn-soft small" data-add-question="single">객관식 추가</button>
        <button class="btn btn-soft small" data-add-question="multi">체크박스 추가</button>
        <button class="btn btn-soft small" data-add-question="dropdown">드롭다운 추가</button>
        <button class="btn btn-soft small" data-add-question="date">날짜 추가</button>
        <button class="btn btn-soft small" data-add-question="time">시간 추가</button>
      </div>
      ${form.questions.length ? form.questions.map((question, index) => questionTemplate(question, form.id, index)).join('') : `<div class="empty">질문이 아직 없어. 위 버튼으로 추가해줘</div>`}
    </div>
  `;
  wireBuilderInputs(form.id);
}

function wireBuilderInputs(formId) {
  qs('btnTogglePublish')?.addEventListener('click', () => togglePublishForm(formId));
  qs('btnDeleteForm')?.addEventListener('click', () => deleteForm(formId));
  qs('formTitleInput')?.addEventListener('input', (e) => updateFormField(formId, 'title', e.target.value));
  qs('formLectureSelect')?.addEventListener('change', (e) => updateFormField(formId, 'lectureId', e.target.value));
  qs('formDescInput')?.addEventListener('input', (e) => updateFormField(formId, 'description', e.target.value));
  qs('formDeadlineInput')?.addEventListener('change', (e) => updateFormField(formId, 'globalDeadlineAt', e.target.value));
  qs('formCapacityInput')?.addEventListener('input', (e) => updateFormField(formId, 'maxResponses', e.target.value));
  document.querySelectorAll('[data-add-question]').forEach((button) => button.addEventListener('click', () => addQuestion(formId, button.dataset.addQuestion)));
  document.querySelectorAll('[data-question-field]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', (e) => updateQuestionField(e.target.dataset.formId, e.target.dataset.questionId, e.target.dataset.questionField, e.target.value)));
  document.querySelectorAll('[data-question-required]').forEach((checkbox) => checkbox.addEventListener('change', (e) => updateQuestionField(e.target.dataset.formId, e.target.dataset.questionId, 'required', e.target.checked)));
  document.querySelectorAll('[data-add-option]').forEach((button) => button.addEventListener('click', () => addOption(button.dataset.formId, button.dataset.questionId)));
  document.querySelectorAll('[data-option-field]').forEach((el) => el.addEventListener(el.type === 'datetime-local' || el.tagName === 'SELECT' ? 'change' : 'input', (e) => updateOptionField(e.target.dataset.formId, e.target.dataset.questionId, e.target.dataset.optionId, e.target.dataset.optionField, e.target.value)));
  document.querySelectorAll('[data-delete-option]').forEach((button) => button.addEventListener('click', () => deleteOption(button.dataset.formId, button.dataset.questionId, button.dataset.optionId)));
  document.querySelectorAll('[data-delete-question]').forEach((button) => button.addEventListener('click', () => deleteQuestion(button.dataset.formId, button.dataset.questionId)));
  document.querySelectorAll('[data-move-question]').forEach((button) => button.addEventListener('click', () => moveQuestion(button.dataset.formId, button.dataset.questionId, button.dataset.moveQuestion === 'up' ? -1 : 1)));
}

function createLecture() {
  const name = qs('lectureName').value.trim();
  const description = qs('lectureDesc').value.trim();
  if (!name) return setStatus('프로그램명을 입력해줘.', 'err');
  const data = hydratedData();
  data.lectures.unshift({ id: uid('lec'), name, description, createdAt: nowIso() });
  saveData(data);
  qs('lectureName').value = '';
  qs('lectureDesc').value = '';
  refreshAll();
  setStatus('프로그램 등록 완료', 'ok');
}

function createForm() {
  const lectureId = qs('newFormLectureId').value;
  const title = qs('newFormTitle').value.trim();
  const description = qs('newFormDesc').value.trim();
  const globalDeadlineAt = qs('newFormDeadline').value;
  const maxResponses = qs('newFormCapacity').value;
  if (!lectureId) return setStatus('프로그램을 먼저 선택해줘.', 'err');
  if (!title) return setStatus('폼 제목을 입력해줘.', 'err');
  const data = hydratedData();
  const form = normalizeForm({ id: uid('form'), lectureId, title, description, globalDeadlineAt, maxResponses: maxResponses ? Number(maxResponses) : '', isPublished: true, questions: [] });
  data.forms.unshift(form);
  saveData(data);
  currentFormId = form.id;
  qs('newFormTitle').value = '';
  qs('newFormDesc').value = '';
  qs('newFormCapacity').value = '';
  refreshAll();
  setStatus('신청 폼 생성 완료', 'ok');
}

function deleteLecture(lectureId) {
  if (!confirm('이 프로그램을 삭제하면 연결된 폼도 함께 삭제할까?')) return;
  const data = hydratedData();
  const formIds = data.forms.filter((form) => form.lectureId === lectureId).map((form) => form.id);
  data.lectures = data.lectures.filter((lecture) => lecture.id !== lectureId);
  data.forms = data.forms.filter((form) => form.lectureId !== lectureId);
  data.submissions = data.submissions.filter((submission) => !formIds.includes(submission.formId));
  if (currentFormId && formIds.includes(currentFormId)) currentFormId = null;
  saveData(data); refreshAll(); setStatus('프로그램 삭제 완료', 'ok');
}

function deleteForm(formId) {
  if (!confirm('이 신청 폼과 제출 데이터까지 삭제할까?')) return;
  const data = hydratedData();
  data.forms = data.forms.filter((form) => form.id !== formId);
  data.submissions = data.submissions.filter((submission) => submission.formId !== formId);
  if (currentFormId === formId) currentFormId = data.forms[0]?.id || null;
  saveData(data); refreshAll(); setStatus('신청 폼 삭제 완료', 'ok');
}

function togglePublishForm(formId) {
  const data = hydratedData();
  const form = getForm(data, formId); if (!form) return;
  form.isPublished = !form.isPublished; updateFormTimestamp(form); saveData(data); refreshAll();
  setStatus(form.isPublished ? '폼 공개 상태로 변경' : '폼 비공개 상태로 변경', 'ok');
}

function selectForm(formId) { currentFormId = formId; renderFormList(); renderBuilder(); }

function updateFormField(formId, field, value) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  form[field] = field === 'maxResponses' ? (value === '' ? '' : Number(value)) : value;
  updateFormTimestamp(form); saveData(data); refreshAll(false);
}

function addQuestion(formId, type = 'short') {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const question = normalizeQuestion({ type, title: ['single','multi','dropdown'].includes(type) ? '선택 항목' : '새 질문', description: '', required: false, options: ['single','multi','dropdown'].includes(type) ? [{ label: '선택지 1', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' }, { label: '선택지 2', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' }] : [] });
  form.questions.push(question); updateFormTimestamp(form); saveData(data); refreshAll(false); setStatus('질문 추가 완료', 'ok');
}

function moveQuestion(formId, questionId, direction) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const index = form.questions.findIndex((question) => question.id === questionId); if (index < 0) return;
  const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= form.questions.length) return;
  [form.questions[index], form.questions[nextIndex]] = [form.questions[nextIndex], form.questions[index]];
  updateFormTimestamp(form); saveData(data); refreshAll(false);
}

function deleteQuestion(formId, questionId) {
  if (!confirm('이 질문을 삭제할까?')) return;
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  form.questions = form.questions.filter((question) => question.id !== questionId); updateFormTimestamp(form); saveData(data); refreshAll(false); setStatus('질문 삭제 완료', 'ok');
}

function updateQuestionField(formId, questionId, field, value) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const question = form.questions.find((item) => item.id === questionId); if (!question) return;
  question[field] = value;
  if (field === 'type' && !['single', 'multi', 'dropdown'].includes(value)) question.options = [];
  if (field === 'type' && ['single', 'multi', 'dropdown'].includes(value) && !question.options.length) question.options = [{ id: uid('opt'), label: '선택지 1', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' }];
  updateFormTimestamp(form); saveData(data); refreshAll(false);
}

function addOption(formId, questionId) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const question = form.questions.find((item) => item.id === questionId); if (!question) return;
  question.options.push({ id: uid('opt'), label: `선택지 ${question.options.length + 1}`, deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' });
  updateFormTimestamp(form); saveData(data); refreshAll(false); setStatus('선택지 추가 완료', 'ok');
}

function updateOptionField(formId, questionId, optionId, field, value) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const question = form.questions.find((item) => item.id === questionId); if (!question) return;
  const option = question.options.find((item) => item.id === optionId); if (!option) return;
  option[field] = field === 'capacity' ? (value === '' ? '' : Number(value)) : value;
  updateFormTimestamp(form); saveData(data); refreshAll(false);
}

function deleteOption(formId, questionId, optionId) {
  const data = hydratedData(); const form = getForm(data, formId); if (!form) return;
  const question = form.questions.find((item) => item.id === questionId); if (!question) return;
  question.options = question.options.filter((option) => option.id !== optionId);
  updateFormTimestamp(form); saveData(data); refreshAll(false); setStatus('선택지 삭제 완료', 'ok');
}

function exportJson() {
  const data = hydratedData();
  qs('importJson').value = JSON.stringify(data, null, 2);
  setStatus('JSON 내보내기 완료. 아래 박스에 복사됐어.', 'ok');
}

function importJson() {
  const text = qs('importJson').value.trim();
  if (!text) return setStatus('복원할 JSON을 붙여넣어줘.', 'err');
  try {
    const parsed = JSON.parse(text);
    const normalized = { lectures: parsed.lectures || [], forms: (parsed.forms || []).map(normalizeForm), submissions: parsed.submissions || [] };
    saveData(normalized); currentFormId = normalized.forms[0]?.id || null; refreshAll(); setStatus('JSON 복원 완료', 'ok');
  } catch {
    setStatus('JSON 형식이 올바르지 않아.', 'err');
  }
}

function refreshAll(keepSelection = true) {
  const data = hydratedData();
  renderStats(data); fillLectureSelect(); renderLectureTable(); renderSubmissionTable();
  if (!keepSelection && currentFormId && !data.forms.find((form) => form.id === currentFormId)) currentFormId = data.forms[0]?.id || null;
  if (!currentFormId && data.forms[0]) currentFormId = data.forms[0].id;
  renderFormList(); renderBuilder();
}

function wirePage() {
  qs('btnCreateLecture').addEventListener('click', createLecture);
  qs('btnCreateForm').addEventListener('click', createForm);
  qs('btnResetAll').addEventListener('click', () => {
    if (!confirm('기본 샘플 상태로 되돌릴까?')) return;
    resetData(); currentFormId = null; refreshAll(); setStatus('기본 샘플 데이터로 복원 완료', 'ok');
  });
  qs('btnExport').addEventListener('click', exportJson);
  qs('btnImport').addEventListener('click', importJson);
  qs('btnPushSupabase')?.addEventListener('click', handlePushSupabase);
  qs('btnPullSupabase')?.addEventListener('click', handlePullSupabase);
  qs('btnSignUp')?.addEventListener('click', () => handleAuth('signup'));
  qs('btnLogin')?.addEventListener('click', () => handleAuth('login'));
  qs('btnLogout')?.addEventListener('click', handleLogout);
  document.addEventListener('click', (event) => {
    const formTrigger = event.target.closest('[data-select-form]'); if (formTrigger) selectForm(formTrigger.dataset.selectForm);
    const deleteLectureButton = event.target.closest('[data-delete-lecture]'); if (deleteLectureButton) deleteLecture(deleteLectureButton.dataset.deleteLecture);
  });
}

qs('newFormDeadline').value = toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

async function bootstrapAdmin() {
  wirePage();
  await initStorage();
  refreshAll();
  await updateAuthPanel();
  setStatus('운영 페이지 로드 완료', 'ok');
}

bootstrapAdmin();
