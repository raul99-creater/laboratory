
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function fmtDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR') : '-';
}

export function toLocalInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function setStatus(message, type = '') {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = message;
  el.className = 'status' + (type ? ` ${type}` : '');
}

export function qs(id) {
  return document.getElementById(id);
}

export function renderEmpty(colspan, text = '데이터 없음') {
  return `<tr><td colspan="${colspan}" class="empty">${text}</td></tr>`;
}

function formatIcsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function createGoogleCalendarUrl(event) {
  const start = event.startAt || event.eventStartAt;
  const end = event.endAt || event.eventEndAt || start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.label || event.title || '이벤트 일정',
    dates: `${formatIcsDate(start)}/${formatIcsDate(end)}`,
    details: event.description || '',
    location: event.location || '',
    ctz: 'Asia/Seoul'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadEventIcs(event, filename = 'event') {
  const start = event.startAt || event.eventStartAt;
  const end = event.endAt || event.eventEndAt || start;
  const text = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GYULGYUL//HUB//KO',
    'BEGIN:VEVENT',
    `UID:${filename}@gyulgyul.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${event.label || event.title || '이벤트 일정'}`,
    `DESCRIPTION:${String(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
}
