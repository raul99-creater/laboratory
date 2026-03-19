import { menuBoot, escapeHtml, renderEmpty, fmtDate } from '../lib/utils.js';
import { getPublishedPrograms, getPublishedForms } from '../services/public-api.js';

menuBoot();

const grid = document.querySelector('#programGrid');

async function boot() {
  try {
    const [programs, forms] = await Promise.all([getPublishedPrograms(), getPublishedForms()]);
    const formCountMap = new Map();
    forms.forEach((form) => formCountMap.set(form.program_id, (formCountMap.get(form.program_id) || 0) + 1));
    grid.innerHTML = programs.length ? programs.map((program) => `
      <article class="program-card">
        <div class="section-title">${escapeHtml(program.slug || 'program')}</div>
        <h3>${escapeHtml(program.name)}</h3>
        <p>${escapeHtml(program.summary || program.description || '')}</p>
        ${program.cover_note ? `<div class="note-box">${escapeHtml(program.cover_note)}</div>` : ''}
        <div class="meta-row" style="margin-top:12px;justify-content:space-between">
          <span class="badge">공개 폼 ${formCountMap.get(program.id) || 0}개</span>
          <span class="subtle">생성 ${escapeHtml(fmtDate(program.created_at))}</span>
        </div>
      </article>
    `).join('') : renderEmpty('공개된 프로그램이 없어');
  } catch (error) {
    grid.innerHTML = renderEmpty(error.message || '프로그램 로드 실패');
  }
}

boot();
