import { menuBoot, escapeHtml, fmtDate, qs, setStatus, renderEmpty } from '../lib/utils.js';
import { getPublishedForms, getPublicFormBundle, getOptionCounts, submitForm } from '../services/public-api.js';
import { renderCalendarLinks } from '../services/calendar.js';

menuBoot();

const statusNode = qs('#status');
const formListNode = qs('#formList');
const formRenderArea = qs('#formRenderArea');
const calendarArea = qs('#calendarArea');
let forms = [];
let selectedBundle = null;
let selectedCounts = [];

function getOptionCount(questionId, optionId) {
  return selectedCounts.find((row) => row.question_id === questionId && row.option_id === optionId)?.used_count || 0;
}

function formClosed(bundle) {
  const form = bundle?.form;
  if (!form) return { closed: true, reason: '폼이 없어' };
  if (form.global_deadline_at && new Date(form.global_deadline_at).getTime() < Date.now()) {
    return { closed: true, reason: '전체 마감 시간이 지났어.' };
  }
  if (Number.isFinite(form.response_count) && form.max_responses !== null && form.max_responses !== undefined && form.max_responses !== '' && Number(form.response_count) >= Number(form.max_responses)) {
    return { closed: true, reason: '전체 제출 정원이 모두 찼어.' };
  }
  return { closed: false, reason: '' };
}

function optionClosed(questionId, option) {
  if (option.deadline_at && new Date(option.deadline_at).getTime() < Date.now()) return { closed: true, reason: '선택지 마감' };
  if (option.capacity !== null && option.capacity !== undefined && option.capacity !== '' && Number(getOptionCount(questionId, option.id)) >= Number(option.capacity)) {
    return { closed: true, reason: '정원 마감' };
  }
  return { closed: false, reason: '' };
}

function renderFormList() {
  formListNode.innerHTML = forms.length ? forms.map((form) => `
    <div class="form-item ${selectedBundle?.form?.id === form.id ? 'active' : ''}" data-form-id="${form.id}">
      <div style="font-weight:800">${escapeHtml(form.title)}</div>
      <div class="muted" style="margin-top:4px">${escapeHtml(form.program?.name || '')}</div>
      ${form.global_deadline_at ? `<div class="subtle" style="margin-top:6px">전체 마감 ${escapeHtml(fmtDate(form.global_deadline_at))}</div>` : ''}
    </div>
  `).join('') : renderEmpty('공개된 신청 폼이 없어');

  formListNode.querySelectorAll('[data-form-id]').forEach((node) => {
    node.addEventListener('click', () => selectForm(node.dataset.formId));
  });
}

function renderQuestion(question) {
  const required = question.is_required ? '<span class="danger-text">*</span>' : '';
  const header = `
    <div>
      <div style="font-weight:800;margin-bottom:6px">${escapeHtml(question.title)} ${required}</div>
      ${question.description ? `<div class="muted">${escapeHtml(question.description)}</div>` : ''}
    </div>`;

  if (question.question_type === 'short') return `<div class="question-block">${header}<input class="input js-answer" type="text" data-question-id="${question.id}"></div>`;
  if (question.question_type === 'paragraph') return `<div class="question-block">${header}<textarea class="textarea js-answer" data-question-id="${question.id}"></textarea></div>`;
  if (question.question_type === 'date') return `<div class="question-block">${header}<input class="input js-answer" type="date" data-question-id="${question.id}"></div>`;
  if (question.question_type === 'time') return `<div class="question-block">${header}<input class="input js-answer" type="time" data-question-id="${question.id}"></div>`;

  if (question.question_type === 'dropdown') {
    return `<div class="question-block">${header}<select class="select js-answer" data-question-id="${question.id}">
      <option value="">선택하세요</option>
      ${(question.options || []).map((option) => {
        const status = optionClosed(question.id, option);
        const count = getOptionCount(question.id, option.id);
        const cap = option.capacity !== null && option.capacity !== undefined && option.capacity !== '' ? ` / ${option.capacity}` : '';
        return `<option value="${option.id}" ${status.closed ? 'disabled' : ''}>${escapeHtml(option.label)}${status.closed ? ' (마감)' : ''} [${count}${cap}]</option>`;
      }).join('')}
    </select></div>`;
  }

  if (question.question_type === 'single' || question.question_type === 'multi') {
    return `<div class="question-block">${header}<div class="grid">${(question.options || []).map((option) => {
      const status = optionClosed(question.id, option);
      const count = getOptionCount(question.id, option.id);
      const cap = option.capacity !== null && option.capacity !== undefined && option.capacity !== '' ? ` / ${option.capacity}` : '';
      return `<label class="option ${status.closed ? 'disabled' : ''}">
        <input ${status.closed ? 'disabled' : ''} type="${question.question_type === 'single' ? 'radio' : 'checkbox'}" name="q_${question.id}" value="${option.id}" data-question-id="${question.id}" class="js-option">
        <div>
          <div style="font-weight:800">${escapeHtml(option.label)}</div>
          <div class="muted">신청 ${count}${cap}</div>
          ${option.deadline_at ? `<div class="muted">마감 ${escapeHtml(fmtDate(option.deadline_at))}</div>` : ''}
          ${option.event_start_at ? `<div class="muted">일정 ${escapeHtml(fmtDate(option.event_start_at))}</div>` : ''}
          ${status.closed ? `<div class="pill red" style="margin-top:6px">${escapeHtml(status.reason)}</div>` : ''}
        </div>
      </label>`;
    }).join('') || '<div class="muted">선택지가 아직 없어</div>'}</div></div>`;
  }
  return '';
}

