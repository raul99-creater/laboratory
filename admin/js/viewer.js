
import { loadData, loadProfile, saveProfile, saveData } from './storage.js';
import { escapeHtml, fmtDate, setStatus, qs, renderEmpty, createGoogleCalendarUrl, downloadEventIcs } from './utils.js';
import {
  getForm,
  getLecture,
  computeFormStatus,
  computeOptionStatus,
  countFormSubmissions,
  getMySubmissions,
  getMyEvents,
  describeEventRange
} from './form-engine.js';

let selectedFormId = null;
let calendarCursor = new Date();

function renderProfile() {
  const profile = loadProfile();
  qs('viewerKey').value = profile.viewerKey || '';
  qs('viewerName').value = profile.viewerName || '';
  qs('viewerPhone').value = profile.viewerPhone || '';
}

function saveMyProfile() {
  const viewerKey = qs('viewerKey').value.trim();
  const viewerName = qs('viewerName').value.trim();
  const viewerPhone = qs('viewerPhone').value.trim();
  saveProfile({ viewerKey, viewerName, viewerPhone });
  refreshAll();
  setStatus('내 정보 저장 완료', 'ok');
}

function renderFormList() {
  const data = loadData();
  const list = qs('formList');
  if (!data.forms.length) {
    list.innerHTML = `<div class="empty">지금 공개된 신청 폼이 없어</div>`;
    return;
  }

  list.innerHTML = data.forms.map((form) => {
    const lecture = getLecture(data, form.lectureId);
    const status = computeFormStatus(data, form);
    return `
      <div class="form-card ${selectedFormId === form.id ? 'active' : ''}" data-select-form="${form.id}">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <div class="chip">${escapeHtml(lecture?.name || '프로그램')}</div>
            <div style="font-weight:700;font-size:18px;margin-top:10px">${escapeHtml(form.title)}</div>
          </div>
          <span class="pill ${status.color}">${escapeHtml(status.label)}</span>
        </div>
        <p class="muted" style="margin:10px 0 0">${escapeHtml(form.description || lecture?.description || '')}</p>
        <div class="meta-row" style="margin-top:10px;justify-content:space-between">
          <div>질문 ${form.questions.length}개</div>
          <div>제출 ${countFormSubmissions(data, form.id)}건</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderQuestionInput(data, form, question) {
  const required = question.required ? '<span style="color:#dc2626">*</span>' : '';
  const title = `<div style="font-weight:900;margin-bottom:6px">${escapeHtml(question.title)} ${required}</div>`;
  const desc = question.description ? `<div class="muted" style="margin-bottom:10px">${escapeHtml(question.description)}</div>` : '';

  if (question.type === 'short') return `<div class="question-block">${title}${desc}<input data-question-id="${question.id}" class="input js-answer" type="text" placeholder="답변 입력"></div>`;
  if (question.type === 'paragraph') return `<div class="question-block">${title}${desc}<textarea data-question-id="${question.id}" class="textarea js-answer" placeholder="답변 입력"></textarea></div>`;
  if (question.type === 'date') return `<div class="question-block">${title}${desc}<input data-question-id="${question.id}" class="input js-answer" type="date"></div>`;
  if (question.type === 'time') return `<div class="question-block">${title}${desc}<input data-question-id="${question.id}" class="input js-answer" type="time"></div>`;
  if (question.type === 'dropdown') {
    return `<div class="question-block">${title}${desc}<select data-question-id="${question.id}" class="select js-answer"><option value="">선택하세요</option>${(question.options || []).map((option) => {
      const status = computeOptionStatus(data, form, question, option);
      const used = data.submissions.filter((submission) => {
        if (submission.formId !== form.id) return false;
        const answer = (submission.answers || []).find((item) => item.questionId === question.id);
        if (!answer) return false;
        if (Array.isArray(answer.value)) return answer.value.includes(option.id);
        return answer.value === option.id;
      }).length;
      const capText = option.capacity !== '' ? ` / ${option.capacity}` : '';
      return `<option value="${option.id}" ${status.closed ? 'disabled' : ''}>${escapeHtml(option.label)}${status.closed ? ' (마감)' : ''} [${used}${capText}]</option>`;
    }).join('')}</select></div>`;
  }
  if (question.type === 'single' || question.type === 'multi') {
    return `<div class="question-block">${title}${desc}<div class="grid">${(question.options || []).map((option) => {
      const status = computeOptionStatus(data, form, question, option);
      const used = data.submissions.filter((submission) => {
        if (submission.formId !== form.id) return false;
        const answer = (submission.answers || []).find((item) => item.questionId === question.id);
        if (!answer) return false;
        if (Array.isArray(answer.value)) return answer.value.includes(option.id);
        return answer.value === option.id;
      }).length;
      const capText = option.capacity !== '' ? ` / ${option.capacity}` : '';
      return `<label class="option ${status.closed ? 'disabled' : ''}"><input ${status.closed ? 'disabled' : ''} type="${question.type === 'single' ? 'radio' : 'checkbox'}" name="q_${question.id}" value="${option.id}" data-question-id="${question.id}" class="js-option"><div><div style="font-weight:800">${escapeHtml(option.label)}</div><div class="muted" style="margin-top:4px">신청 ${used}${capText}</div>${option.deadlineAt ? `<div class="muted">마감: ${escapeHtml(fmtDate(option.deadlineAt))}</div>` : ''}${option.eventStartAt ? `<div class="muted">행사: ${escapeHtml(describeEventRange(option.eventStartAt, option.eventEndAt))}</div>` : ''}${status.closed ? `<div class="pill red" style="margin-top:6px">${escapeHtml(status.reason)}</div>` : ''}</div></label>`;
    }).join('') || `<div class="muted">선택지가 없어</div>`}</div></div>`;
  }
  return '';
}

function renderSelectedForm() {
  const data = loadData();
  const area = qs('formRenderArea');
  const form = getForm(data, selectedFormId);
  if (!form) {
    area.innerHTML = `<div class="empty">왼쪽에서 제출할 신청 폼을 선택해줘</div>`;
    qs('statSelectedForm').textContent = '-';
    return;
  }
  const lecture = getLecture(data, form.lectureId);
  const status = computeFormStatus(data, form);
  qs('statSelectedForm').textContent = form.title;

  area.innerHTML = `
    <div class="question-block" style="background:#fffdf9">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <div class="pill ${status.color}">${escapeHtml(status.label)}</div>
          <div style="font-size:21px;font-weight:700;margin-top:10px">${escapeHtml(form.title)}</div>
          <div class="muted" style="margin-top:4px">${escapeHtml(lecture?.name || '-')}</div>
          ${form.description ? `<div class="muted" style="margin-top:10px">${escapeHtml(form.description)}</div>` : ''}
        </div>
        <div class="muted">전체 제출 ${countFormSubmissions(data, form.id)}${form.maxResponses !== '' ? ` / ${form.maxResponses}` : ''}</div>
      </div>
      ${form.globalDeadlineAt ? `<div class="muted" style="margin-top:10px">전체 마감: ${escapeHtml(fmtDate(form.globalDeadlineAt))}</div>` : ''}
    </div>
    ${form.questions.map((question) => renderQuestionInput(data, form, question)).join('')}
    <div class="row">
      <button class="btn btn-primary" id="btnSubmitCurrentForm" ${status.closed ? 'disabled' : ''}>제출하기</button>
      ${status.closed ? `<span class="pill red">${escapeHtml(status.reason)}</span>` : ''}
    </div>
  `;

  qs('btnSubmitCurrentForm')?.addEventListener('click', submitCurrentForm);
}

function collectAnswers(form) {
  const data = loadData();
  const area = qs('formRenderArea');
  const answers = [];
  const selectedEvents = [];

  for (const question of form.questions) {
    if (['short', 'paragraph', 'date', 'time'].includes(question.type)) {
      const el = area.querySelector(`.js-answer[data-question-id="${question.id}"]`);
      const value = el ? el.value.trim() : '';
      if (question.required && !value) return { error: `[${question.title}] 항목은 필수야.` };
      answers.push({ questionId: question.id, type: question.type, value });
      continue;
    }
    if (question.type === 'dropdown') {
      const el = area.querySelector(`.js-answer[data-question-id="${question.id}"]`);
      const value = el ? el.value : '';
      if (question.required && !value) return { error: `[${question.title}] 항목을 선택해줘.` };
      if (value) {
        const option = question.options.find((item) => item.id === value);
        const status = computeOptionStatus(data, form, question, option);
        if (status.closed) return { error: `[${question.title}] 선택지 ${option.label} 는 이미 마감됐어.` };
        if (option.eventStartAt) selectedEvents.push({ questionId: question.id, optionId: option.id, label: option.label, startAt: option.eventStartAt, endAt: option.eventEndAt || '', title: option.label });
      }
      answers.push({ questionId: question.id, type: question.type, value });
      continue;
    }
    if (question.type === 'single') {
      const checked = area.querySelector(`input[name="q_${question.id}"]:checked`);
      const value = checked ? checked.value : '';
      if (question.required && !value) return { error: `[${question.title}] 항목을 선택해줘.` };
      if (value) {
        const option = question.options.find((item) => item.id === value);
        const status = computeOptionStatus(data, form, question, option);
        if (status.closed) return { error: `[${question.title}] 선택지 ${option.label} 는 이미 마감됐어.` };
        if (option.eventStartAt) selectedEvents.push({ questionId: question.id, optionId: option.id, label: option.label, startAt: option.eventStartAt, endAt: option.eventEndAt || '', title: option.label });
      }
      answers.push({ questionId: question.id, type: question.type, value });
      continue;
    }
    if (question.type === 'multi') {
      const checkedList = [...area.querySelectorAll(`input[name="q_${question.id}"]:checked`)];
      const value = checkedList.map((node) => node.value);
      if (question.required && !value.length) return { error: `[${question.title}] 항목을 하나 이상 선택해줘.` };
      for (const optionId of value) {
        const option = question.options.find((item) => item.id === optionId);
        const status = computeOptionStatus(data, form, question, option);
        if (status.closed) return { error: `[${question.title}] 선택지 ${option.label} 는 이미 마감됐어.` };
        if (option.eventStartAt) selectedEvents.push({ questionId: question.id, optionId: option.id, label: option.label, startAt: option.eventStartAt, endAt: option.eventEndAt || '', title: option.label });
      }
      answers.push({ questionId: question.id, type: question.type, value });
    }
  }

  return { answers, selectedEvents };
}

function submitCurrentForm() {
  const profile = loadProfile();
  if (!profile.viewerKey || !profile.viewerName || !profile.viewerPhone) return setStatus('먼저 참여자 식별값, 이름, 연락처를 저장해줘.', 'err');
  const data = loadData();
  const form = getForm(data, selectedFormId);
  if (!form) return setStatus('선택된 폼이 없어.', 'err');
  const formStatus = computeFormStatus(data, form);
  if (formStatus.closed) return setStatus(`제출 불가: ${formStatus.reason}`, 'err');
  const collected = collectAnswers(form);
  if (collected.error) return setStatus(collected.error, 'err');

  data.submissions.unshift({
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    formId: form.id,
    lectureId: form.lectureId,
    viewerKey: profile.viewerKey,
    viewerName: profile.viewerName,
    viewerPhone: profile.viewerPhone,
    answers: collected.answers,
    selectedEvents: collected.selectedEvents,
    createdAt: new Date().toISOString()
  });

  saveData(data);
  refreshAll();
  setStatus('제출 완료', 'ok');
}

function renderMySubmissions() {
  const data = loadData();
  const profile = loadProfile();
  const tbody = qs('mySubmissionTableBody');
  const mySubs = getMySubmissions(data, profile.viewerKey);
  if (!mySubs.length) {
    tbody.innerHTML = renderEmpty(3, '내 제출 내역이 아직 없어');
    qs('statMyForms').textContent = '0';
    return;
  }
  tbody.innerHTML = mySubs.map((submission) => {
    const form = getForm(data, submission.formId);
    return `<tr><td>${escapeHtml(form?.title || '-')}</td><td>${escapeHtml(fmtDate(submission.createdAt))}</td><td>${escapeHtml((submission.selectedEvents || []).map((event) => event.label).join(', ') || '-')}</td></tr>`;
  }).join('');
  qs('statMyForms').textContent = mySubs.length;
}

function renderEventList(events) {
  const list = qs('eventList');
  qs('statMyEvents').textContent = events.length;
  if (!events.length) {
    list.innerHTML = `<div class="empty">달력에 표시할 일정이 아직 없어</div>`;
    return;
  }
  list.innerHTML = events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).map((event, index) => `
    <div class="question-block">
      <div class="pill green">참여 완료</div>
      <div style="font-size:16px;font-weight:700;margin-top:10px">${escapeHtml(event.label)}</div>
      <div class="muted" style="margin-top:6px">${escapeHtml(describeEventRange(event.startAt, event.endAt))}</div>
      <div class="actions-inline top-space">
        <a class="btn btn-secondary small" href="${createGoogleCalendarUrl(event)}" target="_blank" rel="noopener">Google Calendar</a>
        <button class="btn btn-ghost small" type="button" data-download-event="${index}">ICS 저장</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-download-event]').forEach((button) => {
    button.addEventListener('click', () => {
      const event = events[Number(button.dataset.downloadEvent)];
      downloadEventIcs(event, `gyulgyul-event-${Number(button.dataset.downloadEvent) + 1}`);
    });
  });
}

