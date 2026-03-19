
import { loadData } from './storage.js';
import { computeFormStatus, getLecture, countFormSubmissions } from './form-engine.js';
import { escapeHtml, fmtDate } from './utils.js';
import { BRAND, PARTNERS, FAQS, SUPPORT_INFO } from './site-content.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function bindMenuToggle() {
  const toggle = $('.menu-toggle');
  const header = $('.site-header');
  if (!toggle || !header) return;
  toggle.addEventListener('click', () => header.classList.toggle('menu-open'));
}

function cardMeta(form, lecture, data) {
  const status = computeFormStatus(data, form);
  const firstEvent = form.questions
    .flatMap((q) => q.options || [])
    .find((opt) => opt.eventStartAt);
  return `
    <div class="program-meta">
      <div><strong>프로그램</strong> ${escapeHtml(lecture?.name || '-')}</div>
      <div><strong>현재 상태</strong> ${escapeHtml(status.label)}</div>
      <div><strong>제출 수</strong> ${countFormSubmissions(data, form.id)}${form.maxResponses !== '' ? ` / ${form.maxResponses}` : ''}</div>
      <div><strong>가장 가까운 일정</strong> ${escapeHtml(firstEvent ? fmtDate(firstEvent.eventStartAt) : (form.globalDeadlineAt ? fmtDate(form.globalDeadlineAt) : '-'))}</div>
    </div>
  `;
}

function makeProgramCard(form, data) {
  const lecture = getLecture(data, form.lectureId);
  const status = computeFormStatus(data, form);
  return `
    <article class="program-card">
      <div class="image-frame program-thumb"></div>
      <div class="course-badge-row">
        <span class="chip">${escapeHtml(lecture?.name || '프로그램')}</span>
        <span class="pill ${status.color}">${escapeHtml(status.label)}</span>
      </div>
      <h3>${escapeHtml(form.title)}</h3>
      <p>${escapeHtml(form.description || lecture?.description || '설명이 준비 중입니다.')}</p>
      ${cardMeta(form, lecture, data)}
      <div class="card-actions top-space">
        <a class="btn btn-primary" href="participate.html?formId=${encodeURIComponent(form.id)}">신청하기</a>
      </div>
    </article>
  `;
}

function renderHome() {
  const data = loadData();
  const featured = $('#featuredPrograms');
  const opening = $('#homeOpenings');
  const partnerList = $('#homePartnerList');
  const heroStats = $('#heroStats');
  const faqTarget = $('#faqList');

  if (featured) featured.innerHTML = data.forms.slice(0, 3).map((form) => makeProgramCard(form, data)).join('');
  if (opening) {
    opening.innerHTML = data.forms.map((form) => {
      const lecture = getLecture(data, form.lectureId);
      const status = computeFormStatus(data, form);
      return `
        <article class="story-card">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div>
              <span class="chip">${escapeHtml(lecture?.name || '프로그램')}</span>
              <h3 style="margin:12px 0 8px;font-size:22px">${escapeHtml(form.title)}</h3>
            </div>
            <span class="pill ${status.color}">${escapeHtml(status.label)}</span>
          </div>
          <p>${escapeHtml(form.description || lecture?.description || '')}</p>
          ${cardMeta(form, lecture, data)}
          <div class="actions-inline top-space"><a class="btn btn-secondary" href="participate.html?formId=${encodeURIComponent(form.id)}">바로 참여</a></div>
        </article>
      `;
    }).join('');
  }
  if (partnerList) {
    partnerList.innerHTML = PARTNERS.map((item) => `
      <article class="partner-card">
        <div class="image-frame partner-thumb"></div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="chip">${escapeHtml(item.role)}</div>
        <p class="top-space">${escapeHtml(item.bio)}</p>
        <div class="tag-row top-space">${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </article>
    `).join('');
  }
  if (heroStats) {
    const openForms = data.forms.filter((form) => !computeFormStatus(data, form).closed).length;
    heroStats.innerHTML = `
      <div class="stat"><div class="k">OPEN FORMS</div><div class="v">${openForms}</div></div>
      <div class="stat"><div class="k">PROGRAMS</div><div class="v">${data.lectures.length}</div></div>
      <div class="stat"><div class="k">ENTRIES</div><div class="v">${data.submissions.length}</div></div>
    `;
  }
  if (faqTarget) {
    faqTarget.innerHTML = FAQS.map((item, index) => `
      <details ${index === 0 ? 'open' : ''}>
        <summary>${escapeHtml(item.q)}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>
    `).join('');
  }
}

function renderProgramsPage() {
  const target = $('#programList');
  if (!target) return;
  const data = loadData();
  const pills = $$('.filter-pill');

  const render = (programId = 'ALL') => {
    const forms = data.forms.filter((form) => programId === 'ALL' || form.lectureId === programId);
    target.innerHTML = forms.length
      ? forms.map((form) => makeProgramCard(form, data)).join('')
      : `<div class="empty-state">조건에 맞는 모집이 아직 없습니다.</div>`;
  };

  const pillWrap = $('#programFilters');
  if (pillWrap) {
    pillWrap.innerHTML = `<button class="filter-pill is-active" data-program="ALL">전체</button>` + data.lectures.map((lecture) => `<button class="filter-pill" data-program="${lecture.id}">${escapeHtml(lecture.name)}</button>`).join('');
    $$('.filter-pill', pillWrap).forEach((pill) => {
      pill.addEventListener('click', () => {
        $$('.filter-pill', pillWrap).forEach((node) => node.classList.remove('is-active'));
        pill.classList.add('is-active');
        render(pill.dataset.program || 'ALL');
      });
    });
  }

  render();
}

function renderPartnersPage() {
  const target = $('#partnerListPage');
  if (!target) return;
  target.innerHTML = PARTNERS.map((item) => `
    <article class="partner-card">
      <div class="image-frame partner-thumb"></div>
      <h3>${escapeHtml(item.name)}</h3>
      <div class="chip">${escapeHtml(item.role)}</div>
      <p class="top-space">${escapeHtml(item.bio)}</p>
      <div class="tag-row top-space">${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
    </article>
  `).join('');
}

function renderSupportPage() {
  const email = $('#supportEmail');
  const channel = $('#supportChannel');
  const hours = $('#supportHours');
  const faqTarget = $('#supportFaqList');
  if (email) email.textContent = SUPPORT_INFO.email;
  if (channel) channel.textContent = SUPPORT_INFO.channel;
  if (hours) hours.textContent = SUPPORT_INFO.hours;
  if (faqTarget) faqTarget.innerHTML = FAQS.map((item) => `
    <details>
      <summary>${escapeHtml(item.q)}</summary>
      <p>${escapeHtml(item.a)}</p>
    </details>
  `).join('');
}

function markActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    if (link.dataset.page === page) link.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindMenuToggle();
  markActiveNav();
  renderHome();
  renderProgramsPage();
  renderPartnersPage();
  renderSupportPage();
  const brandName = document.querySelectorAll('[data-brand-name]');
  brandName.forEach((node) => { node.textContent = BRAND.name; });
});
