export type RateLimitKind = "read" | "write";
export type RateLimitConfig = Record<RateLimitKind, { perMinute: number }>;

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  read: { perMinute: 60 },
  write: { perMinute: 10 },
};

export type RateLimiterInput = { limits?: RateLimitConfig; now?: () => number };
export type TakeInput = { ip: string; kind: RateLimitKind };
export type TakeResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };
export type RateLimiter = { take: (input: TakeInput) => TakeResult };

type Bucket = { tokens: number; updatedAt: number };

const MAX_BUCKETS = 10_000;

/** In-memory token bucket per IP and kind: refills continuously, bursts up to the per-minute budget. */
export function createRateLimiter({
  limits = DEFAULT_RATE_LIMITS,
  now = Date.now,
}: RateLimiterInput = {}): RateLimiter {
  const buckets = new Map<string, Bucket>();

  function prune({ time }: { time: number }): void {
    if (buckets.size < MAX_BUCKETS) return;
    for (const [key, bucket] of buckets) {
      if (time - bucket.updatedAt > 120_000) buckets.delete(key);
    }
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
  }

  return {
    take({ ip, kind }) {
      const time = now();
      const capacity = limits[kind].perMinute;
      const perMs = capacity / 60_000;
      const key = `${kind}:${ip}`;
      const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: time };
      bucket.tokens = Math.min(capacity, bucket.tokens + (time - bucket.updatedAt) * perMs);
      bucket.updatedAt = time;
      if (bucket.tokens < 1) {
        buckets.set(key, bucket);
        return { allowed: false, retryAfterSeconds: Math.ceil((1 - bucket.tokens) / perMs / 1000) };
      }
      bucket.tokens -= 1;
      prune({ time });
      buckets.set(key, bucket);
      return { allowed: true };
    },
  };
}

/** The client address: first hop of `x-forwarded-for`, else `x-real-ip`, else a shared bucket. */
export function clientIp({ headers }: { headers: Headers }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
