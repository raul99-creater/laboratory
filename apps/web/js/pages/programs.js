
import { menuBoot, escapeHtml, renderEmpty, fmtDate, qs } from '../lib/utils.js';
import { getPublishedPrograms, getPublishedForms, isDemoMode, getModeBannerText } from '../services/public-api.js';

menuBoot();
const banner = qs('#modeBanner');
if (banner && isDemoMode()) { banner.textContent = getModeBannerText(); banner.classList.remove('hidden'); }

const grid = document.querySelector('#programGrid');

async function boot() {
  try {
    const [programs, forms] = await Promise.all([getPublishedPrograms(), getPublishedForms()]);
    const formMap = new Map();
    forms.forEach((form) => {
      const list = formMap.get(form.program_id) || [];
      list.push(form);
      formMap.set(form.program_id, list);
    });

    grid.innerHTML = programs.length ? programs.map((program) => {
      const related = formMap.get(program.id) || [];
      return `
        <article class="program-card">
          <div class="program-thumb image-frame"></div>
          <div class="section-title">${escapeHtml(program.slug || 'program')}</div>
          <h3>${escapeHtml(program.name)}</h3>
          <p>${escapeHtml(program.summary || program.description || '')}</p>
          ${program.cover_note ? `<div class="note-box" style="margin-top:12px">${escapeHtml(program.cover_note)}</div>` : ''}
          <div class="stack-tight" style="margin-top:14px">
            ${related.length ? related.map((form) => `<div class="notice"><strong>${escapeHtml(form.title)}</strong><div class="subtle" style="margin-top:6px">${form.global_deadline_at ? `전체 마감 ${escapeHtml(fmtDate(form.global_deadline_at))}` : '상시 접수'}</div></div>`).join('') : '<div class="empty">공개 폼 없음</div>'}
          </div>
          <div class="meta-row" style="margin-top:14px;justify-content:space-between;align-items:center">
            <span class="badge">공개 폼 ${related.length}개</span>
            <a class="text-link" href="participate.html">바로 신청 →</a>
          </div>
        </article>
      `;
    }).join('') : renderEmpty('공개된 프로그램이 없어');
  } catch (error) {
    grid.innerHTML = renderEmpty(error.message || '프로그램 로드 실패');
  }
}

boot();
