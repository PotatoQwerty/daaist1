import test from "node:test";
import assert from "node:assert/strict";

import { getBaseUrl } from "../src/lib/base-url.ts";
import { enforceRateLimit, getClientIp } from "../src/lib/rate-limit.ts";

/** Minimal stand-in for the Headers object the callers pass. */
function headers(values: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

/** getBaseUrl reads the env var at call time, so it can be swapped per test. */
function withBaseUrl<T>(value: string | undefined, run: () => T): T {
  const previous = process.env.NEXT_PUBLIC_BASE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
  else process.env.NEXT_PUBLIC_BASE_URL = value;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_BASE_URL = previous;
  }
}

/* ------------------------------------------------------------------ *
 * L6 - the origin came from request headers
 *
 * The register page built it from x-forwarded-proto + x-forwarded-host and
 * put the result inside a check-in QR code.
 * ------------------------------------------------------------------ */

test("L6: the configured origin beats a spoofed host header", () => {
  const result = withBaseUrl("https://daaist.com", () =>
    getBaseUrl(headers({ "x-forwarded-host": "evil.example" })),
  );

  assert.equal(result, "https://daaist.com");
});

test("L6: a trailing slash or path in the env var is normalised away", () => {
  for (const configured of [
    "https://daaist.com/",
    "https://daaist.com/some/path",
  ]) {
    const result = withBaseUrl(configured, () => getBaseUrl(headers({})));
    assert.equal(result, "https://daaist.com");
  }
});

test("L6: with nothing configured it falls back to the request host", () => {
  const result = withBaseUrl(undefined, () =>
    getBaseUrl(headers({ host: "daaist.com" })),
  );

  // https unless the proxy explicitly said otherwise.
  assert.equal(result, "https://daaist.com");
});

test("L6: a malformed host is refused rather than echoed", () => {
  for (const host of [
    "evil.example/path",
    "evil example",
    "host_with_underscore/../x",
    "a".repeat(300),
    "",
  ]) {
    const result = withBaseUrl(undefined, () =>
      getBaseUrl(headers({ "x-forwarded-host": host })),
    );
    assert.equal(result, "", `host ${JSON.stringify(host)} must be refused`);
  }
});

test("L6: only http downgrades the scheme", () => {
  const http = withBaseUrl(undefined, () =>
    getBaseUrl(headers({ host: "localhost:3000", "x-forwarded-proto": "http" })),
  );
  assert.equal(http, "http://localhost:3000");

  // A list or an unexpected value must not be echoed into the URL.
  const weird = withBaseUrl(undefined, () =>
    getBaseUrl(
      headers({ host: "daaist.com", "x-forwarded-proto": "https,http" }),
    ),
  );
  assert.equal(weird, "https://daaist.com");
});

/* ------------------------------------------------------------------ *
 * L10 - rate-limit keys came straight from headers
 *
 * Any string became a counter key, so a caller could mint unlimited
 * distinct keys and never accumulate a count against any of them.
 * ------------------------------------------------------------------ */

function request(values: Record<string, string>) {
  return new Request("https://daaist.com/", { headers: values });
}

test("L10: the platform header wins over the spoofable ones", () => {
  const ip = getClientIp(
    request({
      "x-vercel-forwarded-for": "203.0.113.5",
      "x-real-ip": "198.51.100.9",
      "x-forwarded-for": "192.0.2.1",
    }),
  );

  assert.equal(ip, "203.0.113.5");
});

test("L10: the leftmost forwarded entry is used", () => {
  const ip = getClientIp(
    request({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" }),
  );

  assert.equal(ip, "203.0.113.5");
});

test("L10: values that are not addresses collapse to the shared budget", () => {
  for (const bogus of [
    "not-an-ip",
    "'; DROP TABLE--",
    "999.999.999.999",
    "a".repeat(200),
    "",
    "../../etc/passwd",
  ]) {
    const ip = getClientIp(request({ "x-real-ip": bogus }));
    assert.equal(
      ip,
      "unknown",
      `${JSON.stringify(bogus)} must not become its own counter key`,
    );
  }
});

test("L10: a bogus header falls through to a valid one", () => {
  const ip = getClientIp(
    request({ "x-real-ip": "garbage", "x-forwarded-for": "203.0.113.7" }),
  );

  assert.equal(ip, "203.0.113.7");
});

test("L10: IPv6 is recognised", () => {
  assert.equal(
    getClientIp(request({ "x-real-ip": "2001:db8::1" })),
    "2001:db8::1",
  );
  assert.equal(getClientIp(request({ "x-real-ip": "::1" })), "::1");
});

test("L10: no headers at all is the shared budget, not a crash", () => {
  assert.equal(getClientIp(request({})), "unknown");
});

/* ------------------------------------------------------------------ *
 * M9 / L10 - the limiter's actual behaviour
 *
 * Every other rate-limit test asserts that a route is wired up. These
 * assert the thing being wired up works.
 * ------------------------------------------------------------------ */

test("M9: a caller over budget gets a 429 with Retry-After", async () => {
  const rule = { limit: 3, windowMs: 60_000 };
  const bucket = `test-${Math.random()}`;
  const req = request({ "x-vercel-forwarded-for": "203.0.113.10" });

  for (let i = 0; i < rule.limit; i++) {
    assert.equal(
      enforceRateLimit(req, rule, { bucket }),
      null,
      `request ${i + 1} of ${rule.limit} should be allowed`,
    );
  }

  const blocked = enforceRateLimit(req, rule, { bucket });
  assert.ok(blocked, "the request past the limit must be rejected");
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get("Retry-After"), "must say when to retry");
  assert.equal(blocked.headers.get("RateLimit-Remaining"), "0");
});

test("M9: budgets are per user, not shared between accounts", () => {
  const rule = { limit: 1, windowMs: 60_000 };
  const bucket = `test-${Math.random()}`;
  const req = request({});

  assert.equal(enforceRateLimit(req, rule, { bucket, userId: "user-a" }), null);
  assert.ok(enforceRateLimit(req, rule, { bucket, userId: "user-a" }));

  // A different account must be unaffected by the first one's spend.
  assert.equal(enforceRateLimit(req, rule, { bucket, userId: "user-b" }), null);
});

test("M9: buckets are independent, so one route cannot exhaust another", () => {
  const rule = { limit: 1, windowMs: 60_000 };
  const suffix = Math.random();
  const req = request({});

  assert.equal(
    enforceRateLimit(req, rule, { bucket: `a-${suffix}`, userId: "u" }),
    null,
  );
  assert.equal(
    enforceRateLimit(req, rule, { bucket: `b-${suffix}`, userId: "u" }),
    null,
  );
});

test("L10: spoofed header values share one budget instead of each getting their own", async () => {
  const rule = { limit: 2, windowMs: 60_000 };
  const bucket = `test-${Math.random()}`;

  // Rotating a bogus header was a way to get a fresh counter every time.
  // They all normalise to "unknown", so they draw on the same budget.
  assert.equal(
    enforceRateLimit(request({ "x-real-ip": "bogus-1" }), rule, { bucket }),
    null,
  );
  assert.equal(
    enforceRateLimit(request({ "x-real-ip": "bogus-2" }), rule, { bucket }),
    null,
  );

  const blocked = enforceRateLimit(request({ "x-real-ip": "bogus-3" }), rule, {
    bucket,
  });
  assert.ok(blocked, "a rotating bogus header must not reset the counter");
  assert.equal(blocked.status, 429);
});
