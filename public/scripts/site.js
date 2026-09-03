import { RESTAURANTS, PRESENTED_TO } from './restaurants.js';
import { buildVoucherView } from './voucher-model.js';

const state = {
  selected: 0,
  cards: { status: 'loading', byId: null },
};

const pinsEl = document.getElementById('pins');
const voucherEl = document.getElementById('voucher');
const mapFrame = document.getElementById('dcmap');
const logoutEl = document.getElementById('logout');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const heart = '<svg class="icon-heart" aria-hidden="true"><use href="#icon-heart"/></svg>';

function select(index, { focusMap } = { focusMap: false }) {
  if (!Number.isInteger(index) || index < 0 || index >= RESTAURANTS.length) return;
  state.selected = index;
  render();
  if (focusMap && mapFrame && mapFrame.contentWindow) {
    mapFrame.contentWindow.postMessage({ type: 'focus', index }, window.location.origin);
  }
}

function renderPins() {
  pinsEl.replaceChildren(...RESTAURANTS.map((r, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pin-chip';
    btn.setAttribute('aria-pressed', String(i === state.selected));
    btn.innerHTML = `<span class="pin-chip-num">${escapeHtml(r.numeral)}</span>${escapeHtml(r.neighborhood)}`;
    btn.addEventListener('click', () => select(i, { focusMap: true }));
    return btn;
  }));
}

function renderCard(card) {
  const head = `<div class="gift-row"><span class="gift-title">${escapeHtml(card.label)}</span><span class="gift-amount">${escapeHtml(card.amount)}</span></div>`;

  if (card.status === 'loading') {
    return `<div class="gift">${head}<p class="gift-hint">Fetching your gift card…</p></div>`;
  }
  if (card.status === 'error' || card.status === 'missing') {
    const message = card.status === 'error'
      ? 'We could not load the gift card details right now.'
      : 'This card’s details have not been added yet. Ask Rae Rae &amp; Darragh.';
    return `<div class="gift">${head}<p class="gift-error" role="alert">${message}</p>
      ${card.status === 'error' ? '<div class="gift-links"><button type="button" class="btn btn-secondary" id="retry-cards">Try again</button></div>' : ''}
    </div>`;
  }

  const fields = card.fields.length
    ? `<div class="gift-fields">${card.fields.map((f) => `<div class="gift-field"><span class="gift-field-label">${escapeHtml(f.label)}</span><span class="gift-field-value">${escapeHtml(f.value)}</span></div>`).join('')}</div>`
    : '';
  const links = card.links.length
    ? `<div class="gift-links">${card.links.map((l) => `<a class="btn ${l.primary ? 'btn-primary' : 'btn-secondary'}" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`).join('')}</div>`
    : '';
  const note = card.note ? `<p class="gift-note">${escapeHtml(card.note)}</p>` : '';
  return `<div class="gift">${head}${fields}${links}<p class="gift-hint">${escapeHtml(card.howTo)}</p>${note}</div>`;
}

function renderVoucher() {
  const view = buildVoucherView(RESTAURANTS[state.selected], state.cards);
  voucherEl.innerHTML = `
    <div class="voucher-head">
      <div class="voucher-head-row">
        <span class="voucher-label">The Twiford Book · Gift Card</span>
        <span class="voucher-no">No. ${escapeHtml(view.numeral)}</span>
      </div>
      <h3 class="voucher-name">${escapeHtml(view.name)}</h3>
      <div class="voucher-meta"><span>${escapeHtml(view.neighborhood)}</span><span>·</span><span>${escapeHtml(view.cuisine)}</span></div>
    </div>
    <div class="voucher-body">
      <div class="voucher-pick">
        <span class="voucher-pick-icon">${heart}</span>
        <div>
          <span class="voucher-pick-label">Rae &amp; Darragh’s pick</span>
          <p class="voucher-pick-text">${escapeHtml(view.tip)}</p>
        </div>
      </div>
      ${renderCard(view.card)}
      <p class="voucher-fine">${escapeHtml(view.fine)}</p>
      <div class="voucher-presented">
        <div class="voucher-to">
          <span class="voucher-to-label">Presented to</span>
          <span class="voucher-to-name">${escapeHtml(PRESENTED_TO)}</span>
        </div>
        <div class="voucher-stamp" aria-hidden="true">STAMP<br>HERE</div>
      </div>
      <div class="voucher-actions">
        <a href="${escapeHtml(view.webHref)}" target="_blank" rel="noopener" class="btn btn-primary">Visit &amp; reserve</a>
        <button type="button" class="btn btn-secondary" id="print-voucher">Save / print gift card</button>
      </div>
    </div>`;

  document.getElementById('print-voucher').addEventListener('click', () => window.print());
  const retry = document.getElementById('retry-cards');
  if (retry) retry.addEventListener('click', loadGiftCards);
}

function render() {
  renderPins();
  renderVoucher();
}

async function loadGiftCards() {
  state.cards = { status: 'loading', byId: null };
  render();
  try {
    const response = await fetch('/api/gift-cards', { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (response.status === 401) {
      window.location.replace('/login?next=' + encodeURIComponent(window.location.pathname + window.location.hash));
      return;
    }
    if (!response.ok) throw new Error(`gift-cards responded ${response.status}`);
    const byId = await response.json();
    if (!byId || typeof byId !== 'object' || Array.isArray(byId)) throw new Error('gift-cards returned an unexpected shape');
    state.cards = { status: 'ready', byId };
  } catch (err) {
    console.error(err);
    state.cards = { status: 'error', byId: null };
  }
  render();
}

async function logout(event) {
  event.preventDefault();
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (err) {
    console.error(err);
  }
  window.location.replace('/login');
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data || {};
  if ((data.type === 'select' || data.type === 'gotocard') && Number.isInteger(data.index)) {
    select(data.index);
    if (data.type === 'gotocard') voucherEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

if (logoutEl) logoutEl.addEventListener('click', logout);
render();
loadGiftCards();
