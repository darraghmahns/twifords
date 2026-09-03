// Fixed-window in-memory rate limiter. Fluid Compute reuses instances, so this holds across requests on
// the same instance; it is a brake on password guessing, not a hard global guarantee.

export function createRateLimiter({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const buckets = new Map();

  function prune(now) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return {
    /** Records an attempt for `key` and says whether it is allowed. */
    hit(key, now = Date.now()) {
      if (buckets.size > 10000) prune(now);
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      const allowed = bucket.count <= max;
      return { allowed, remaining: Math.max(0, max - bucket.count), retryAfterMs: allowed ? 0 : bucket.resetAt - now };
    },
    clear(key) {
      buckets.delete(key);
    },
    reset() {
      buckets.clear();
    },
  };
}
