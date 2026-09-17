import { RESTAURANTS } from './restaurants.js';
import { buildVoucherView } from './voucher-model.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const voucher = document.querySelector('[data-card-id]');
const details = document.getElementById('card-details');
const restaurant = RESTAURANTS.find((r) => r.id === voucher?.dataset.cardId);

function renderCard(card) {
  if (card.status === 'loading') {
    details.innerHTML = '<p role="status">Loading your gift card…</p>';
    return;
  }
  if (card.status === 'error' || card.status === 'missing') {
    details.innerHTML = `<p class="gift-error" role="alert">${card.status === 'missing' ? 'This card’s details haven’t been added yet. Check with Rae Rae or Darragh.' : 'Your gift card couldn’t load. Check your connection and try again.'}</p><button class="btn btn-secondary" type="button" id="retry-cards">Try again</button>`;
    document.getElementById('retry-cards').addEventListener('click', loadGiftCard);
    return;
  }
  details.innerHTML = `${card.fields.length ? `<div class="gift-fields">${card.fields.map((field, i) => `<div class="gift-field"><div><span class="gift-field-label">${escapeHtml(field.label)}</span><span class="gift-field-value">${escapeHtml(field.value)}</span></div><button type="button" class="copy-button" data-copy="${i}" aria-label="Copy ${escapeHtml(field.label.toLowerCase())}">Copy</button></div>`).join('')}</div>` : ''}
    <div class="gift-links">${card.links.map((link) => `<a class="btn ${link.primary ? 'btn-primary' : 'btn-secondary'}" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join('')}</div>
    <p class="gift-hint">${escapeHtml(card.howTo)}</p><p class="copy-status" id="copy-status" role="status"></p>`;
  details.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const field = card.fields[Number(button.dataset.copy)];
      try {
        await navigator.clipboard.writeText(String(field.value));
        document.getElementById('copy-status').textContent = `${field.label} copied.`;
      } catch {
        document.getElementById('copy-status').textContent = 'Copy isn’t available here. Select the details above to copy them.';
      }
    });
  });
}

async function loadGiftCard() {
  renderCard({ status: 'loading' });
  try {
    const response = await fetch('/api/gift-cards', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (response.status === 401) {
      window.location.replace('/login?next=' + encodeURIComponent(window.location.pathname + window.location.hash));
      return;
    }
    if (!response.ok) throw new Error('Gift card request failed');
    const byId = await response.json();
    if (!byId || typeof byId !== 'object' || Array.isArray(byId)) throw new Error('Invalid gift card response');
    renderCard(buildVoucherView(restaurant, { status: 'ready', byId }).card);
  } catch {
    renderCard({ status: 'error' });
  }
}
if (restaurant && details) {
  loadGiftCard();
  // Restore fresh private details when returning through the browser's back/forward cache.
  window.addEventListener('pageshow', (event) => { if (event.persisted) loadGiftCard(); });
}

const mapFrame = document.getElementById('dcmap');
if (mapFrame) {
  document.querySelectorAll('[data-focus]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const index = Number(button.dataset.focus);
      mapFrame.contentWindow?.postMessage({ type: 'focus', index }, window.location.origin);
      mapFrame.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    });
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== mapFrame.contentWindow) return;
    const { type, index } = event.data || {};
    if (type !== 'select' || !Number.isInteger(index) || !RESTAURANTS[index]) return;
    document.querySelectorAll('[data-restaurant-index]').forEach((entry) => {
      if (Number(entry.dataset.restaurantIndex) === index) entry.setAttribute('aria-current', 'true');
      else entry.removeAttribute('aria-current');
    });
  });
}
