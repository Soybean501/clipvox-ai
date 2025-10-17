const buckets = new Map<string, { count: number; expires: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.expires < now) {
    buckets.set(key, { count: 1, expires: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: bucket.expires - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}
