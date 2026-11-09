/* Shared chrome for the static legal pages: mobile nav, back-to-top, footer lists. */
(function () {
  'use strict';
  const A = window.Atlas, U = A.utils, { $, $$, esc } = U;
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks'), toTop = $('#toTop');
  const setMenu = open => {
    links.classList.toggle('is-open', open); nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('navlock', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('scroll', () => toTop.classList.toggle('is-show', window.pageYOffset > 800), { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#year').textContent = new Date().getFullYear();
  $('#footCities').innerHTML = A.cities.slice(0, 6).map(c => `<li><a href="index.html?city=${encodeURIComponent(c.name)}#discover">${esc(c.name)}</a></li>`).join('');
  $('#credits').innerHTML = A.cities.map(c => `<li>${esc(c.name)}: <a href="${esc(c.credit.url)}" target="_blank" rel="noopener">“${esc(c.credit.title)}”</a> by ${esc(c.credit.author)}, ${esc(c.credit.licence)}</li>`).join('');
})();
