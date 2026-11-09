/* =========================================================
   State -> City -> Area dependent filters, open-now filter and sorting.
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});

  const uniq = list => Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  const states = cafes => uniq(cafes.map(c => c.state));
  const cities = (cafes, state) => uniq(cafes.filter(c => !state || c.state === state).map(c => c.city));
  const areas = (cafes, state, city) => uniq(cafes.filter(c => (!state || c.state === state) && (!city || c.city === city)).map(c => c.area));

  /* Rebuild one <select>; keep the current value only if it is still valid */
  function fill(select, values, placeholder, current) {
    const keep = values.includes(current) ? current : '';
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${A.utils.esc(v)}">${A.utils.esc(v)}</option>`).join('');
    select.value = keep;
    return keep;
  }

  /* Refill all three dropdowns from the current selections. Mutates `sel` to drop invalid choices. */
  function syncDropdowns(cafes, sel, els) {
    sel.state = fill(els.state, states(cafes), 'All states', sel.state);
    sel.city = fill(els.city, cities(cafes, sel.state), 'All cities', sel.city);
    sel.area = fill(els.area, areas(cafes, sel.state, sel.city), 'All areas', sel.area);
  }

  function apply(cafes, f) {
    const now = A.utils.nowIST();
    return cafes.filter(c =>
      (!f.state || c.state === f.state) &&
      (!f.city || c.city === f.city) &&
      (!f.area || c.area === f.area) &&
      (!f.openNow || A.utils.getStatus(c, now).open));
  }

  /* sort: 'nearest' (needs a distance map), 'az', 'za' */
  function sort(cafes, mode, dist) {
    const list = cafes.slice();
    if (mode === 'nearest' && dist) list.sort((a, b) => dist.get(a.id) - dist.get(b.id) || a.name.localeCompare(b.name));
    else if (mode === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  A.filters = { states, cities, areas, syncDropdowns, apply, sort };
})();
