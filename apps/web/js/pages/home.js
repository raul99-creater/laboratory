import { menuBoot, escapeHtml, renderEmpty } from '../lib/utils.js';
import { getPublishedPrograms, getFaqs } from '../services/public-api.js';

menuBoot();

const programTarget = document.querySelector('#featuredPrograms');
const faqTarget = document.querySelector('#faqList');

async function boot() {
  try {
    const [programs, faqs] = await Promise.all([getPublishedPrograms(), getFaqs()]);
    programTarget.innerHTML = programs.length ? programs.slice(0, 6).map((program) => `
      <article class="program-card">
        <div class="section-title">${escapeHtml(program.slug || 'program')}</div>
        <h3>${escapeHtml(program.name)}</h3>
        <p>${escapeHtml(program.summary || program.description || '')}</p>
        <div class="meta-row"><span class="badge">공개중</span><a class="text-link" href="participate.html">신청하러 가기 →</a></div>
      </article>
    `).join('') : renderEmpty('공개된 프로그램이 아직 없어');

    faqTarget.innerHTML = faqs.length ? faqs.map((faq) => `
      <details class="faq-item"><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>
    `).join('') : renderEmpty('FAQ가 아직 없어');
  } catch (error) {
    programTarget.innerHTML = renderEmpty(error.message || '프로그램을 불러오지 못했어');
    faqTarget.innerHTML = renderEmpty('FAQ를 불러오지 못했어');
  }
}

boot();
