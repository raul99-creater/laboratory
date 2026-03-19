
import { uid, nowIso, fmtDate } from './utils.js';

export function normalizeQuestion(question) {
  return {
    id: question.id || uid('q'),
    type: question.type || 'short',
    title: question.title || '질문',
    description: question.description || '',
    required: !!question.required,
    options: (question.options || []).map((option) => ({
      id: option.id || uid('opt'),
      label: option.label || '',
      deadlineAt: option.deadlineAt || '',
      capacity: option.capacity === null || option.capacity === undefined || option.capacity === '' ? '' : Number(option.capacity),
      eventStartAt: option.eventStartAt || '',
      eventEndAt: option.eventEndAt || ''
    }))
  };
}

export function normalizeForm(form) {
  return {
    id: form.id || uid('form'),
    lectureId: form.lectureId || '',
    title: form.title || '새 신청폼',
    description: form.description || '',
    globalDeadlineAt: form.globalDeadlineAt || '',
    maxResponses: form.maxResponses === null || form.maxResponses === undefined || form.maxResponses === '' ? '' : Number(form.maxResponses),
    isPublished: form.isPublished !== false,
    questions: (form.questions || []).map(normalizeQuestion),
    createdAt: form.createdAt || nowIso(),
    updatedAt: form.updatedAt || nowIso()
  };
}

export function getLecture(data, lectureId) {
  return data.lectures.find((x) => x.id === lectureId);
}

export function getForm(data, formId) {
  return data.forms.find((x) => x.id === formId);
}

export function updateFormTimestamp(form) {
  form.updatedAt = nowIso();
}

export function countFormSubmissions(data, formId) {
  return data.submissions.filter((x) => x.formId === formId).length;
}

export function countOptionSelections(data, formId, questionId, optionId) {
  return data.submissions.filter((submission) => {
    if (submission.formId !== formId) return false;
    const answer = (submission.answers || []).find((x) => x.questionId === questionId);
    if (!answer) return false;
    if (Array.isArray(answer.value)) return answer.value.includes(optionId);
    return answer.value === optionId;
  }).length;
}

export function computeFormStatus(data, form) {
  const now = Date.now();
  if (form.isPublished === false) return { label: '비공개', color: 'red', closed: true, reason: '운영자가 비공개로 설정함' };
  if (form.globalDeadlineAt && new Date(form.globalDeadlineAt).getTime() < now) return { label: '접수 종료', color: 'red', closed: true, reason: '전체 마감 시간이 지났습니다.' };
  const count = countFormSubmissions(data, form.id);
  if (form.maxResponses !== '' && Number.isFinite(Number(form.maxResponses)) && count >= Number(form.maxResponses)) {
    return { label: '정원 마감', color: 'red', closed: true, reason: '전체 제출 정원이 모두 찼습니다.' };
  }
  return { label: '참여 가능', color: 'green', closed: false, reason: '' };
}

export function computeOptionStatus(data, form, question, option) {
  const now = Date.now();
  if (option.deadlineAt && new Date(option.deadlineAt).getTime() < now) {
    return { closed: true, reason: '선택지 마감 시간 종료' };
  }
  const used = countOptionSelections(data, form.id, question.id, option.id);
  if (option.capacity !== '' && Number.isFinite(Number(option.capacity)) && used >= Number(option.capacity)) {
    return { closed: true, reason: '선택지 정원 마감' };
  }
  return { closed: false, reason: '' };
}

export function getQuestionTypeName(type) {
  return {
    short: '단답형',
    paragraph: '장문형',
    single: '객관식(단일선택)',
    multi: '체크박스(다중선택)',
    dropdown: '드롭다운',
    date: '날짜',
    time: '시간'
  }[type] || type;
}

export function getMySubmissions(data, viewerKey) {
  return data.submissions.filter((x) => x.viewerKey === viewerKey);
}

export function getMyEvents(data, viewerKey) {
  return getMySubmissions(data, viewerKey)
    .flatMap((submission) => (submission.selectedEvents || []).map((event) => ({
      ...event,
      formId: submission.formId,
      createdAt: submission.createdAt
    })))
    .filter((event) => event.startAt);
}

export function describeEventRange(startAt, endAt) {
  return `${fmtDate(startAt)}${endAt ? ` ~ ${fmtDate(endAt)}` : ''}`;
}
