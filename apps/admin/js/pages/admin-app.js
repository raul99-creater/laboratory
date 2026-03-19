import {
  getSession, signIn, signUp, signOut, loadAdminBundle,
  insertProgram, updateProgram, deleteProgram,
  insertForm, updateForm, deleteForm,
  insertQuestion, updateQuestion, deleteQuestion,
  insertOption, updateOption, deleteOption,
  insertFaq, updateFaq, deleteFaq
} from '../services/admin-api.js';
import { menuBoot, qs, qsa, escapeHtml, setStatus, fmtDate, slugify } from '../lib/utils.js';

menuBoot();

const authView = qs('#authView');
const dashboardView = qs('#dashboardView');
const authStatus = qs('#authStatus');
const statusNode = qs('#status');
const sessionEmail = qs('#sessionEmail');
let state = { programs: [], forms: [], questions: [], options: [], submissions: [], faqs: [] };
let currentFormId = null;

function formsNested() {
  return state.forms.map((form) => ({
    ...form,
    questions: state.questions.filter((q) => q.form_id === form.id).map((question) => ({
      ...question,
      options: state.options.filter((opt) => opt.question_id === question.id)
    }))
  }));
}

function currentForm() {
  return formsNested().find((form) => form.id === currentFormId) || null;
}

function renderStats() {
  qs('#statPrograms').textContent = state.programs.length;
  qs('#statForms').textContent = state.forms.length;
  qs('#statQuestions').textContent = state.questions.length;
  qs('#statOptions').textContent = state.options.length;
  qs('#statSubmissions').textContent = state.submissions.length;
  qs('#statFaqs').textContent = state.faqs.length;
}

function fillProgramSelect() {
  qs('#formProgramId').innerHTML = '<option value="">프로그램 선택</option>' + state.programs.map((program) => `<option value="${program.id}">${escapeHtml(program.name)}</option>`).join('');
}

function renderProgramTable() {
  const tbody = qs('#programTableBody');
  tbody.innerHTML = state.programs.length ? state.programs.map((program) => `
    <tr>
      <td><b>${escapeHtml(program.name)}</b></td>
      <td>${escapeHtml(program.slug || '-')}</td>
      <td><button class="btn btn-danger small" data-delete-program="${program.id}">삭제</button></td>
    </tr>
  `).join('') : '<tr><td colspan="3" class="muted">프로그램이 아직 없어</td></tr>';
  tbody.querySelectorAll('[data-delete-program]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('프로그램을 삭제할까? 연결된 폼도 같이 지워져.')) return;
    try {
      await deleteProgram(button.dataset.deleteProgram);
      await refreshAll('프로그램 삭제 완료');
    } catch (error) {
      setStatus(statusNode, error.message, 'err');
    }
  }));
}

function renderSubmissionTable() {
  const tbody = qs('#submissionTableBody');
  const formMap = new Map(state.forms.map((form) => [form.id, form.title]));
  tbody.innerHTML = state.submissions.length ? state.submissions.map((row) => `
    <tr>
      <td>${escapeHtml(formMap.get(row.form_id) || '-')}</td>
      <td>${escapeHtml(row.participant_name || '-')}</td>
      <td>${escapeHtml(row.participant_phone || '-')}</td>
      <td>${escapeHtml(fmtDate(row.created_at))}</td>
    </tr>
  `).join('') : '<tr><td colspan="4" class="muted">제출 데이터가 아직 없어</td></tr>';
}

