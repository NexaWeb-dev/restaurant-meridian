/* =========================================================
   Free-text search across cafe name, area, city, state and address.
   Every word the visitor types must match somewhere (so "noida sector 18" works).
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});
  const cache = new WeakMap();

  const normalise = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const haystack = c => {
    if (!cache.has(c)) cache.set(c, normalise([c.name, c.area, c.city, c.state, c.address].join(' ')));
    return cache.get(c);
  };

  function query(cafes, q) {
    const tokens = normalise(q || '').split(' ').filter(Boolean);
    if (!tokens.length) return cafes;
    return cafes.filter(c => { const h = haystack(c); return tokens.every(t => h.includes(t)); });
  }

  /* Values offered by the search box's suggestion list */
  function suggestions(cafes) {
    const set = new Set();
    cafes.forEach(c => { set.add(c.city); set.add(c.state); set.add(c.area); set.add(c.name); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  A.search = { normalise, query, suggestions };
})();
