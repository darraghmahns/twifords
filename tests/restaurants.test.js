import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESTAURANTS, PRESENTED_TO } from '../public/scripts/restaurants.js';

const DC_BOUNDS = { latMin: 38.79, latMax: 39.0, lngMin: -77.12, lngMax: -76.9 };
const PROVIDERS = new Set(['toast', 'cashstar', 'giftrocker']);

test('there are exactly four tables', () => {
  assert.equal(RESTAURANTS.length, 4);
});

test('ids and numerals are unique', () => {
  const ids = RESTAURANTS.map((r) => r.id);
  const numerals = RESTAURANTS.map((r) => r.numeral);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(numerals).size, numerals.length);
  assert.deepEqual(numerals, ['I', 'II', 'III', 'IV']);
});

test('every entry has the fields the pages render', () => {
  for (const r of RESTAURANTS) {
    assert.match(r.id, /^[a-z0-9-]+$/, `${r.id} should be kebab-case`);
    for (const key of ['name', 'neighborhood', 'cuisine', 'tip']) {
      assert.equal(typeof r[key], 'string', `${r.id}.${key}`);
      assert.ok(r[key].trim().length > 0, `${r.id}.${key} is empty`);
    }
  }
});

test('websites are https URLs', () => {
  for (const r of RESTAURANTS) {
    const url = new URL(r.web);
    assert.equal(url.protocol, 'https:', `${r.id} web should be https`);
  }
});

test('coordinates sit inside the District', () => {
  for (const r of RESTAURANTS) {
    assert.ok(r.lat > DC_BOUNDS.latMin && r.lat < DC_BOUNDS.latMax, `${r.id} lat ${r.lat}`);
    assert.ok(r.lng > DC_BOUNDS.lngMin && r.lng < DC_BOUNDS.lngMax, `${r.id} lng ${r.lng}`);
  }
});

test('every table has well-formed gift card metadata', () => {
  for (const r of RESTAURANTS) {
    assert.ok(r.giftCard, `${r.id} has no giftCard`);
    assert.ok(PROVIDERS.has(r.giftCard.provider), `${r.id} provider ${r.giftCard.provider}`);
    assert.equal(typeof r.giftCard.label, 'string');
    assert.ok(Number.isFinite(r.giftCard.amount) && r.giftCard.amount > 0, `${r.id} amount`);
  }
});

test('the four real cards are attached to the right restaurants', () => {
  const byId = Object.fromEntries(RESTAURANTS.map((r) => [r.id, r.giftCard]));
  assert.deepEqual(RESTAURANTS.map((r) => r.id), ['daikaya', 'carusos-grocery', 'le-diplomate', 'perrys']);
  assert.equal(byId.daikaya.provider, 'toast');
  assert.equal(byId.perrys.provider, 'toast');
  assert.equal(byId['le-diplomate'].provider, 'cashstar');
  assert.equal(byId['carusos-grocery'].provider, 'giftrocker');
});

test('the multi-restaurant cards explain where else they work', () => {
  const byId = Object.fromEntries(RESTAURANTS.map((r) => [r.id, r.giftCard]));
  assert.match(byId['carusos-grocery'].note, /Neighborhood Restaurant Group/);
  assert.match(byId['le-diplomate'].note, /STARR/);
  for (const r of RESTAURANTS) {
    if (r.giftCard.note !== undefined) assert.equal(typeof r.giftCard.note, 'string');
  }
});

test('the voucher is presented to the couple', () => {
  assert.equal(PRESENTED_TO, 'Jack & Anne Twiford');
});
