/* =========================================================
   Pagination: slicing and an accessible page control.
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});

  function paginate(items, page, size) {
    const pages = Math.max(1, Math.ceil(items.length / size));
    const p = Math.min(Math.max(1, page), pages);
    return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length, size };
  }

  /* Page numbers with ellipses: 1 … 4 5 6 … 12 */
  function windowed(page, pages) {
    const out = [], add = n => { if (!out.includes(n) && n >= 1 && n <= pages) out.push(n); };
    [1, page - 1, page, page + 1, pages].forEach(add);
    out.sort((a, b) => a - b);
    const withGaps = [];
    out.forEach((n, i) => { if (i && n - out[i - 1] > 1) withGaps.push('…'); withGaps.push(n); });
    return withGaps;
  }

  function render(container, info, onGo) {
    if (info.pages <= 1) { container.innerHTML = ''; return; }
    const btn = (label, target, extra = '', aria = '') =>
      `<button type="button" class="pager__btn ${extra}" data-page="${target}" ${aria}>${label}</button>`;
    container.innerHTML =
      btn('<span aria-hidden="true">←</span> Prev', info.page - 1, 'pager__nav', `aria-label="Previous page"${info.page === 1 ? ' disabled' : ''}`) +
      windowed(info.page, info.pages).map(n => n === '…'
        ? '<span class="pager__gap" aria-hidden="true">…</span>'
        : btn(n, n, n === info.page ? 'is-current' : '', `aria-label="Page ${n}"${n === info.page ? ' aria-current="page"' : ''}`)).join('') +
      btn('Next <span aria-hidden="true">→</span>', info.page + 1, 'pager__nav', `aria-label="Next page"${info.page === info.pages ? ' disabled' : ''}`);
    container.onclick = e => {
      const b = e.target.closest('button[data-page]');
      if (b && !b.disabled) onGo(+b.dataset.page);
    };
  }

  A.pagination = { paginate, render };
})();
