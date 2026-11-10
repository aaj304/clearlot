/**
 * Small in-memory rate limiter. Each satellite fetch and AI measurement costs money, so this
 * keeps one visitor (or bot) from running up the bill. It resets when the server restarts and
 * is per-instance; on a multi-instance host put a shared store (Upstash, Redis) behind it.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function tooMany() {
  return Response.json(
    { error: "You've made a lot of requests. Please wait a few minutes and try again." },
    { status: 429 },
  );
}
