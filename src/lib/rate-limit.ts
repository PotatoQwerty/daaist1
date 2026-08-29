import { NextResponse } from "next/server";

/**
 * In-process rate limiting.
 *
 * WHAT THIS IS: a fixed-window counter held in module memory. It needs no
 * Redis, no KV, and no new environment variables, so it works as-is on the
 * current deployment.
 *
 * WHAT IT IS NOT: a distributed guarantee. Each serverless instance keeps its
 * own counters, so the effective ceiling is roughly `limit x concurrent
 * instances`, and counters reset when an instance is recycled. That is fine
 * for what it is here for - blunting enumeration, brute force and scripted
 * spam - and it is not a substitute for a shared store if you ever need a
 * hard cap. To upgrade later, keep `enforceRateLimit`'s signature and swap the
 * body for a Redis INCR with expiry; no route needs to change.
 *
 * KEYING: prefer the signed-in user id over the IP. Students at DAA share
 * campus NAT, so an IP-keyed limit would count a whole lab as one caller and
 * lock out a class. IP is the fallback for genuinely anonymous endpoints.
 */

export type RateLimitRule = {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

type Counter = { count: number; resetAt: number };

// Survives hot reload in dev, where module state would otherwise be dropped
// on every edit and make the limits look broken.
const store: Map<string, Counter> = ((
  globalThis as typeof globalThis & { __daaRateLimit?: Map<string, Counter> }
).__daaRateLimit ??= new Map());

// Bounds memory if a burst of unique keys arrives.
const MAX_TRACKED_KEYS = 20_000;

function pruneExpired(now: number) {
  for (const [key, counter] of store) {
    if (counter.resetAt <= now) store.delete(key);
  }

  // Still oversized after pruning: drop the oldest-resetting entries. Losing a
  // counter fails open for that caller, which is the right trade against
  // growing without bound.
  if (store.size > MAX_TRACKED_KEYS) {
    const byExpiry = [...store.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    for (const [key] of byExpiry.slice(0, store.size - MAX_TRACKED_KEYS)) {
      store.delete(key);
    }
  }
}

/**
 * Best-effort client IP.
 *
 * `x-vercel-forwarded-for` is set by the platform and cannot be spoofed by the
 * caller, so it is preferred. `x-forwarded-for` is only trustworthy behind a
 * proxy that overwrites it; the leftmost entry is used, matching Vercel's
 * behaviour. Callers with no usable IP all collapse onto one key, which is
 * deliberate: unattributable traffic shares a single budget.
 */
export function getClientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

export type RateLimitOptions = {
  /** Names the limit, so separate routes do not share a budget. */
  bucket: string;
  /** Signed-in user id. Strongly preferred over IP where available. */
  userId?: string | null;
  /** Message returned to the caller on rejection. */
  message?: string;
};

/**
 * Returns a 429 response when the caller is over budget, or null to proceed.
 *
 *   const limited = enforceRateLimit(req, RATE_LIMITS.roster, {
 *     bucket: "registration-check",
 *     userId: user.id,
 *   });
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  request: Request,
  rule: RateLimitRule,
  options: RateLimitOptions,
): NextResponse | null {
  const now = Date.now();

  if (store.size > MAX_TRACKED_KEYS) pruneExpired(now);

  const identity = options.userId
    ? `u:${options.userId}`
    : `ip:${getClientIp(request)}`;
  const key = `${options.bucket}:${identity}`;

  const existing = store.get(key);
  const counter =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + rule.windowMs };

  counter.count += 1;
  store.set(key, counter);

  const resetSeconds = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));

  if (counter.count > rule.limit) {
    return NextResponse.json(
      {
        error:
          options.message ??
          "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(resetSeconds),
          "RateLimit-Limit": String(rule.limit),
          "RateLimit-Remaining": "0",
          "RateLimit-Reset": String(resetSeconds),
        },
      },
    );
  }

  return null;
}

/**
 * Shared budgets.
 *
 * Sized against the real usage pattern rather than a round number: a student
 * correcting a typo needs several tries, a script walking sequential ids needs
 * thousands. The gap between those is where these sit.
 */
export const RATE_LIMITS = {
  /**
   * Looking up a name by registration number. Sequential ids make this the
   * roster-enumeration path, so it is the tightest limit in the app. A student
   * retyping their own matricule a few times stays well inside it.
   */
  registrationLookup: { limit: 10, windowMs: 5 * 60_000 },

  /** Invite token check. Unauthenticated, and a validity oracle. */
  inviteValidate: { limit: 10, windowMs: 10 * 60_000 },

  /** Redeeming an invite. Also narrows the window on the redemption race. */
  inviteRedeem: { limit: 5, windowMs: 10 * 60_000 },

  /** Creating invites. Authenticated admins, so mainly a runaway-script guard. */
  inviteCreate: { limit: 20, windowMs: 10 * 60_000 },

  /**
   * Public event sign-up. Keyed by IP for anonymous callers, so the ceiling has
   * to clear a lab of students registering off one campus connection. Duplicate
   * detection already blocks repeat entries; this caps scripted flooding.
   */
  eventRegister: { limit: 30, windowMs: 10 * 60_000 },

  /** Account setup. Succeeds once, so anything past a couple of tries is noise. */
  onboarding: { limit: 5, windowMs: 10 * 60_000 },

  /**
   * Diagram generators. Unauthenticated and they call an upstream API, so each
   * request costs real work. Generous enough to iterate on parameters.
   */
  tools: { limit: 30, windowMs: 5 * 60_000 },

  /** Minting presigned upload URLs. */
  uploadUrl: { limit: 30, windowMs: 10 * 60_000 },

  /** Avatar replacement. Each one writes to storage. */
  avatarUpload: { limit: 10, windowMs: 10 * 60_000 },

  /** Profile edits. */
  profileUpdate: { limit: 20, windowMs: 5 * 60_000 },

  /** Favourite toggles. Loose: it is a button people click quickly. */
  likeToggle: { limit: 60, windowMs: 60_000 },

  /** Event check-in scanning. Staff scan in bursts at a door. */
  checkIn: { limit: 120, windowMs: 60_000 },
} as const;
