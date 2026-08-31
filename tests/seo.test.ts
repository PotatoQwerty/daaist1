import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import robots from "../src/app/robots.ts";
import { SITE_URL, absoluteUrl, metaDescription } from "../src/lib/site.ts";
import { serializeJsonLd } from "../src/lib/json-ld.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/**
 * Drop comments before asserting on source.
 *
 * These files explain the bug they fix, so the prose contains the very
 * identifiers being asserted against - the layout's comment names
 * `alternates.canonical` precisely because it must not set one.
 */
function stripComments(contents: string) {
  return contents
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Route prefixes that must never appear in a sitemap or be crawlable.
 *
 * These are the routes the earlier security work established as gated,
 * user-specific or token-bearing.
 */
const FORBIDDEN_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/courses",
  "/docs",
  "/invite",
  "/onboarding",
  "/profile",
  "/register",
  "/upload",
];

/* ================================================================== *
 * Sitemap
 * ================================================================== */

/**
 * The sitemap module is not imported and executed here: it queries
 * Supabase, so running it would need live credentials and would make the
 * suite depend on database contents. Its *static* half and its exclusions
 * are asserted from source instead, and the dynamic half is asserted to be
 * built only from slug columns.
 */
const sitemapSource = read("src/app/sitemap.ts");

test("sitemap: lists no gated or user-specific route", () => {
  // Every absoluteUrl("...") literal in the file.
  const paths = [...sitemapSource.matchAll(/absoluteUrl\(\s*["'`]([^"'`]+)/g)].map(
    (m) => m[1],
  );

  assert.ok(paths.length > 0, "sanity: sitemap should emit some paths");

  for (const routePath of paths) {
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assert.ok(
        !routePath.startsWith(forbidden),
        `sitemap must not contain ${routePath} (matches ${forbidden})`,
      );
    }
  }
});

test("sitemap: emits only slug-based dynamic URLs", () => {
  // A template literal building a dynamic entry must interpolate a slug,
  // never an id - the public routes are slug-addressed and an id in a
  // sitemap would leak an internal identifier.
  const templates = [
    ...sitemapSource.matchAll(/absoluteUrl\(\s*`([^`]+)`/g),
  ].map((m) => m[1]);

  for (const template of templates) {
    const interpolations = [...template.matchAll(/\$\{([^}]+)\}/g)].map(
      (m) => m[1],
    );
    for (const expression of interpolations) {
      assert.ok(
        /slug/i.test(expression),
        `dynamic sitemap URL interpolates "${expression}", which is not a slug`,
      );
      assert.ok(
        !/\bid\b|uuid|user|email|registration|token/i.test(expression),
        `dynamic sitemap URL interpolates something identifying: ${expression}`,
      );
    }
  }
});

test("sitemap: selects only the columns a URL needs", () => {
  const selects = [...sitemapSource.matchAll(/\.select\(\s*["'`]([^"'`]+)/g)].map(
    (m) => m[1],
  );

  assert.ok(selects.length >= 2, "sanity: expected the club and event reads");

  for (const columns of selects) {
    assert.ok(!columns.includes("*"), "sitemap must never select *");
    for (const sensitive of [
      "email",
      "phone",
      "registration_number",
      "user_id",
      "check_in_token",
      "token",
    ]) {
      assert.ok(
        !columns.includes(sensitive),
        `sitemap query selects ${sensitive}`,
      );
    }
  }
});

test("sitemap: filters dynamic content to what is actually public", () => {
  assert.ok(
    sitemapSource.includes('.eq("is_public", true)'),
    "only public events may be listed",
  );
  assert.ok(
    sitemapSource.includes('.eq("is_active", true)'),
    "inactive clubs must not be listed",
  );
});

/* ================================================================== *
 * robots.txt
 * ================================================================== */

test("robots: blocks every sensitive prefix", () => {
  const result = robots();
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  const disallow = ([] as string[]).concat(rule?.disallow ?? []);

  for (const prefix of FORBIDDEN_PREFIXES) {
    assert.ok(
      disallow.some((entry) => entry.startsWith(prefix)),
      `robots.txt must disallow ${prefix}`,
    );
  }
});

test("robots: keeps public pages crawlable", () => {
  const result = robots();
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  const disallow = ([] as string[]).concat(rule?.disallow ?? []);

  // The public event pages must stay reachable; only the check-in subpath
  // is blocked, and it is blocked with a wildcard rather than by taking
  // the whole /events tree out.
  assert.ok(
    !disallow.includes("/events/"),
    "public event pages must remain crawlable",
  );
  assert.ok(
    disallow.some((entry) => entry.includes("check-in")),
    "the organiser check-in route must be blocked",
  );
  for (const publicPath of ["/club", "/tools", "/privacy", "/terms"]) {
    assert.ok(
      !disallow.includes(publicPath) && !disallow.includes(`${publicPath}/`),
      `${publicPath} must remain crawlable`,
    );
  }
});

test("robots: points at the sitemap on the canonical origin", () => {
  const result = robots();
  assert.equal(result.sitemap, `${SITE_URL}/sitemap.xml`);
  assert.equal(result.host, SITE_URL);
});

/* ================================================================== *
 * Canonicals and metadata
 * ================================================================== */

test("canonical: absoluteUrl always produces the canonical origin", () => {
  assert.equal(absoluteUrl("/"), "https://daaist.com");
  assert.equal(absoluteUrl("/club"), "https://daaist.com/club");
  // No trailing-slash duplicate of the same page.
  assert.equal(absoluteUrl("/club/"), "https://daaist.com/club");
  assert.equal(absoluteUrl("/club/aci"), "https://daaist.com/club/aci");
  assert.ok(absoluteUrl("/x").startsWith("https://"), "must be https");
});

test("canonical: no page hardcodes a different origin", () => {
  const pages = walkPages(path.join(ROOT, "src/app"));

  for (const file of pages) {
    const contents = readFileSync(file, "utf8");
    const urls = [...contents.matchAll(/https?:\/\/[a-z0-9.-]+/gi)].map(
      (m) => m[0],
    );

    for (const url of urls) {
      if (url.startsWith("https://daaist.com")) continue;
      // Known third parties that legitimately appear in page source.
      if (
        /use\.typekit\.net|p\.typekit\.net|schema\.org|www\.w3\.org|cdn\.daaist\.com|supabase\.co|googleusercontent/.test(
          url,
        )
      ) {
        continue;
      }
      assert.fail(
        `${path.relative(ROOT, file)} references ${url}; canonicals and OG ` +
          "URLs must use the canonical origin",
      );
    }
  }
});

/** Every .ts/.tsx file under a directory. */
function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Just the route files: page.tsx and layout.tsx. */
function walkPages(dir: string): string[] {
  return walkFiles(dir).filter((file) =>
    /^(page|layout)\.tsx$/.test(path.basename(file)),
  );
}

test("metadata: descriptions are bounded and never leak raw personal text", () => {
  const long = "word ".repeat(200);
  const trimmed = metaDescription(long, "fallback");

  assert.ok(trimmed.length <= 160, "description must be bounded");
  assert.ok(trimmed.endsWith("…"), "a truncated description gets an ellipsis");

  // Missing or unusable input falls back rather than rendering "undefined".
  assert.equal(metaDescription(undefined, "fallback"), "fallback");
  assert.equal(metaDescription("", "fallback"), "fallback");
  assert.equal(metaDescription("   ", "fallback"), "fallback");
  assert.equal(metaDescription(null, "fallback"), "fallback");
  assert.equal(metaDescription(42, "fallback"), "fallback");
});

/* ================================================================== *
 * noindex coverage
 * ================================================================== */

/**
 * Every route that must carry noindex, and where it comes from.
 *
 * A page inherits `robots` from its nearest layout that sets it, so each
 * entry names the file that actually has to declare it.
 */
const NOINDEX_SOURCES = [
  "src/app/(root)/courses/layout.tsx",
  "src/app/(root)/profile/layout.tsx",
  "src/app/(root)/register/layout.tsx",
  "src/app/(root)/docs/page.tsx",
  "src/app/(root)/upload/page.tsx",
  "src/app/(root)/projects/page.tsx",
  "src/app/(root)/onboarding/page.tsx",
  "src/app/(root)/events/[eventId]/check-in/page.tsx",
  "src/app/(auth)/admin/layout.tsx",
  "src/app/(auth)/invite/layout.tsx",
];

test("noindex: every private route declares it", () => {
  for (const file of NOINDEX_SOURCES) {
    const contents = read(file);
    assert.ok(
      /robots:\s*NOINDEX/.test(contents),
      `${file} must set robots: NOINDEX`,
    );
  }
});

test("noindex: the shared constant actually blocks indexing", () => {
  const contents = read("src/lib/site.ts");
  const block = contents.slice(contents.indexOf("export const NOINDEX"));

  assert.ok(/index:\s*false/.test(block));
  assert.ok(/follow:\s*false/.test(block));
  assert.ok(/nocache:\s*true/.test(block));
});

test("noindex: it is never applied to a layout that wraps public pages", () => {
  // The (root) layout wraps the home, club, event, tools and legal pages.
  // A noindex there would silently deindex the whole public site.
  for (const file of [
    "src/app/(root)/layout.tsx",
    "src/app/(root)/events/[eventId]/page.tsx",
    "src/app/(root)/club/[slug]/page.tsx",
    "src/app/(root)/club/page.tsx",
    "src/app/(root)/tools/page.tsx",
    "src/app/(root)/page.tsx",
  ]) {
    const contents = read(file);
    assert.ok(
      !/robots:\s*NOINDEX/.test(contents),
      `${file} is public and must not be noindexed`,
    );
  }
});

test("canonical: the shared layout sets none, so private pages inherit none", () => {
  /* A canonical on the (root) layout is inherited by every page beneath it,
     gated ones included - which made /courses, /profile and /docs render
     <link rel="canonical" href="https://daaist.com">, declaring themselves
     duplicates of the home page. Public pages set their own instead. */
  const layout = stripComments(read("src/app/(root)/layout.tsx"));
  assert.ok(
    !/alternates\s*:/.test(layout),
    "the shared public layout must not set a canonical for its children",
  );

  // The home page still has one of its own.
  const home = read("src/app/(root)/page.tsx");
  assert.ok(
    /alternates:\s*\{\s*canonical:\s*absoluteUrl\("\/"\)/.test(home),
    "the home page must declare its own canonical",
  );
});

test("noindex: private pages do not advertise a canonical URL", () => {
  // A canonical on a noindexed page invites a crawler to index the target.
  for (const file of [
    "src/app/(root)/courses/page.tsx",
    "src/app/(root)/docs/page.tsx",
  ]) {
    const contents = read(file);
    assert.ok(
      !/alternates:\s*\{[\s\S]{0,120}canonical/.test(contents),
      `${file} is noindexed and should not declare a canonical`,
    );
  }
});

/* ================================================================== *
 * JSON-LD injection safety
 * ================================================================== */

test("json-ld: a hostile string cannot break out of the script tag", () => {
  const payload = serializeJsonLd({
    "@type": "Event",
    name: '</script><script>alert("xss")</script>',
    description: "a & b < c > d",
  });

  assert.ok(!payload.includes("</script"), "must not emit a closing script tag");
  assert.ok(!payload.includes("<"), "raw < must never appear");
  assert.ok(!payload.includes(">"), "raw > must never appear");
  assert.ok(!payload.includes("&"), "raw & must never appear");

  // Still valid JSON, and still the same data once parsed.
  const parsed = JSON.parse(payload);
  assert.equal(parsed.name, '</script><script>alert("xss")</script>');
  assert.equal(parsed.description, "a & b < c > d");
});

test("json-ld: unserialisable input renders nothing rather than broken markup", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  assert.equal(serializeJsonLd(circular), "");
  assert.equal(serializeJsonLd(undefined), "");
});

test("json-ld: raw HTML injection is confined to the one audited component", () => {
  const offenders = walkFiles(path.join(ROOT, "src"))
    .filter((file) => readFileSync(file, "utf8").includes("dangerouslySetInnerHTML"))
    .map((file) => path.relative(ROOT, file).replaceAll("\\", "/"));

  assert.deepEqual(
    offenders,
    ["src/components/JsonLd.tsx"],
    "raw HTML injection must stay in the single component that escapes it",
  );
});
