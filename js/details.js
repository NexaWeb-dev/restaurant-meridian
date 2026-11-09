/* =========================================================
   Cafe details page (cafe-details.html?id=...)
   ========================================================= */
(function () {
  'use strict';
  const A = window.Atlas, U = A.utils, { $, $$, esc } = U;
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  U.installImageFallback();

  const root = $('#detail');
  const id = new URLSearchParams(location.search).get('id');
  const cafe = A.cafes.find(c => c.id === id);

  /* ---------- Shared page chrome ---------- */
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
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  $('#year').textContent = new Date().getFullYear();
  $('#footCities').innerHTML = A.cities.slice(0, 6).map(c => `<li><a href="index.html?city=${encodeURIComponent(c.name)}#discover">${esc(c.name)}</a></li>`).join('');
  $('#credits').innerHTML = A.cities.map(c => `<li>${esc(c.name)}: <a href="${esc(c.credit.url)}" target="_blank" rel="noopener">“${esc(c.credit.title)}”</a> by ${esc(c.credit.author)}, ${esc(c.credit.licence)}</li>`).join('');

  /* ---------- Not found ---------- */
  if (!cafe) {
    document.title = 'Café not found · Meridian Coffee Atlas';
    root.innerHTML = `
      <section class="sec nf"><div class="wrap">
        <p class="eyebrow">404</p><h1>We couldn’t find that café</h1>
        <p class="lead">The link may be out of date, or the café is not part of this sample dataset.</p>
        <a class="btn btn--dark" href="index.html#discover">Browse all cafés</a>
      </div></section>`;
    return;
  }

  document.title = `${cafe.name}, ${cafe.area}, ${cafe.city} · Meridian Coffee Atlas`;
  const meta = $('meta[name="description"]'); if (meta) meta.content = `${cafe.name} in ${cafe.area}, ${cafe.city}: address, opening hours, map and directions. Sample listing for a demonstration project.`;

  /* Visitor distance, only if they previously allowed location on this site */
  const me = A.location.saved();
  const fromMe = me && typeof me.lat === 'number' ? A.location.haversine(me.lat, me.lon, cafe.latitude, cafe.longitude) : null;

  const st = U.getStatus(cafe), now = U.nowIST(), todayKey = U.DAYS[now.day];
  const hoursRows = U.WEEK_ORDER.map(d => {
    const h = cafe.weeklyOpeningHours[d];
    return `<tr class="${d === todayKey ? 'today' : ''}${h ? '' : ' off'}"><th scope="row">${U.DAY_NAMES[d]}${d === todayKey ? ' <span class="tag">Today</span>' : ''}</th><td>${h ? `${U.fmtTime(h.open)} – ${U.fmtTime(h.close)}` : 'Closed'}</td></tr>`;
  }).join('');

  root.innerHTML = `
    <section class="dhero" aria-labelledby="d-title">
      <img src="${esc(cafe.image)}" width="1200" height="800" fetchpriority="high" decoding="async" alt="Interior of ${esc(cafe.name)}, a sample café in ${esc(cafe.area)}, ${esc(cafe.city)}">
      <div class="dhero__shade"></div>
      <div class="wrap dhero__in">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="index.html?city=${encodeURIComponent(cafe.city)}#discover">${esc(cafe.city)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(cafe.name)}</span></nav>
        <p class="eyebrow">${esc(cafe.area)} · ${esc(cafe.city)}</p>
        <h1 id="d-title">${esc(cafe.name)}</h1>
        <p class="dhero__status"><span class="badge ${st.open ? 'badge--open' : 'badge--closed'}">${st.label}</span> ${esc(st.detail)}</p>
      </div>
    </section>

    <section class="sec">
      <div class="wrap detail">
        <article class="detail__main">
          <p class="notice"><strong>Sample listing.</strong> ${esc(A.DATA_NOTICE)} Nothing on this page is verified.</p>
          <p class="lead">${esc(cafe.description)}</p>
          <h2 class="h3">What to expect</h2>
          <ul class="chips">${cafe.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>

          <h2 class="h3">Opening hours <small>(sample, India time)</small></h2>
          <table class="hours">
            <caption class="sr">Opening hours for ${esc(cafe.name)}</caption>
            <thead><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>
            <tbody>${hoursRows}</tbody>
          </table>

          <h2 class="h3">More photographs</h2>
          <div class="gallery3">
            ${cafe.galleryImages.map((g, i) => `<figure class="mask"><img src="${esc(g)}" width="1200" height="800" loading="lazy" decoding="async" alt="Sample photograph ${i + 1} of coffee and interiors for ${esc(cafe.name)}"></figure>`).join('')}
          </div>
        </article>

        <aside class="sidecard" aria-label="Visit details">
          <h2 class="h3">Visit</h2>
          <dl>
            <dt>Address</dt><dd>${esc(cafe.address)}</dd>
            <dt>Phone</dt><dd><a href="${U.telHref(cafe.phone)}">${esc(cafe.phone)}</a> <small>(sample number)</small></dd>
            <dt>Today</dt><dd>${U.hoursToday(cafe)} <span class="badge badge--inline ${st.open ? 'badge--open' : 'badge--closed'}">${st.label}</span></dd>
            ${fromMe !== null ? `<dt>From you</dt><dd>${U.fmtKm(fromMe)} <small>(straight line)</small></dd>` : ''}
          </dl>
          <div class="sidecard__actions">
            <a class="btn btn--dark btn--block" href="${U.telHref(cafe.phone)}">Call Now</a>
            <a class="btn btn--line btn--block" href="${U.directionsUrl(cafe)}" target="_blank" rel="noopener">Get Directions<span class="sr"> (opens Google Maps in a new tab)</span></a>
          </div>
        </aside>
      </div>
    </section>

    <section class="sec sec--ivory dmap" aria-labelledby="dmap-h">
      <div class="wrap">
        <div class="head"><p class="eyebrow">Location</p><h2 id="dmap-h">On the <em>map</em></h2></div>
        <div class="map map--detail" id="dMap" role="region" aria-label="Map showing ${esc(cafe.name)}"></div>
        <p class="note">${esc(cafe.address)}. Coordinates mark the locality centre, not a verified shop location.</p>
      </div>
    </section>`;

  /* ---------- Nearby cafés (straight-line distance from this cafe) ---------- */
  const others = A.cafes.filter(c => c.id !== cafe.id)
    .map(c => ({ c, km: A.location.haversine(cafe.latitude, cafe.longitude, c.latitude, c.longitude) }))
    .sort((a, b) => a.km - b.km).slice(0, 3);
  $('#nearbySec').hidden = false;
  $('#nearbyNote').textContent = `Distances are straight-line measurements from ${cafe.name}.`;
  $('#nearbyGrid').innerHTML = others.map((o, i) => U.cardHtml(o.c, { distanceKm: o.km, delay: i * 60 })).join('');

  /* ---------- Map (after layout so Leaflet measures the container correctly) ---------- */
  A.map.mini($('#dMap'), cafe, others.map(o => o.c));

  /* Reveal images */
  const masks = $$('.mask');
  const show = m => m.classList.add('is-in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.1 });
    masks.forEach(m => io.observe(m));
    setTimeout(() => masks.forEach(m => { const r = m.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(m); }), 400);
    window.addEventListener('scroll', () => masks.forEach(m => { const r = m.getBoundingClientRect(); if (r.top < innerHeight * 0.96 && r.bottom > 0) show(m); }), { passive: true });
  } else masks.forEach(show);
})();
