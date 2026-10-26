const buckets = new Map();

function current(now) {
  return typeof now === "number" ? now : Date.now();
}

function prune(key, windowMs, now) {
  const fresh = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  if (fresh.length) buckets.set(key, fresh);
  else buckets.delete(key);
  return fresh;
}

export function resetLimits() {
  buckets.clear();
}

export function limitStatus(key, { limit, windowMs, now } = {}) {
  const at = current(now);
  const fresh = prune(key, windowMs, at);
  if (fresh.length < limit) return { limited: false, remaining: limit - fresh.length };
  const retryAfter = Math.max(1, Math.ceil((fresh[0] + windowMs - at) / 1000));
  return { limited: true, retryAfter, remaining: 0 };
}

export function recordLimit(key, { windowMs, now } = {}) {
  const at = current(now);
  const fresh = prune(key, windowMs, at);
  fresh.push(at);
  buckets.set(key, fresh);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value);
  return fresh.length;
}

export function clearLimit(key) {
  buckets.delete(key);
}
