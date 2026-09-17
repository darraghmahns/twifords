import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVoucherView } from '../public/scripts/voucher-model.js';

const toastRestaurant = {
  id: 'daikaya', numeral: 'I', name: 'Daikaya', neighborhood: 'Penn Quarter', cuisine: 'Ramen',
  web: 'https://daikaya.com', tip: 'Spicy miso.', giftCard: { provider: 'toast', label: 'Daikaya eGift card', amount: 30 },
};
const cashstarRestaurant = { ...toastRestaurant, id: 'le-diplomate', giftCard: { provider: 'cashstar', label: 'STARR eGift card', amount: 30 } };
const giftrockerRestaurant = { ...toastRestaurant, id: 'carusos-grocery', giftCard: { provider: 'giftrocker', label: 'NRG gift card', amount: 30 } };
const cardlessRestaurant = { ...toastRestaurant, id: 'yellow', giftCard: null };

const loading = { status: 'loading', byId: null };
const failed = { status: 'error', byId: null };
const ready = (byId) => ({ status: 'ready', byId });

test('throws on bad input', () => {
  assert.throws(() => buildVoucherView(undefined, loading), TypeError);
  assert.throws(() => buildVoucherView(toastRestaurant, null), TypeError);
  assert.throws(() => buildVoucherView(toastRestaurant, { status: 'nope' }), TypeError);
});

test('copies the restaurant basics onto the view', () => {
  const view = buildVoucherView(toastRestaurant, loading);
  assert.equal(view.numeral, 'I');
  assert.equal(view.name, 'Daikaya');
  assert.equal(view.webHref, 'https://daikaya.com');
  assert.match(view.fine, /provider’s terms/i);
  assert.doesNotMatch(view.fine, /one redemption/i);
});

test('a restaurant without gift card metadata is a programming error', () => {
  assert.throws(() => buildVoucherView(cardlessRestaurant, loading), /no giftCard/);
});

test('loading and error states carry the public card metadata', () => {
  const l = buildVoucherView(toastRestaurant, loading).card;
  assert.equal(l.status, 'loading');
  assert.equal(l.amount, '$30');
  assert.equal(l.label, 'Daikaya eGift card');
  assert.ok(!('fields' in l));
  assert.equal(buildVoucherView(toastRestaurant, failed).card.status, 'error');
});

test('a card whose secrets are absent from the payload is "missing"', () => {
  assert.equal(buildVoucherView(toastRestaurant, ready({})).card.status, 'missing');
  assert.equal(buildVoucherView(toastRestaurant, ready({ perrys: { kind: 'toast', code: 'x', pin: 'y' } })).card.status, 'missing');
});

test('toast cards expose code, pin, wallet and balance links', () => {
  const byId = {
    daikaya: {
      kind: 'toast', code: '1111 2222 3333 4444', pin: '5322',
      appleWallet: 'https://a.example/wallet', googleWallet: 'https://g.example/wallet', balance: 'https://b.example/card',
    },
  };
  const { card } = buildVoucherView(toastRestaurant, ready(byId));
  assert.equal(card.status, 'ready');
  assert.deepEqual(card.fields, [
    { label: 'Gift card code', value: '1111 2222 3333 4444' },
    { label: 'PIN', value: '5322' },
  ]);
  assert.deepEqual(card.links.map((l) => [l.label, l.primary]), [
    ['Add to Apple Wallet', true],
    ['Add to Google Wallet', false],
    ['Check balance', false],
  ]);
});

test('cashstar cards have no fields and a primary open link', () => {
  const { card } = buildVoucherView(cashstarRestaurant, ready({ 'le-diplomate': { kind: 'cashstar', view: 'https://v.example/card' } }));
  assert.deepEqual(card.fields, []);
  assert.deepEqual(card.links, [{ label: 'Open eGift card', href: 'https://v.example/card', primary: true }]);
});

test('giftrocker cards show the reference and wallet pass', () => {
  const { card } = buildVoucherView(giftrockerRestaurant, ready({ 'carusos-grocery': { kind: 'giftrocker', reference: '000000000000', appleWallet: 'https://w.example/pass' } }));
  assert.deepEqual(card.fields, [{ label: 'Reference', value: '000000000000' }]);
  assert.deepEqual(card.links, [{ label: 'Add to Apple Wallet', href: 'https://w.example/pass', primary: true }]);
});

test('a card note from the metadata is passed through, and is empty when absent', () => {
  const noted = { ...cashstarRestaurant, giftCard: { ...cashstarRestaurant.giftCard, note: 'Good at any STARR restaurant.' } };
  assert.equal(buildVoucherView(noted, loading).card.note, 'Good at any STARR restaurant.');
  assert.equal(buildVoucherView(noted, ready({ 'le-diplomate': { kind: 'cashstar', view: 'https://v.example/card' } })).card.note, 'Good at any STARR restaurant.');
  assert.equal(buildVoucherView(toastRestaurant, loading).card.note, '');
});

test('an entry of the wrong kind is an error, not a silent mismatch', () => {
  assert.throws(() => buildVoucherView(toastRestaurant, ready({ daikaya: { kind: 'cashstar', view: 'https://x.example' } })), /kind "cashstar"/);
});