function renderFaqTable() {
  const tbody = qs('#faqTableBody');
  tbody.innerHTML = state.faqs.length ? state.faqs.map((faq) => `
    <tr>
      <td>${escapeHtml(faq.question)}</td>
      <td><label class="row"><input type="checkbox" data-faq-published="${faq.id}" ${faq.is_published ? 'checked' : ''}> 공개</label></td>
      <td><button class="btn btn-danger small" data-delete-faq="${faq.id}">삭제</button></td>
    </tr>
  `).join('') : '<tr><td colspan="3" class="muted">FAQ가 아직 없어</td></tr>';
  tbody.querySelectorAll('[data-faq-published]').forEach((checkbox) => checkbox.addEventListener('change', async () => {
    try {
      await updateFaq(checkbox.dataset.faqPublished, { is_published: checkbox.checked });
      await refreshAll('FAQ 게시 상태 변경');
    } catch (error) {
      setStatus(statusNode, error.message, 'err');
    }
  }));
  tbody.querySelectorAll('[data-delete-faq]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('FAQ를 삭제할까?')) return;
    try {
      await deleteFaq(button.dataset.deleteFaq);
      await refreshAll('FAQ 삭제 완료');
    } catch (error) {
      setStatus(statusNode, error.message, 'err');
    }
  }));
}

function renderFormList() {
  const list = qs('#formList');
  const nested = formsNested();
  list.innerHTML = nested.length ? nested.map((form) => {
    const program = state.programs.find((item) => item.id === form.program_id);
    return `
      <div class="form-item ${currentFormId === form.id ? 'active' : ''}" data-select-form="${form.id}">
        <div style="font-weight:800">${escapeHtml(form.title)}</div>
        <div class="muted">${escapeHtml(program?.name || '-')}</div>
        <div class="subtle">질문 ${form.questions.length}개</div>
      </div>
    `;
  }).join('') : '<div class="empty">폼이 아직 없어</div>';
  list.querySelectorAll('[data-select-form]').forEach((node) => node.addEventListener('click', () => {
    currentFormId = node.dataset.selectForm;
    renderFormList();
    renderBuilder();
  }));
}

function optionRow(question, option) {
  return `
    <div class="option-row">
      <div class="field"><label>선택지명</label><input class="input" data-option-field="label" data-option-id="${option.id}" value="${escapeHtml(option.label || '')}"></div>
      <div class="field"><label>행사 시작</label><input class="input" type="datetime-local" data-option-field="event_start_at" data-option-id="${option.id}" value="${escapeHtml(option.event_start_at || '')}"></div>
      <div class="field"><label>행사 종료</label><input class="input" type="datetime-local" data-option-field="event_end_at" data-option-id="${option.id}" value="${escapeHtml(option.event_end_at || '')}"></div>
      <div class="field"><label>정원</label><input class="input" type="number" data-option-field="capacity" data-option-id="${option.id}" value="${option.capacity ?? ''}"></div>
      <button class="btn btn-danger small" data-delete-option="${option.id}">삭제</button>
      <div class="field" style="grid-column:1 / span 3"><label>마감 시각</label><input class="input" type="datetime-local" data-option-field="deadline_at" data-option-id="${option.id}" value="${escapeHtml(option.deadline_at || '')}"></div>
    </div>
  `;
}

