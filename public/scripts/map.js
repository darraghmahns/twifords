import { RESTAURANTS } from './restaurants.js';
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init() {
  const status = document.getElementById('map-status');
  if (typeof L === 'undefined') {
    status.textContent = 'The map couldn’t load. Open the restaurant list for directions.';
    return;
  }
  const map = L.map('map', { zoomControl: true, scrollWheelZoom: false });
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors', maxZoom: 19,
  }).addTo(map);
  tiles.on('tileerror', () => { status.textContent = 'Map tiles couldn’t load. Restaurant pins and the restaurant list are still available.'; status.hidden = false; });
  tiles.on('tileload', () => { status.hidden = true; });
  const markers = RESTAURANTS.map((r, i) => {
    const marker = L.marker([r.lat, r.lng], {
      icon: L.divIcon({ className: 'restaurant-marker', html: `<span>${i + 1}</span>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] }),
      title: r.name, alt: r.name,
    }).addTo(map);
    marker.bindPopup(`<div class="pop-meta">${escapeHtml(r.neighborhood)}</div><h2 class="pop-name">${escapeHtml(r.name)}</h2><p class="pop-cuisine">${escapeHtml(r.cuisine)}</p><a class="pop-link" href="/restaurants/${r.id}" target="_top">Restaurant &amp; gift card</a>`, { minWidth: 190, maxWidth: 250 });
    marker.on('popupopen', () => {
      markers.forEach((pin) => pin.getElement()?.classList.remove('active'));
      marker.getElement()?.classList.add('active');
      if (window.parent !== window) window.parent.postMessage({ type: 'select', index: i }, window.location.origin);
    });
    return marker;
  });
  const bounds = L.latLngBounds(RESTAURANTS.map((r) => [r.lat, r.lng]));
  const fit = () => map.fitBounds(bounds, { padding: [42, 42], animate: false });
  fit();
  document.getElementById('reset-map').hidden = false;
  document.getElementById('reset-map').addEventListener('click', () => { map.closePopup(); markers.forEach((pin) => pin.getElement()?.classList.remove('active')); fit(); });
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const { type, index } = event.data || {};
    if (type !== 'focus' || !Number.isInteger(index) || !RESTAURANTS[index]) return;
    const r = RESTAURANTS[index];
    map.setView([r.lat, r.lng], 14, { animate: !reducedMotion });
    markers[index].openPopup();
  });
  status.hidden = true;
}
init();
