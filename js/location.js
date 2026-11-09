/* =========================================================
   Current-location detection and distances.
   - Uses the browser Geolocation API (always behind a user click + permission prompt).
   - Distances are straight-line (Haversine) between the visitor and each cafe's
     coordinates. Nothing is estimated or invented.
   ========================================================= */
(function () {
  'use strict';
  const A = (window.Atlas = window.Atlas || {});
  const STORE_KEY = 'atlas.coords';

  /* ---------- Reverse geocoding: INTEGRATION POINT ----------
     Turning coordinates into a place name needs an external geocoding service, so it is
     OFF by default and nothing is sent anywhere. To enable it, set `enabled: true` and
     configure `buildUrl` and `parse` for your provider (Google Geocoding, Mapbox, OpenCage,
     or a self-hosted Nominatim). Mind each provider's terms, API keys and rate limits.
     Example (OpenStreetMap Nominatim, low volume only):
       enabled: true,
       buildUrl: (lat, lon) => `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
       parse: json => json.address && (json.address.suburb || json.address.city || json.address.town)
  */
  const REVERSE_GEOCODER = {
    enabled: false,
    buildUrl: (lat, lon) => '',
    parse: json => null
  };

  /* Great-circle distance in kilometres */
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371.0088, rad = d => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /* Ask the browser for the visitor's position. Resolves { lat, lon, accuracy } or rejects { code, message } */
  function request() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject({ code: 'unsupported', message: 'Your browser does not support location detection.' });
      if (window.isSecureContext === false) return reject({ code: 'insecure', message: 'Location detection needs a secure (https) page or localhost.' });
      navigator.geolocation.getCurrentPosition(
        pos => {
          const c = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
          try { sessionStorage.setItem(STORE_KEY, JSON.stringify(c)); } catch (e) { /* storage may be blocked */ }
          resolve(c);
        },
        err => {
          const map = {
            1: { code: 'denied', message: 'Location permission was denied. You can allow it in your browser settings, or search by city or area instead.' },
            2: { code: 'unavailable', message: 'Your location could not be determined right now. Try again, or search by city or area.' },
            3: { code: 'timeout', message: 'Finding your location took too long. Try again, or search by city or area.' }
          };
          reject(map[err.code] || { code: 'error', message: 'Something went wrong while finding your location.' });
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    });
  }

  const saved = () => { try { return JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { return null; } };
  const clear = () => { try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } };

  /* Map of cafe id -> kilometres from the given coordinates */
  function distances(cafes, coords) {
    const m = new Map();
    cafes.forEach(c => m.set(c.id, haversine(coords.lat, coords.lon, c.latitude, c.longitude)));
    return m;
  }

  /* Optional place name for the visitor (null while the integration is disabled or on any failure) */
  async function reverseGeocode(lat, lon) {
    if (!REVERSE_GEOCODER.enabled) return null;
    try {
      const res = await fetch(REVERSE_GEOCODER.buildUrl(lat, lon));
      if (!res.ok) return null;
      return REVERSE_GEOCODER.parse(await res.json()) || null;
    } catch (e) { return null; }
  }

  A.location = { haversine, request, saved, clear, distances, reverseGeocode, REVERSE_GEOCODER };
})();
