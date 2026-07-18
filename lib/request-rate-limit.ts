import { createHash } from "crypto";

type LimitResult = { success: boolean; retryAfterSeconds: number };
type LocalEntry = { count: number; resetAt: number };

const localLimits = new Map<string, LocalEntry>();

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function opaqueKey(scope: string, request: Request, identifier = "") {
  return createHash("sha256")
    .update(`${scope}:${clientIp(request)}:${identifier.toLowerCase()}`)
    .digest("hex");
}

export async function checkRequestRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
  identifier = ""
): Promise<LimitResult> {
  const key = opaqueKey(scope, request, identifier);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);
    const ratelimit = new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.fixedWindow(limit, `${windowSeconds} s` as `${number} s`),
      prefix: `neatx:${scope}`,
    });
    const result = await ratelimit.limit(key);
    return {
      success: result.success,
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  }

  const now = Date.now();
  const existing = localLimits.get(key);
  if (!existing || existing.resetAt <= now) {
    localLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, retryAfterSeconds: windowSeconds };
  }
  existing.count += 1;
  if (localLimits.size > 10_000) {
    for (const [entryKey, entry] of localLimits) {
      if (entry.resetAt <= now) localLimits.delete(entryKey);
    }
  }
  return {
    success: existing.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
