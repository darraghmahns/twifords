import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../lib/rate-limit.js';

test('allows up to max hits per window then blocks with a retry hint', () => {
  const limiter = createRateLimiter({ max: 3, windowMs: 1000 });
  assert.equal(limiter.hit('ip', 0).allowed, true);
  assert.equal(limiter.hit('ip', 10).allowed, true);
  assert.equal(limiter.hit('ip', 20).remaining, 0);
  const blocked = limiter.hit('ip', 30);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 970);
});

test('windows expire and keys are independent', () => {
  const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
  assert.equal(limiter.hit('a', 0).allowed, true);
  assert.equal(limiter.hit('a', 500).allowed, false);
  assert.equal(limiter.hit('b', 500).allowed, true);
  assert.equal(limiter.hit('a', 1000).allowed, true);
});

test('clear and reset forget attempts', () => {
  const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
  limiter.hit('a', 0);
  limiter.clear('a');
  assert.equal(limiter.hit('a', 1).allowed, true);
  limiter.reset();
  assert.equal(limiter.hit('a', 2).allowed, true);
});