function renderSelectedForm() {
  if (!selectedBundle?.form) {
    formRenderArea.innerHTML = '<div class="empty">왼쪽에서 폼을 선택해줘</div>';
    return;
  }
  const closed = formClosed(selectedBundle);
  const { form, program, questions } = selectedBundle;
  formRenderArea.innerHTML = `
    <div class="question-block">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <div class="pill ${closed.closed ? 'red' : 'green'}">${closed.closed ? '접수 종료' : '참여 가능'}</div>
          <div style="font-size:21px;font-weight:700;margin-top:10px">${escapeHtml(form.title)}</div>
          <div class="muted">${escapeHtml(program?.name || '')}</div>
          ${form.description ? `<div class="muted" style="margin-top:10px">${escapeHtml(form.description)}</div>` : ''}
        </div>
        <div class="subtle">제출 ${form.response_count}${form.max_responses ? ` / ${form.max_responses}` : ''}</div>
      </div>
      ${form.global_deadline_at ? `<div class="subtle" style="margin-top:8px">전체 마감 ${escapeHtml(fmtDate(form.global_deadline_at))}</div>` : ''}
      ${closed.closed ? `<div class="pill red" style="margin-top:10px">${escapeHtml(closed.reason)}</div>` : ''}
    </div>
    ${(questions || []).map(renderQuestion).join('')}
    <div class="page-actions"><button id="btnSubmitForm" class="btn btn-primary" ${closed.closed ? 'disabled' : ''}>제출하기</button></div>
  `;
  qs('#btnSubmitForm')?.addEventListener('click', handleSubmit);
}

function buildAnswerPayload() {
  const participantName = qs('#viewerName').value.trim();
  const participantPhone = qs('#viewerPhone').value.trim();
  const participantEmail = qs('#viewerEmail').value.trim();
  if (!participantName) throw new Error('이름을 입력해줘.');
  if (!participantPhone) throw new Error('연락처를 입력해줘.');

  const answers = [];
  for (const question of selectedBundle.questions || []) {
    if (['short', 'paragraph', 'date', 'time', 'dropdown'].includes(question.question_type)) {
      const input = formRenderArea.querySelector(`[data-question-id="${question.id}"]`);
      const value = input?.value?.trim?.() ?? input?.value ?? '';
      if (question.is_required && !value) throw new Error(`[${question.title}] 항목은 필수야.`);
      const optionIds = question.question_type === 'dropdown' && value ? [value] : [];
      answers.push({
        questionId: question.id,
        valueText: question.question_type === 'dropdown' ? '' : value,
        valueJson: value ? value : null,
        optionIds
      });
      continue;
    }

    if (question.question_type === 'single') {
      const checked = formRenderArea.querySelector(`input[name="q_${question.id}"]:checked`);
      if (question.is_required && !checked) throw new Error(`[${question.title}] 항목을 선택해줘.`);
      answers.push({ questionId: question.id, valueText: '', valueJson: checked?.value || null, optionIds: checked ? [checked.value] : [] });
      continue;
    }

    if (question.question_type === 'multi') {
      const checked = [...formRenderArea.querySelectorAll(`input[name="q_${question.id}"]:checked`)];
      if (question.is_required && !checked.length) throw new Error(`[${question.title}] 항목을 선택해줘.`);
      answers.push({ questionId: question.id, valueText: '', valueJson: checked.map((node) => node.value), optionIds: checked.map((node) => node.value) });
    }
  }

  return { participantName, participantPhone, participantEmail, answers };
}

function selectedEventsFromAnswers(answerPayload) {
  const events = [];
  for (const question of selectedBundle.questions || []) {
    const answer = answerPayload.answers.find((row) => row.questionId === question.id);
    if (!answer?.optionIds?.length) continue;
    for (const optionId of answer.optionIds) {
      const option = (question.options || []).find((item) => item.id === optionId);
      if (option?.event_start_at) {
        events.push({
          title: `${selectedBundle.program?.name || '귤귤'} · ${option.label}`,
          description: selectedBundle.form?.description || '',
          location: '',
          startAt: option.event_start_at,
          endAt: option.event_end_at || option.event_start_at
        });
      }
    }
  }
  return events;
}

async function handleSubmit() {
  try {
    if (!selectedBundle?.form?.id) throw new Error('먼저 폼을 선택해줘.');
    setStatus(statusNode, '제출 중...', '');
    const payload = buildAnswerPayload();
    const result = await submitForm({
      formId: selectedBundle.form.id,
      participantName: payload.participantName,
      participantPhone: payload.participantPhone,
      participantEmail: payload.participantEmail,
      answers: payload.answers
    });
    const events = selectedEventsFromAnswers(payload);
    renderCalendarLinks(calendarArea, events);
    setStatus(statusNode, `제출 완료 · submission_id: ${result.submission_id}`, 'ok');
    await selectForm(selectedBundle.form.id);
  } catch (error) {
    setStatus(statusNode, error.message || '제출 실패', 'err');
  }
}

async function selectForm(formId) {
  setStatus(statusNode, '폼 구조 불러오는 중...', '');
  selectedBundle = await getPublicFormBundle(formId);
  selectedCounts = await getOptionCounts(formId);
  renderFormList();
  renderSelectedForm();
  setStatus(statusNode, '폼 준비 완료', 'ok');
}

async function boot() {
  try {
    forms = await getPublishedForms();
    renderFormList();
    if (forms[0]?.id) await selectForm(forms[0].id);
    else setStatus(statusNode, '공개 폼이 아직 없어.', '');
  } catch (error) {
    formListNode.innerHTML = renderEmpty(error.message || '폼 목록을 불러오지 못했어');
    setStatus(statusNode, error.message || 'Supabase 연결 실패', 'err');
  }
}

boot();
