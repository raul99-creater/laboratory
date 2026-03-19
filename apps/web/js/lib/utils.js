export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function fmtDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

export function setStatus(node, message, type = '') {
  if (!node) return;
  node.textContent = message;
  node.className = `status ${type}`.trim();
}

export function renderEmpty(message, className = 'empty') {
  return `<div class="${className}">${escapeHtml(message)}</div>`;
}

export function menuBoot() {
  const header = document.querySelector('.site-header');
  const btn = document.querySelector('.menu-toggle');
  if (!header || !btn) return;
  btn.addEventListener('click', () => header.classList.toggle('menu-open'));
  const page = document.body.dataset.page;
  document.querySelectorAll('.site-nav a[data-page]').forEach((anchor) => {
    if (anchor.dataset.page === page) anchor.classList.add('active');
  });
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
