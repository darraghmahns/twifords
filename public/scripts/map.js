import { RESTAURANTS } from './restaurants.js';

const ORIGIN = window.location.origin;

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const HEART_PIN = '<svg viewBox="0 0 42 50" aria-hidden="true"><path d="M21 49C9 40 1 31 1 18.5 1 9 8 3 15 3c3.5 0 5.6 1.7 6 4 .4-2.3 2.5-4 6-4 7 0 14 6 14 15.5C41 31 33 40 21 49Z" fill="#b81d34" stroke="#fff" stroke-width="2"/></svg>';
const HEART_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.9-10-9.2C.2 8.6 1.6 5 5 5c2 0 3.2 1.1 4 2.3C9.8 6.1 11 5 13 5c3.4 0 4.8 3.6 3 6.8C19.5 16.1 12 21 12 21z"/></svg>';

function popupHtml(r, i) {
  return `<div>
    <div class="pop-num">No. ${escapeHtml(r.numeral)} · ${escapeHtml(r.neighborhood)}</div>
    <div class="pop-name">${escapeHtml(r.name)}</div>
    <div class="pop-meta">${escapeHtml(r.cuisine)}</div>
    <div class="pop-offer">${HEART_ICON}<b>${escapeHtml(r.tip)}</b></div>
    <div class="pop-actions">
      <a class="pop-btn primary" href="${escapeHtml(r.web)}" target="_blank" rel="noopener">Reserve</a>
      <button class="pop-btn ghost" data-card="${i}" type="button">Gift card</button>
    </div>
  </div>`;
}

function setActive(index) {
  document.querySelectorAll('.pin').forEach((pin) => pin.classList.toggle('active', Number(pin.dataset.i) === index));
}

function tellParent(message) {
  if (window.parent === window) return;
  window.parent.postMessage(message, ORIGIN);
}

function init() {
  if (typeof L === 'undefined') {
    console.error('Leaflet failed to load; the map cannot render.');
    return;
  }
  const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([38.906, -77.030], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const markers = RESTAURANTS.map((r, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="pin" data-i="${i}">${HEART_PIN}<span class="num">${escapeHtml(r.numeral)}</span></div>`,
      iconSize: [42, 50], iconAnchor: [21, 49], popupAnchor: [0, -46],
    });
    const marker = L.marker([r.lat, r.lng], { icon, title: r.name }).addTo(map);
    marker.bindPopup(popupHtml(r, i), { closeButton: true, maxWidth: 260, minWidth: 220 });
    return marker;
  });

  map.fitBounds(L.latLngBounds(RESTAURANTS.map((r) => [r.lat, r.lng])), { padding: [48, 48] });

  map.on('popupopen', (e) => {
    const index = markers.indexOf(e.popup._source);
    if (index === -1) return;
    setActive(index);
    tellParent({ type: 'select', index });
    const btn = e.popup.getElement().querySelector('[data-card]');
    if (btn) btn.addEventListener('click', () => tellParent({ type: 'gotocard', index: Number(btn.dataset.card) }));
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data || {};
    if (data.type !== 'focus' || !Number.isInteger(data.index)) return;
    const r = RESTAURANTS[data.index];
    if (!r) return;
    map.flyTo([r.lat, r.lng], 14, { duration: 0.6 });
    markers[data.index].openPopup();
    setActive(data.index);
  });

  map.whenReady(() => tellParent({ type: 'ready' }));
}

// Leaflet is a deferred classic script; module scripts run after it, but guard for DOM readiness anyway.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
