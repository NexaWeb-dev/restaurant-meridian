/* =========================================================
   Interactive map (Leaflet + OpenStreetMap tiles).
   Leaflet is stored locally in assets/vendor/leaflet. Tiles load from
   tile.openstreetmap.org and need an internet connection.
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});
  const U = () => A.utils;

  /* Coffee-cup pin: espresso teardrop with an ivory cup */
  const PIN_SVG = `<svg viewBox="0 0 36 46" width="36" height="46" aria-hidden="true" focusable="false">
    <path class="pin__body" d="M18 45C18 45 3 29.5 3 17.5a15 15 0 0 1 30 0C33 29.5 18 45 18 45z" fill="#211A17" stroke="#F6F1E9" stroke-width="2"/>
    <g fill="none" stroke="#F6F1E9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11.5 14.5h10v5.2a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/><path d="M21.5 15.8h1.6a2 2 0 0 1 0 4h-1.6"/><path d="M14.5 10.5c0 1 1 1 1 2M17.5 10.5c0 1 1 1 1 2" stroke-width="1.4"/>
    </g></svg>`;
  const makeIcon = () => L.divIcon({ className: 'pin', html: PIN_SVG, iconSize: [36, 46], iconAnchor: [18, 44], popupAnchor: [0, -38] });

  let map = null, group = null, onSelect = null, userLayer = null;
  const markers = new Map();

  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  function popupNode(c) {
    const u = U(), st = u.getStatus(c), el = document.createElement('div');
    el.className = 'popup';
    el.innerHTML = `
      <p class="popup__meta">${u.esc(c.area)} · ${u.esc(c.city)}</p>
      <h3 class="popup__title">${u.esc(c.name)}</h3>
      <p class="popup__addr">${u.esc(c.address)}</p>
      <p class="popup__status ${st.open ? 'is-open' : ''}">${st.label}${st.detail ? ' · ' + u.esc(st.detail) : ''}</p>
      <div class="popup__actions">
        <a class="popup__btn" href="${u.directionsUrl(c)}" target="_blank" rel="noopener">Get Directions</a>
        <a class="popup__link" href="${u.detailsUrl(c)}">View Details</a>
      </div>`;
    return el;
  }

  function init(container, opts = {}) {
    if (map) return map;
    if (typeof L === 'undefined') { container.innerHTML = '<p class="map__fail">The map library could not be loaded.</p>'; return null; }
    onSelect = opts.onSelect || null;
    map = L.map(container, { scrollWheelZoom: false, zoomControl: true, worldCopyJump: false }).setView([22.6, 79], 5);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
    group = L.layerGroup().addTo(map);
    // Wheel-zoom only after the map has been clicked, so the page can still scroll past it
    map.on('click focus', () => map.scrollWheelZoom.enable());
    container.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
    return map;
  }

  /* Replace all markers and zoom to fit them */
  function setCafes(cafes) {
    if (!map) return;
    group.clearLayers(); markers.clear();
    const pts = [];
    cafes.forEach(c => {
      const m = L.marker([c.latitude, c.longitude], { icon: makeIcon(), title: c.name, keyboard: true, riseOnHover: true });
      m.bindPopup(() => popupNode(c), { maxWidth: 280, minWidth: 220, autoPanPadding: [30, 30] });
      m.on('click', () => onSelect && onSelect(c.id));
      m.addTo(group);
      markers.set(c.id, m);
      pts.push([c.latitude, c.longitude]);
    });
    fit(pts);
  }

  function fit(pts) {
    if (!map || !pts || !pts.length) return;
    if (pts.length === 1) map.setView(pts[0], 15);
    else map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 15 });
  }

  /* Pan to a cafe and open its popup */
  function focus(id) {
    const m = markers.get(id);
    if (!m || !map) return;
    map.setView(m.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    m.openPopup();
  }

  /* The visitor's own position (olive dot). Pass null to remove it. */
  function setUser(coords) {
    if (!map) return;
    if (userLayer) { map.removeLayer(userLayer); userLayer = null; }
    if (!coords) return;
    userLayer = L.layerGroup([
      L.circle([coords.lat, coords.lon], { radius: Math.min(coords.accuracy || 200, 3000), color: '#777D61', weight: 1, fillColor: '#777D61', fillOpacity: 0.12 }),
      L.circleMarker([coords.lat, coords.lon], { radius: 7, color: '#F6F1E9', weight: 2, fillColor: '#777D61', fillOpacity: 1 }).bindTooltip('You are here')
    ]).addTo(map);
  }

  const invalidate = () => { if (map) setTimeout(() => map.invalidateSize(), 60); };

  /* Small single-cafe map for the details page */
  function mini(container, cafe, others = []) {
    if (typeof L === 'undefined') { container.innerHTML = '<p class="map__fail">The map library could not be loaded.</p>'; return null; }
    const m = L.map(container, { scrollWheelZoom: false }).setView([cafe.latitude, cafe.longitude], 15);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
    others.forEach(o => L.marker([o.latitude, o.longitude], { icon: makeIcon(), opacity: 0.55, title: o.name }).bindPopup(() => popupNode(o), { maxWidth: 280 }).addTo(m));
    L.marker([cafe.latitude, cafe.longitude], { icon: makeIcon(), title: cafe.name, zIndexOffset: 1000 }).bindPopup(() => popupNode(cafe), { maxWidth: 280 }).addTo(m).openPopup();
    m.on('click focus', () => m.scrollWheelZoom.enable());
    container.addEventListener('mouseleave', () => m.scrollWheelZoom.disable());
    return m;
  }

  A.map = { init, setCafes, focus, setUser, invalidate, mini, isReady: () => !!map };
})();