function renderBuilder() {
  const area = qs('#builderArea');
  const form = currentForm();
  if (!form) {
    area.innerHTML = '<div class="empty">왼쪽에서 폼을 선택해줘</div>';
    return;
  }
  const program = state.programs.find((item) => item.id === form.program_id);
  area.innerHTML = `
    <div class="stack">
      <div class="card" style="box-shadow:none;background:#fffdf9">
        <div class="card-body stack">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div>
              <div class="pill ${form.is_published ? 'green' : 'red'}">${form.is_published ? '공개' : '비공개'}</div>
              <div style="font-size:21px;font-weight:700;margin-top:10px">${escapeHtml(form.title)}</div>
              <div class="muted">${escapeHtml(program?.name || '-')}</div>
            </div>
            <div class="page-actions"><button id="btnTogglePublish" class="btn btn-secondary">${form.is_published ? '비공개로 전환' : '공개로 전환'}</button><button id="btnDeleteForm" class="btn btn-danger">폼 삭제</button></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>폼 제목</label><input id="editFormTitle" class="input" value="${escapeHtml(form.title || '')}"></div>
            <div class="field"><label>프로그램 연결</label><select id="editFormProgram" class="select">${state.programs.map((programItem) => `<option value="${programItem.id}" ${programItem.id === form.program_id ? 'selected' : ''}>${escapeHtml(programItem.name)}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>폼 설명</label><textarea id="editFormDescription" class="textarea">${escapeHtml(form.description || '')}</textarea></div>
          <div class="grid-2">
            <div class="field"><label>전체 마감 시각</label><input id="editFormDeadline" type="datetime-local" class="input" value="${escapeHtml(form.global_deadline_at || '')}"></div>
            <div class="field"><label>전체 정원</label><input id="editFormCapacity" type="number" class="input" value="${form.max_responses ?? ''}"></div>
          </div>
        </div>
      </div>
      <div class="row">
        <button class="btn btn-primary small" data-add-question="short">단답형</button>
        <button class="btn btn-soft small" data-add-question="paragraph">장문형</button>
        <button class="btn btn-soft small" data-add-question="single">객관식</button>
        <button class="btn btn-soft small" data-add-question="multi">체크박스</button>
        <button class="btn btn-soft small" data-add-question="dropdown">드롭다운</button>
        <button class="btn btn-soft small" data-add-question="date">날짜</button>
        <button class="btn btn-soft small" data-add-question="time">시간</button>
      </div>
      ${form.questions.length ? form.questions.map((question, index) => `
        <div class="question-card card">
          <div class="card-body stack">
            <div class="question-head">
              <div>
                <div class="pill">Q${index + 1}</div>
                <div style="font-size:18px;font-weight:700;margin-top:8px">${escapeHtml(question.title || '질문')}</div>
              </div>
              <div class="page-actions"><button class="btn btn-danger small" data-delete-question="${question.id}">질문 삭제</button></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>질문 제목</label><input class="input" data-question-field="title" data-question-id="${question.id}" value="${escapeHtml(question.title || '')}"></div>
              <div class="field"><label>질문 유형</label><select class="select" data-question-field="question_type" data-question-id="${question.id}">${['short','paragraph','single','multi','dropdown','date','time'].map((type) => `<option value="${type}" ${question.question_type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>
            </div>
            <div class="field"><label>설명</label><textarea class="textarea" data-question-field="description" data-question-id="${question.id}">${escapeHtml(question.description || '')}</textarea></div>
            <label class="row" style="font-weight:800"><input type="checkbox" data-question-field="is_required" data-question-id="${question.id}" ${question.is_required ? 'checked' : ''}> 필수 응답</label>
            ${['single','multi','dropdown'].includes(question.question_type) ? `
              <div class="divider"></div>
              <div class="row" style="justify-content:space-between"><div class="section-title">선택지</div><button class="btn btn-outline small" data-add-option="${question.id}">선택지 추가</button></div>
              <div class="stack">${question.options.length ? question.options.map((option) => optionRow(question, option)).join('') : '<div class="muted">선택지가 아직 없어</div>'}</div>
            ` : ''}
          </div>
        </div>
      `).join('') : '<div class="empty">질문이 아직 없어. 위 버튼으로 추가해줘</div>'}
    </div>
  `;
  bindBuilder(form);
}

function normalizeValue(field, value) {
  if (['capacity', 'max_responses'].includes(field)) return value === '' ? null : Number(value);
  return value === '' ? null : value;
}

function bindBuilder(form) {
  qs('#btnTogglePublish')?.addEventListener('click', async () => {
    try { await updateForm(form.id, { is_published: !form.is_published }); await refreshAll('폼 공개 상태 변경'); } catch (error) { setStatus(statusNode, error.message, 'err'); }
  });
  qs('#btnDeleteForm')?.addEventListener('click', async () => {
    if (!confirm('폼을 삭제할까?')) return;
    try { await deleteForm(form.id); currentFormId = null; await refreshAll('폼 삭제 완료'); } catch (error) { setStatus(statusNode, error.message, 'err'); }
  });
  qs('#editFormTitle')?.addEventListener('input', async (e) => { await safeUpdate(() => updateForm(form.id, { title: e.target.value }), '폼 제목 수정'); });
  qs('#editFormProgram')?.addEventListener('change', async (e) => { await safeUpdate(() => updateForm(form.id, { program_id: e.target.value }), '프로그램 연결 변경'); });
  qs('#editFormDescription')?.addEventListener('input', async (e) => { await safeUpdate(() => updateForm(form.id, { description: e.target.value }), '폼 설명 수정'); });
  qs('#editFormDeadline')?.addEventListener('change', async (e) => { await safeUpdate(() => updateForm(form.id, { global_deadline_at: normalizeValue('global_deadline_at', e.target.value) }), '폼 마감 수정'); });
  qs('#editFormCapacity')?.addEventListener('input', async (e) => { await safeUpdate(() => updateForm(form.id, { max_responses: normalizeValue('max_responses', e.target.value) }), '폼 정원 수정'); });

  qsa('[data-add-question]', qs('#builderArea')).forEach((button) => button.addEventListener('click', async () => {
    const sortOrder = (state.questions.filter((q) => q.form_id === form.id).length + 1) * 10;
    const question = await insertQuestion({ form_id: form.id, question_type: button.dataset.addQuestion, title: '새 질문', description: '', is_required: false, sort_order: sortOrder });
    if (['single', 'multi', 'dropdown'].includes(question.question_type)) {
      await insertOption({ question_id: question.id, label: '선택지 1', sort_order: 10 });
      await insertOption({ question_id: question.id, label: '선택지 2', sort_order: 20 });
    }
    await refreshAll('질문 추가 완료');
    currentFormId = form.id;
  }));

  qsa('[data-question-field]', qs('#builderArea')).forEach((node) => {
    node.addEventListener(node.type === 'checkbox' || node.tagName === 'SELECT' ? 'change' : 'input', async () => {
      const field = node.dataset.questionField;
      const payload = { [field]: node.type === 'checkbox' ? node.checked : node.value };
      await safeUpdate(() => updateQuestion(node.dataset.questionId, payload), '질문 수정');
      if (field === 'question_type') await refreshAll('질문 유형 변경');
    });
  });

  qsa('[data-delete-question]', qs('#builderArea')).forEach((node) => node.addEventListener('click', async () => {
    if (!confirm('질문을 삭제할까?')) return;
    await safeUpdate(() => deleteQuestion(node.dataset.deleteQuestion), '질문 삭제');
  }));

  qsa('[data-add-option]', qs('#builderArea')).forEach((node) => node.addEventListener('click', async () => {
    const questionId = node.dataset.addOption;
    const count = state.options.filter((opt) => opt.question_id === questionId).length;
    await safeUpdate(() => insertOption({ question_id: questionId, label: `선택지 ${count + 1}`, sort_order: (count + 1) * 10 }), '선택지 추가');
  }));

  qsa('[data-option-field]', qs('#builderArea')).forEach((node) => {
    node.addEventListener(node.tagName === 'SELECT' || node.type === 'datetime-local' ? 'change' : 'input', async () => {
      const field = node.dataset.optionField;
      await safeUpdate(() => updateOption(node.dataset.optionId, { [field]: normalizeValue(field, node.value) }), '선택지 수정');
    });
  });

  qsa('[data-delete-option]', qs('#builderArea')).forEach((node) => node.addEventListener('click', async () => {
    if (!confirm('선택지를 삭제할까?')) return;
    await safeUpdate(() => deleteOption(node.dataset.deleteOption), '선택지 삭제');
  }));
}

async function safeUpdate(fn, okMessage) {
  try {
    await fn();
    await refreshAll(okMessage, false);
  } catch (error) {
    setStatus(statusNode, error.message, 'err');
  }
}

async function refreshAll(message = '새로고침 완료', resetSelection = false) {
  setStatus(statusNode, '데이터 불러오는 중...', '');
  state = await loadAdminBundle();
  if (resetSelection && !state.forms.find((form) => form.id === currentFormId)) currentFormId = state.forms[0]?.id || null;
  if (!currentFormId && state.forms[0]?.id) currentFormId = state.forms[0].id;
  fillProgramSelect();
  renderStats();
  renderProgramTable();
  renderSubmissionTable();
  renderFaqTable();
  renderFormList();
  renderBuilder();
  setStatus(statusNode, message, 'ok');
}

async function bootSession() {
  try {
    const session = await getSession();
    if (session?.user?.email) {
      authView.classList.add('hidden');
      dashboardView.classList.remove('hidden');
      sessionEmail.textContent = session.user.email;
      await refreshAll('로그인 완료');
      return;
    }
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  } catch (error) {
    setStatus(authStatus, error.message, 'err');
  }
}

qs('#btnSignIn')?.addEventListener('click', async () => {
  try {
    setStatus(authStatus, '로그인 중...', '');
    await signIn(qs('#authEmail').value.trim(), qs('#authPassword').value);
    await bootSession();
  } catch (error) {
    setStatus(authStatus, error.message, 'err');
  }
});

qs('#btnSignUp')?.addEventListener('click', async () => {
  try {
    setStatus(authStatus, '회원가입 중...', '');
    const email = qs('#authEmail').value.trim();
    const password = qs('#authPassword').value;
    const result = await signUp(email, password);
    setStatus(authStatus, result.user ? '회원가입 완료. 바로 로그인되는 설정이면 이어서 대시보드가 열려.' : '회원가입 완료. 이메일 인증이 켜져 있으면 메일을 먼저 확인해줘.', 'ok');
    await bootSession();
  } catch (error) {
    setStatus(authStatus, error.message, 'err');
  }
});

qs('#btnSignOut')?.addEventListener('click', async () => {
  try { await signOut(); await bootSession(); } catch (error) { setStatus(statusNode, error.message, 'err'); }
});
qs('#btnRefresh')?.addEventListener('click', async () => { try { await refreshAll('수동 새로고침 완료'); } catch (error) { setStatus(statusNode, error.message, 'err'); } });

qs('#programName')?.addEventListener('input', () => {
  if (!qs('#programSlug').value.trim()) qs('#programSlug').value = slugify(qs('#programName').value);
});

qs('#btnCreateProgram')?.addEventListener('click', async () => {
  try {
    const name = qs('#programName').value.trim();
    if (!name) throw new Error('프로그램명을 입력해줘.');
    await insertProgram({
      name,
      slug: slugify(qs('#programSlug').value || name),
      summary: qs('#programSummary').value.trim() || null,
      description: qs('#programDescription').value.trim() || null,
      is_published: true
    });
    qs('#programName').value = '';
    qs('#programSlug').value = '';
    qs('#programSummary').value = '';
    qs('#programDescription').value = '';
    await refreshAll('프로그램 등록 완료');
  } catch (error) {
    setStatus(statusNode, error.message, 'err');
  }
});

qs('#btnCreateForm')?.addEventListener('click', async () => {
  try {
    const programId = qs('#formProgramId').value;
    const title = qs('#formTitle').value.trim();
    if (!programId) throw new Error('프로그램을 먼저 선택해줘.');
    if (!title) throw new Error('폼 제목을 입력해줘.');
    const form = await insertForm({
      program_id: programId,
      title,
      description: qs('#formDescription').value.trim() || null,
      global_deadline_at: qs('#formDeadline').value || null,
      max_responses: qs('#formCapacity').value ? Number(qs('#formCapacity').value) : null,
      is_published: true
    });
    currentFormId = form.id;
    qs('#formTitle').value = '';
    qs('#formDescription').value = '';
    qs('#formDeadline').value = '';
    qs('#formCapacity').value = '';
    await refreshAll('신청 폼 생성 완료');
  } catch (error) {
    setStatus(statusNode, error.message, 'err');
  }
});

qs('#btnCreateFaq')?.addEventListener('click', async () => {
  try {
    const question = qs('#faqQuestion').value.trim();
    const answer = qs('#faqAnswer').value.trim();
    if (!question || !answer) throw new Error('FAQ 질문과 답변을 모두 입력해줘.');
    await insertFaq({ question, answer, is_published: true });
    qs('#faqQuestion').value = '';
    qs('#faqAnswer').value = '';
    await refreshAll('FAQ 추가 완료');
  } catch (error) {
    setStatus(statusNode, error.message, 'err');
  }
});

bootSession();
