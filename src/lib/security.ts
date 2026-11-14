// src/lib/security.ts

export class RateLimitError extends Error {
  public readonly code = "RATE_LIMIT_EXCEEDED";
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(
  bucket: "login" | "upload" | "mutation",
  identifier: string,
  maxRequests = 5,
  windowMs = 60_000
): void {
  const now = Date.now();
  const key = `${bucket}:${identifier.trim().toLowerCase()}`;
  const timestamps = (rateBuckets.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) {
    throw new RateLimitError(
      `Too many ${bucket} attempts. Please wait a minute before trying again.`
    );
  }
  timestamps.push(now);
  rateBuckets.set(key, timestamps);
}

export function resetRateLimiter(): void {
  rateBuckets.clear();
}

