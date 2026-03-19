import { fmtDate } from '../lib/utils.js';

function toUtcIcs(value) {
  const date = new Date(value);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildGoogleCalendarUrl(event) {
  const start = event.startAt ? new Date(event.startAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') : '';
  const end = event.endAt ? new Date(event.endAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') : start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '귤귤 일정',
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location || ''
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(events) {
  const body = events.map((event, index) => [
    'BEGIN:VEVENT',
    `UID:gyulgyul-${Date.now()}-${index}`,
    `DTSTAMP:${toUtcIcs(new Date().toISOString())}`,
    `DTSTART:${toUtcIcs(event.startAt)}`,
    `DTEND:${toUtcIcs(event.endAt || event.startAt)}`,
    `SUMMARY:${(event.title || '귤귤 일정').replace(/
/g, ' ')}`,
    `DESCRIPTION:${(event.description || '').replace(/
/g, ' ')}`,
    `LOCATION:${(event.location || '').replace(/
/g, ' ')}`,
    'END:VEVENT'
  ].join('
')).join('
');

  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GYULGYUL//KR','CALSCALE:GREGORIAN', body, 'END:VCALENDAR'].join('
');
}

export function downloadIcs(filename, events) {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function renderCalendarLinks(target, events) {
  if (!target) return;
  if (!events?.length) {
    target.innerHTML = '<div class="muted">아직 생성된 일정이 없어</div>';
    return;
  }
  target.innerHTML = `
    <div class="stack">
      <div class="notice">선택된 일정 ${events.length}건</div>
      <div class="calendar-links">
        ${events.map((event, index) => `
          <div class="hero-card">
            <div class="section-title">EVENT ${index + 1}</div>
            <div style="font-size:18px;font-weight:700;margin:6px 0">${event.title}</div>
            <div class="muted">${fmtDate(event.startAt)}${event.endAt ? ` ~ ${fmtDate(event.endAt)}` : ''}</div>
            <div class="page-actions top-space">
              <a class="btn btn-secondary" target="_blank" rel="noreferrer" href="${buildGoogleCalendarUrl(event)}">Google Calendar</a>
              <button class="btn btn-outline js-ics-one" data-index="${index}">ICS 저장</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btnDownloadAllIcs">전체 일정 ICS 저장</button>
      </div>
    </div>
  `;
  target.querySelectorAll('.js-ics-one').forEach((button) => {
    button.addEventListener('click', () => downloadIcs(`gyulgyul-event-${Number(button.dataset.index)+1}.ics`, [events[Number(button.dataset.index)]]));
  });
  target.querySelector('#btnDownloadAllIcs')?.addEventListener('click', () => downloadIcs('gyulgyul-schedule.ics', events));
}
