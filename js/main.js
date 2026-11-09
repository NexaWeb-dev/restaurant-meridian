/* =========================================================
   Meridian Coffee Atlas: page controller (index.html)
   Wires search, filters, location, sorting, pagination, map and
   the page-level interactions together.
   ========================================================= */
(function () {
  'use strict';
  const A = window.Atlas, U = A.utils, { $, $$, esc } = U;
  const PAGE_SIZE = 9;
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  U.installImageFallback();

  /* ---------- State ---------- */
  const state = { q: '', state: '', city: '', area: '', openNow: false, sort: 'az', view: 'list', page: 1 };
  let coords = null;          // visitor position (only after permission)
  let dist = null;            // Map(id -> km) when coords exist
  let sorted = [];            // filtered + sorted cafés (all pages)
  let mapDirty = true;

  const el = {
    heroForm: $('#heroForm'), heroInput: $('#heroInput'), locate: $('#locateBtn'), locStatus: $('#locStatus'),
    fState: $('#fState'), fCity: $('#fCity'), fArea: $('#fArea'), fName: $('#fName'), fOpen: $('#fOpen'),
    clear: $('#clearBtn'), emptyClear: $('#emptyClear'), count: $('#resultCount'), sort: $('#sortSel'),
    viewList: $('#viewList'), viewMap: $('#viewMap'), results: $('#results'), mapPane: $('#mapPane'),
    grid: $('#cafeGrid'), empty: $('#empty'), pager: $('#pager'), locNote: $('#locNote')
  };

  /* =====================================================
     Rendering
  ===================================================== */
  function compute() {
    let list = A.search.query(A.cafes, state.q);
    list = A.filters.apply(list, state);
    if (state.sort === 'nearest' && !dist) state.sort = 'az';
    sorted = A.filters.sort(list, state.sort, dist);
  }

  function renderList() {
    const info = A.pagination.paginate(sorted, state.page, PAGE_SIZE);
    state.page = info.page;
    const from = (info.page - 1) * PAGE_SIZE + 1, to = from + info.items.length - 1;
    el.count.innerHTML = info.total === 0
      ? '<strong>0</strong> cafés match'
      : `<strong>${info.total}</strong> café${info.total === 1 ? '' : 's'} match` + (info.pages > 1 ? ` <span>· showing ${from}–${to}</span>` : '');
    el.empty.hidden = info.total !== 0;
    el.grid.hidden = info.total === 0;
    el.grid.innerHTML = info.items.map((c, i) => U.cardHtml(c, { distanceKm: dist ? dist.get(c.id) : undefined, compact: state.view === 'map', delay: i * 45 })).join('');
    A.pagination.render(el.pager, info, goPage);
  }

  function renderMap() {
    if (state.view !== 'map') return;
    if (!A.map.isReady()) A.map.init($('#map'), { onSelect: selectFromMap });
    if (mapDirty) { A.map.setCafes(sorted); A.map.setUser(coords); mapDirty = false; }
    A.map.invalidate();
  }

  function render({ keepPage = false } = {}) {
    if (!keepPage) state.page = 1;
    syncUI();                 // drop any dropdown choice that is no longer valid before filtering
    compute();
    mapDirty = true;
    renderList();
    renderMap();
    syncUI();
    updateUrl();
  }

  /* Keep every control showing the current state */
  function syncUI() {
    A.filters.syncDropdowns(A.cafes, state, { state: el.fState, city: el.fCity, area: el.fArea });
    if (el.fName.value !== state.q && document.activeElement !== el.fName) el.fName.value = state.q;
    if (el.heroInput.value !== state.q && document.activeElement !== el.heroInput) el.heroInput.value = state.q;
    el.fOpen.checked = state.openNow;
    el.sort.value = state.sort;
    el.viewList.setAttribute('aria-pressed', state.view === 'list');
    el.viewMap.setAttribute('aria-pressed', state.view === 'map');
  }

  function updateUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.state) p.set('state', state.state);
    if (state.city) p.set('city', state.city);
    if (state.area) p.set('area', state.area);
    if (state.openNow) p.set('open', '1');
    if (state.view === 'map') p.set('view', 'map');
    const qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* file:// or sandbox */ }
  }

  function goPage(n) {
    state.page = n;
    renderList();
    const top = $('.toolbar').getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* =====================================================
     Map <-> list synchronisation
  ===================================================== */
  function highlight(id, scroll) {
    $$('.card.is-active', el.grid).forEach(c => c.classList.remove('is-active'));
    const card = $(`.card[data-id="${CSS.escape(id)}"]`, el.grid);
    if (card) {
      card.classList.add('is-active');
      if (scroll) card.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  function selectFromMap(id) {
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;
    const page = Math.floor(idx / PAGE_SIZE) + 1;
    if (page !== state.page) { state.page = page; renderList(); }
    highlight(id, true);
  }
  el.grid.addEventListener('click', e => {
    if (state.view !== 'map' || e.target.closest('a, button')) return;
    const card = e.target.closest('.card');
    if (!card) return;
    A.map.focus(card.dataset.id);
    highlight(card.dataset.id, false);
  });

  function setView(v, { scroll = false } = {}) {
    state.view = v;
    el.results.dataset.view = v;
    el.mapPane.hidden = v !== 'map';
    renderList();                       // card style differs between the views
    renderMap();
    syncUI();
    updateUrl();
    if (scroll) $('#discover').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* =====================================================
     Location
  ===================================================== */
  function setStatus(msg, isError) {
    el.locStatus.textContent = msg || '';
    el.locStatus.classList.toggle('is-error', !!isError);
  }

  async function locate() {
    setStatus('Finding your location… your browser may ask for permission.');
    el.locate.disabled = true; el.locate.setAttribute('aria-busy', 'true');
    try {
      coords = await A.location.request();
      await applyCoords();
      $('#discover').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    } catch (err) {
      setStatus(err.message || 'Could not get your location.', true);
      if (state.sort === 'nearest') { state.sort = 'az'; syncUI(); }
    } finally {
      el.locate.disabled = false; el.locate.removeAttribute('aria-busy');
    }
  }

  async function applyCoords() {
    dist = A.location.distances(A.cafes, coords);
    state.sort = 'nearest';
    render();
    A.map.setUser(coords);
    const place = await A.location.reverseGeocode(coords.lat, coords.lon);    // null while the integration is disabled
    const nearest = sorted[0];
    const nearestKm = nearest ? dist.get(nearest.id) : null;
    const where = place ? `near ${esc(place)}` : `at ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`;
    setStatus(`Location found. Cafés are now sorted by distance.`);
    el.locNote.hidden = false;
    el.locNote.innerHTML = `Sorted by distance from your location (${where}, accuracy about ${Math.round(coords.accuracy || 0).toLocaleString('en-IN')} m). Distances are straight-line estimates.` +
      (nearestKm > 150 ? ` <strong>The nearest sample café is ${U.fmtKm(nearestKm)} away.</strong> This demo only lists sample cafés in ten Indian cities.` : '') +
      ` <button type="button" class="btn btn--text btn--sm" id="clearLoc">Clear my location</button>`;
    $('#clearLoc').addEventListener('click', clearLocation);
  }

  function clearLocation() {
    coords = null; dist = null;
    A.location.clear();
    if (state.sort === 'nearest') state.sort = 'az';
    el.locNote.hidden = true; el.locNote.innerHTML = '';
    setStatus('');
    render({ keepPage: true });
    A.map.setUser(null);
  }

  /* =====================================================
     Controls
  ===================================================== */
  const resetFilters = () => {
    Object.assign(state, { q: '', state: '', city: '', area: '', openNow: false });
    el.heroInput.value = ''; el.fName.value = '';
    render();
  };
  function applyCity(city) {
    const c = A.cities.find(x => x.name === city);
    Object.assign(state, { q: '', state: '', city: c ? c.name : '', area: '', openNow: false });
    el.heroInput.value = ''; el.fName.value = '';
    render();
    $('#discover').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  el.fState.addEventListener('change', () => { state.state = el.fState.value; state.city = ''; state.area = ''; render(); });
  el.fCity.addEventListener('change', () => { state.city = el.fCity.value; state.area = ''; render(); });
  el.fArea.addEventListener('change', () => { state.area = el.fArea.value; render(); });
  el.fOpen.addEventListener('change', () => { state.openNow = el.fOpen.checked; render(); });
  el.fName.addEventListener('input', U.debounce(() => { state.q = el.fName.value.trim(); render(); }, 180));
  el.clear.addEventListener('click', resetFilters);
  el.emptyClear.addEventListener('click', resetFilters);
  $('#filters').addEventListener('submit', e => e.preventDefault());

  el.heroForm.addEventListener('submit', e => {
    e.preventDefault();
    state.q = el.heroInput.value.trim();
    render();
    $('#discover').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
  el.locate.addEventListener('click', locate);

  el.sort.addEventListener('change', () => {
    if (el.sort.value === 'nearest' && !dist) { el.sort.value = state.sort; locate(); return; }
    state.sort = el.sort.value; render({ keepPage: false });
  });
  el.viewList.addEventListener('click', () => setView('list'));
  el.viewMap.addEventListener('click', () => setView('map'));

  // City links (cards, footer) filter in place instead of reloading
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-city]');
    if (a) { e.preventDefault(); applyCity(a.dataset.city); return; }
    const v = e.target.closest('[data-view-link="map"]');
    if (v) { e.preventDefault(); setView('map', { scroll: true }); return; }
    if (e.target.closest('[data-focus-search]')) setTimeout(() => el.fName.focus({ preventScroll: true }), reduced ? 0 : 700);
  });

  /* =====================================================
     Static content built from the data
  ===================================================== */
  function buildStatic() {
    $('#placeList').innerHTML = A.search.suggestions(A.cafes).map(v => `<option value="${esc(v)}"></option>`).join('');
    const states = new Set(A.cafes.map(c => c.state)), cities = new Set(A.cafes.map(c => c.city));
    $('#heroStats').innerHTML =
      `<li><strong>${A.cafes.length}</strong> sample cafés</li><li><strong>${cities.size}</strong> cities</li><li><strong>${states.size}</strong> states &amp; territories</li>`;
    const count = name => A.cafes.filter(c => c.city === name).length;
    $('#cityGrid').innerHTML = A.cities.map((c, i) => `
      <li class="city rv" style="--i:${i % 5}">
        <a href="index.html?city=${encodeURIComponent(c.name)}#discover" data-city="${esc(c.name)}">
          <img src="${esc(c.image)}" width="1400" height="1000" alt="${esc(c.name)}: ${esc(c.credit.title)}" loading="lazy" decoding="async">
          <span class="city__body"><span class="city__count">${count(c.name)} café${count(c.name) === 1 ? '' : 's'}</span><span class="city__name">${esc(c.name)}</span><span class="city__go" aria-hidden="true">→</span></span>
        </a>
      </li>`).join('');
    $('#footCities').innerHTML = A.cities.slice(0, 6).map(c => `<li><a href="index.html?city=${encodeURIComponent(c.name)}#discover" data-city="${esc(c.name)}">${esc(c.name)}</a></li>`).join('');
    $('#credits').innerHTML = A.cities.map(c => `<li>${esc(c.name)}: <a href="${esc(c.credit.url)}" target="_blank" rel="noopener">“${esc(c.credit.title)}”</a> by ${esc(c.credit.author)}, ${esc(c.credit.licence)}</li>`).join('');
    $('#year').textContent = new Date().getFullYear();
  }

  /* Read ?q=&state=&city=&area=&open=1&view=map */
  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = (p.get('q') || '').trim();
    state.state = p.get('state') || '';
    state.city = p.get('city') || '';
    state.area = p.get('area') || '';
    state.openNow = p.get('open') === '1';
    state.view = p.get('view') === 'map' ? 'map' : 'list';
  }

  /* =====================================================
     Contact form (front-end only)
  ===================================================== */
  (function contact() {
    const f = $('#contactForm'), status = $('#contactStatus');
    const rules = {
      name: v => (v.trim().length > 1 ? '' : 'Please enter your name.'),
      email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
      msg: v => (v.trim().length > 9 ? '' : 'Please write at least a short sentence.')
    };
    const ids = { name: 'eName', email: 'eEmail', msg: 'eMsg' };
    const check = k => { const m = rules[k](f.elements[k].value); $('#' + ids[k]).textContent = m; f.elements[k].setAttribute('aria-invalid', !!m); return !m; };
    Object.keys(rules).forEach(k => f.elements[k].addEventListener('input', () => $('#' + ids[k]).textContent && check(k)));
    f.addEventListener('submit', e => {
      e.preventDefault();
      const ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) { status.textContent = ''; f.querySelector('[aria-invalid="true"]').focus(); return; }
      status.textContent = 'Thank you. This is a demo form, so your message was not sent anywhere. A live site would need a backend or form service.';
      f.reset();
    });
  })();

  /* =====================================================
     Page chrome: nav, reveal, parallax, back to top
  ===================================================== */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks'), toTop = $('#toTop'), heroBg = $('#heroBg');
  const setMenu = open => {
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('navlock', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const px = $$('[data-parallax]'), pxVisible = new Set();
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.pageYOffset;
    nav.classList.toggle('is-solid', y > 60);
    toTop.classList.toggle('is-show', y > 800);
    if (reduced) return;
    if (y < innerHeight * 1.2) heroBg.style.transform = `translate3d(0,${(y * 0.25).toFixed(1)}px,0)`;
    pxVisible.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      img.style.translate = `0 ${(-((r.top + r.height / 2) - innerHeight / 2) * parseFloat(img.dataset.parallax)).toFixed(1)}px`;
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  function setupObservers() {
    const hasIO = 'IntersectionObserver' in window;
    if (hasIO) {
      const pxIO = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? pxVisible.add(e.target) : pxVisible.delete(e.target))), { rootMargin: '15% 0px' });
      px.forEach(i => pxIO.observe(i));
    }
    const pending = new Set($$('.rv, .mask'));
    const reveal = n => { n.classList.add('is-in'); pending.delete(n); };
    if (hasIO) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      pending.forEach(n => io.observe(n));
    } else pending.forEach(reveal);
    // Fallback scan so nothing can stay hidden if the observer misses an element
    const scan = () => pending.forEach(n => { const r = n.getBoundingClientRect(); if (r.top < innerHeight * 0.96 && r.bottom > 0) reveal(n); });
    window.addEventListener('scroll', scan, { passive: true });
    window.addEventListener('resize', scan);
    window.addEventListener('load', scan);
    setTimeout(scan, 500);

    if (hasIO) {   // highlight the nav link for the section in view
      const map = new Map($$('a[href*="#"]', links).map(a => [a.getAttribute('href').split('#')[1], a]));
      const spy = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        map.forEach(a => a.classList.remove('is-current'));
        const a = map.get(e.target.id); if (a && !a.classList.contains('btn')) a.classList.add('is-current');
      }), { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach(s => spy.observe(s));
    }
  }

  /* =====================================================
     Boot
  ===================================================== */
  buildStatic();
  readUrl();
  const saved = A.location.saved();
  if (saved && typeof saved.lat === 'number') { coords = saved; dist = A.location.distances(A.cafes, coords); state.sort = 'nearest'; }
  el.mapPane.hidden = state.view !== 'map';
  el.results.dataset.view = state.view;
  render();
  if (coords) applyCoords();
  setupObservers();
  onScroll();
  if (location.hash) {                       // content is built by script, so re-align the anchor
    const t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(() => t.scrollIntoView(), 80);
  }
})();