function renderCalendar(events) {
  const grid = qs('calendarGrid');
  const title = qs('calendarTitle');
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  title.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const cells = [];
  dayNames.forEach((name) => cells.push(`<div class="day-name">${name}</div>`));
  for (let i = 0; i < startWeekday; i += 1) cells.push(`<div class="day-cell"></div>`);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter((event) => {
      const date = new Date(event.startAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return key === dateKey;
    });
    cells.push(`<div class="day-cell"><div class="day-num">${day}</div>${dayEvents.map((event) => `<span class="event-chip">${escapeHtml(event.label)}</span>`).join('')}</div>`);
  }
  grid.innerHTML = cells.join('');
}

function selectForm(formId) {
  selectedFormId = formId;
  renderFormList();
  renderSelectedForm();
}

function refreshAll() {
  const data = loadData();
  renderProfile();
  const openForms = data.forms.filter((form) => !computeFormStatus(data, form).closed).length;
  qs('statOpenForms').textContent = openForms;
  renderFormList();

  const params = new URLSearchParams(window.location.search);
  const queryFormId = params.get('formId');
  if (queryFormId && data.forms.find((form) => form.id === queryFormId)) selectedFormId = queryFormId;
  if (!selectedFormId && data.forms[0]) selectedFormId = data.forms[0].id;
  if (selectedFormId && !data.forms.find((form) => form.id === selectedFormId)) selectedFormId = data.forms[0]?.id || null;

  renderSelectedForm();
  renderMySubmissions();
  const events = getMyEvents(data, loadProfile().viewerKey);
  renderEventList(events);
  renderCalendar(events);
}

function wirePage() {
  qs('btnSaveProfile').addEventListener('click', saveMyProfile);
  qs('btnPrevMonth').addEventListener('click', () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderCalendar(getMyEvents(loadData(), loadProfile().viewerKey));
  });
  qs('btnNextMonth').addEventListener('click', () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderCalendar(getMyEvents(loadData(), loadProfile().viewerKey));
  });
  document.addEventListener('click', (event) => {
    const formTrigger = event.target.closest('[data-select-form]');
    if (formTrigger) selectForm(formTrigger.dataset.selectForm);
  });
}

wirePage();
refreshAll();
setStatus('참여 화면 로드 완료', 'ok');
