/* =========================================================
   Shared helpers: DOM, formatting, opening status (India time),
   Google Maps / tel links, image fallback and the cafe card template.
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});

  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];            // Date.getDay() order
  const DAY_NAMES = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
  const WEEK_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmtTime = t => {
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
  };

  /* Current day and minutes in India Standard Time, whatever the visitor's own time zone */
  function nowIST() {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = t => p.find(x => x.type === t).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), min: (+get('hour') % 24) * 60 + (+get('minute')) };
  }

  /* Open / closed from the SAMPLE weekly schedule. Returns { open, label, detail, today } */
  function getStatus(cafe, now = nowIST()) {
    const today = cafe.weeklyOpeningHours[DAYS[now.day]];
    if (today && now.min >= toMin(today.open) && now.min < toMin(today.close)) {
      return { open: true, label: 'Open now', detail: `Closes ${fmtTime(today.close)}`, today };
    }
    if (today && now.min < toMin(today.open)) {
      return { open: false, label: 'Closed', detail: `Opens today ${fmtTime(today.open)}`, today };
    }
    for (let i = 1; i <= 7; i++) {
      const d = DAYS[(now.day + i) % 7], h = cafe.weeklyOpeningHours[d];
      if (h) return { open: false, label: 'Closed', detail: `Opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d]} ${fmtTime(h.open)}`, today };
    }
    return { open: false, label: 'Closed', detail: '', today };
  }

  const hoursToday = (cafe, now = nowIST()) => {
    const h = cafe.weeklyOpeningHours[DAYS[now.day]];
    return h ? `${fmtTime(h.open)} – ${fmtTime(h.close)}` : 'Closed today';
  };

  const directionsUrl = c => `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`;
  const telHref = phone => 'tel:' + phone.replace(/[^\d+]/g, '');
  const detailsUrl = c => `cafe-details.html?id=${encodeURIComponent(c.id)}`;
  const fmtKm = km => (km < 100 ? km.toFixed(1) : Math.round(km).toLocaleString('en-IN')) + ' km';

  /* If an image fails, swap in one local fallback once; if that fails too, hide it */
  function installImageFallback() {
    document.addEventListener('error', e => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fbDone) return;
      img.dataset.fbDone = '1';
      if (A.FALLBACK_IMAGE && !img.src.endsWith(A.FALLBACK_IMAGE)) img.src = A.FALLBACK_IMAGE;
      else img.style.visibility = 'hidden';
    }, true);
  }

  /* One template for every cafe card. opts: { distanceKm, compact, delay } */
  function cardHtml(c, opts = {}) {
    const st = getStatus(c);
    const dist = typeof opts.distanceKm === 'number'
      ? `<li class="facts__dist"><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg><span>${fmtKm(opts.distanceKm)} away <small>(straight line)</small></span></li>` : '';
    return `
    <article class="card${opts.compact ? ' card--compact' : ''}" data-id="${esc(c.id)}" style="--d:${opts.delay || 0}ms">
      <a class="card__media" href="${detailsUrl(c)}" tabindex="-1" aria-hidden="true">
        <img src="${esc(c.image)}" width="1200" height="800" alt="" loading="lazy" decoding="async">
        <span class="badge ${st.open ? 'badge--open' : 'badge--closed'}">${st.label}</span>
      </a>
      <div class="card__body">
        <p class="card__meta">${esc(c.area)} · ${esc(c.city)}</p>
        <h3 class="card__title"><a href="${detailsUrl(c)}">${esc(c.name)}</a></h3>
        <p class="card__addr">${esc(c.address)}</p>
        <ul class="facts">
          ${dist}
          <li><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>${hoursToday(c)}${st.detail ? ` <small>· ${st.detail}</small>` : ''}</span></li>
          <li><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><span>${esc(c.phone)} <small>(sample)</small></span></li>
        </ul>
        <div class="card__actions">
          <a class="btn btn--dark btn--sm" href="${telHref(c.phone)}">Call Now</a>
          <a class="btn btn--line btn--sm" href="${detailsUrl(c)}">View Details</a>
          <a class="btn btn--text btn--sm" href="${directionsUrl(c)}" target="_blank" rel="noopener">Get Directions<span class="sr"> (opens Google Maps in a new tab)</span></a>
        </div>
      </div>
    </article>`;
  }

  A.utils = { DAYS, DAY_NAMES, WEEK_ORDER, $, $$, esc, debounce, toMin, fmtTime, nowIST, getStatus, hoursToday, directionsUrl, telHref, detailsUrl, fmtKm, installImageFallback, cardHtml };
})();
