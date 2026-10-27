import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

function loadPolicy(endpoint: string, bucket: string) {
  const policy = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import config from './next.config.ts';
       const rules = await config.headers();
       console.log(rules[0].headers.find(h => h.key === 'Content-Security-Policy').value);`,
    ],
    {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        NODE_ENV: "production",
        R2_ENDPOINT: endpoint,
        R2_BUCKET_NAME: bucket,
      },
      encoding: "utf8",
    },
  );
  return new Map(
    policy.trim().split(";").map((directive) => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }),
  );
}

test("CSP permits direct R2 uploads without allowing storage-hosted scripts", () => {
  const endpoint = "https://test-account.r2.cloudflarestorage.com";
  const policy = loadPolicy(`${endpoint}/`, "files");
  const connect = policy.get("connect-src")!;

  assert.ok(connect.includes(endpoint), "path-style upload URLs must work");
  assert.ok(
    connect.includes("https://files.test-account.r2.cloudflarestorage.com"),
    "bucket-subdomain upload URLs must work",
  );
  assert.ok(!connect.includes("https://*.r2.cloudflarestorage.com"));
  assert.deepEqual(policy.get("script-src"), ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(policy.get("object-src"), ["'none'"]);
  assert.deepEqual(policy.get("frame-ancestors"), ["'none'"]);
});

test("CSP works without R2 configuration and preserves the app's font sources", () => {
  const policy = loadPolicy("", "");
  assert.ok(!policy.get("connect-src")!.some((source) => /undefined|null|cloudflarestorage/.test(source)));
  assert.ok(policy.get("style-src")!.includes("https://use.typekit.net"));
  assert.ok(policy.get("font-src")!.includes("https://use.typekit.net"));
});
