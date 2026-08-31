import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Structural regression tests for the authorization fixes.
 *
 * C1, H1, H2, H4 and H6 are "this check exists and runs before the data is
 * read" properties. Exercising them through the real handlers would mean
 * standing up Supabase, an auth cookie and the Next request pipeline; what
 * actually regressed in each case was someone writing a route or a page
 * without the check, so that is what these assert.
 *
 * The point is the last test in the file: every API route is either
 * authenticated or named in a reviewed allowlist, so a new unauthenticated
 * endpoint fails CI instead of shipping.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (relative: string) =>
  readFileSync(path.join(ROOT, relative), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const SRC = path.join(ROOT, "src");
const allSourceFiles = walk(SRC).filter((f) => /\.tsx?$/.test(f));
const rel = (f: string) => path.relative(ROOT, f).replaceAll("\\", "/");

/** True when a module is a client component. */
function isClientComponent(contents: string) {
  return /^\s*["']use client["']/m.test(contents);
}

/**
 * Drop comments before asserting on source.
 *
 * These files document the vulnerability they fix, so the prose contains
 * the very strings being asserted against ("maxAge: 400 days", 'select("*")').
 * Matching those would make a test pass or fail on a comment.
 */
function stripComments(contents: string) {
  return contents
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/* ================================================================== *
 * C1 - Server Action exposure
 *
 * `"use server"` registers every export of a module as a publicly
 * routable endpoint. supabase/actions.ts carried it, so all fourteen of
 * its exports were live RPCs and only one checked anything.
 * ================================================================== */

test("C1: supabase/actions.ts is not a Server Action module", () => {
  const contents = read("src/lib/supabase/actions.ts");

  assert.ok(
    !/^\s*["']use server["']/m.test(contents),
    'supabase/actions.ts must not declare "use server": it would republish ' +
      "every export as an unauthenticated HTTP endpoint",
  );
  assert.ok(
    /import\s+["']server-only["']/.test(contents),
    "supabase/actions.ts must import server-only so a client import fails the build",
  );
});

test("C1: no client component imports the server data module", () => {
  const offenders = allSourceFiles.filter((file) => {
    const contents = readFileSync(file, "utf8");
    return (
      isClientComponent(contents) &&
      /from\s+["'](@\/lib\/supabase\/actions|.*\/supabase\/actions)["']/.test(
        contents,
      )
    );
  });

  assert.deepEqual(
    offenders.map(rel),
    [],
    "client components must reach this data through an authorized API route",
  );
});

test("C1: every Server Action module authenticates its callers", () => {
  /**
   * The general form of the bug, not just the one file that had it.
   *
   * Any module declaring "use server" publishes all of its exports as HTTP
   * endpoints. If such a module touches the service-role client it must
   * establish who is calling, or it is an unauthenticated database handle.
   */
  const actionModules = allSourceFiles.filter((file) =>
    /^\s*["']use server["']/m.test(readFileSync(file, "utf8")),
  );

  const unauthenticated = actionModules.filter((file) => {
    const contents = readFileSync(file, "utf8");
    return (
      contents.includes("supabaseServer") &&
      !contents.includes("auth.getUser()")
    );
  });

  assert.deepEqual(
    unauthenticated.map(rel),
    [],
    'these "use server" modules expose privileged database access with no ' +
      "session check; either authenticate each export or make the module " +
      "server-only",
  );
});

test("C1: fetchUsers requires administrator rights", () => {
  const contents = read("src/lib/supabase/actions.ts");
  const start = contents.indexOf("export const fetchUsers");
  assert.ok(start > -1, "fetchUsers should still exist");

  // Up to the next top-level export.
  const rest = contents.slice(start);
  const end = rest.indexOf("\nexport ", 1);
  const body = end > -1 ? rest.slice(0, end) : rest;

  assert.ok(
    body.includes("canAdminister"),
    "fetchUsers returns registration numbers; a session alone is not enough",
  );
  assert.ok(
    body.indexOf("canAdminister") < body.indexOf('from("profiles")'),
    "the permission check must run before the profiles read",
  );
});

test("C1: the directory endpoint never exposes registration numbers", () => {
  const contents = read("src/app/api/users/directory/route.ts");

  assert.ok(
    !contents.includes("registration_number"),
    "the picker only needs a display label",
  );
  assert.ok(
    !/\.select\(\s*["'`]\*/.test(contents),
    "the directory must project explicit columns, never *",
  );
  assert.ok(
    contents.includes("auth.getUser()"),
    "the directory must require a session",
  );
});

/* ================================================================== *
 * H1 - profile disclosure
 * ================================================================== */

test("H1: every profile lookup projects explicit columns", () => {
  const contents = stripComments(read("src/lib/data.ts"));

  // Each `.from("profiles")` must be followed by the safe column list, not
  // by select("*"). The row is handed to a client component, so anything
  // selected here is serialised into the page payload.
  const profileQueries = [...contents.matchAll(/from\(\s*["']profiles["']\s*\)/g)];
  assert.ok(profileQueries.length >= 2, "sanity: profile queries should exist");

  for (const match of profileQueries) {
    const following = contents.slice(match.index!, match.index! + 120);
    assert.ok(
      following.includes("PUBLIC_PROFILE_COLUMNS"),
      `a profiles query in data.ts does not use the safe column list: ${following
        .replace(/\s+/g, " ")
        .slice(0, 90)}`,
    );
  }
});

test("H1: the public column list excludes personal data", () => {
  const contents = stripComments(read("src/lib/data.ts"));
  const columns =
    contents.match(/PUBLIC_PROFILE_COLUMNS\s*=\s*\n?\s*["']([^"']+)["']/)?.[1] ??
    "";

  assert.ok(columns.length > 0, "PUBLIC_PROFILE_COLUMNS should be defined");

  for (const leaky of ["email", "phone", "registration_number"]) {
    assert.ok(
      !columns.includes(leaky),
      `PUBLIC_PROFILE_COLUMNS must not include ${leaky}`,
    );
  }
});

test("H1: the profile page requires a session before reading a profile", () => {
  const contents = read("src/app/(root)/profile/[username]/page.tsx");

  assert.ok(contents.includes("auth.getUser()"), "profile page must check auth");
  assert.ok(
    contents.indexOf("auth.getUser()") < contents.indexOf("getUserByUsername("),
    "the session check must run before the profile is fetched",
  );
});

/* ================================================================== *
 * H2 - course archive
 * ================================================================== */

test("H2: the course level page is authenticated and uncacheable", () => {
  const contents = read("src/app/(root)/courses/[...id]/page.tsx");

  assert.ok(
    contents.includes("auth.getUser()"),
    "the course archive must require a session",
  );
  assert.ok(
    !/export\s+const\s+revalidate/.test(contents),
    "a gated page must not be ISR-cached: the anonymous render gets reused",
  );
  assert.ok(
    /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(contents),
    "the page must opt out of static generation explicitly",
  );
  assert.ok(
    contents.indexOf("auth.getUser()") < contents.indexOf('from("files")'),
    "the session check must run before the files are read",
  );
});

/* ================================================================== *
 * H4 - cookies and headers
 * ================================================================== */

test("H4: every Supabase client sets hardened cookie options", () => {
  for (const file of [
    "src/lib/supabase/server.ts",
    "src/lib/supabase/auth/server.ts",
    "src/lib/supabase/client.ts",
  ]) {
    assert.ok(
      read(file).includes("SUPABASE_COOKIE_OPTIONS"),
      `${file} must pass cookieOptions, or it inherits the library default ` +
        "of no Secure flag and a 400-day lifetime",
    );
  }
});

test("H4: the auth cookie is Secure in production and short-lived", () => {
  const contents = stripComments(read("src/lib/supabase/cookie-options.ts"));

  assert.ok(/secure:/.test(contents), "the Secure flag must be set");
  assert.ok(
    contents.includes('process.env.NODE_ENV === "production"'),
    "Secure should be on in production (and off on http://localhost)",
  );
  assert.ok(/sameSite:\s*["']lax["']/.test(contents), "SameSite must stay lax");

  const maxAge = contents.match(/maxAge:\s*([^,\n]+)/)?.[1] ?? "";
  assert.ok(!maxAge.includes("400"), "the 400-day default must not survive");
});

test("H4: the security headers are all present", () => {
  const contents = read("next.config.ts");

  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.ok(contents.includes(header), `${header} must be sent`);
  }

  assert.ok(
    contents.includes("poweredByHeader: false"),
    "the framework version header should be off",
  );
});

test("H4: the CSP blocks framing and foreign script, but keeps the app working", () => {
  const contents = read("next.config.ts");

  assert.ok(
    contents.includes("frame-ancestors 'none'"),
    "clickjacking of the admin dashboard must be blocked",
  );
  assert.ok(
    contents.includes("object-src 'none'"),
    "plugin content should be blocked",
  );
  assert.ok(
    /script-src 'self'/.test(contents),
    "script must be same-origin, so cdn.daaist.com cannot serve executable script",
  );
  // Regressions that would break the running app rather than weaken it.
  assert.ok(
    contents.includes("wss://*.supabase.co"),
    "the chat subscribes to Supabase Realtime over a WebSocket",
  );
  assert.ok(
    contents.includes("use.typekit.net"),
    "both layouts load the Typekit stylesheet",
  );
  assert.ok(
    contents.includes("camera=(self)"),
    "the check-in desk needs the camera for QR scanning",
  );
});

/* ================================================================== *
 * H5 - file record binding
 * ================================================================== */

test("H5: recording a file verifies the URL belongs to the caller", () => {
  const contents = read("src/app/api/files/create/route.ts");

  assert.ok(
    contents.includes("describeUploadedUrl"),
    "the url must be validated against our own CDN and namespace",
  );
  assert.ok(
    contents.includes("described.ownerId !== user.id"),
    "a caller must not record a file under someone else's key",
  );
});

test("H5: deleting a file refuses an ambiguous url match", () => {
  const contents = read("src/app/api/files/[...filekey]/route.ts");

  assert.ok(
    !/\.eq\("url"[\s\S]{0,80}\.single\(\)/.test(contents),
    ".single() on url reported a duplicate as 'not found', which let a " +
      "forged row block the real owner from deleting",
  );
  assert.ok(
    contents.includes("fileRows.length > 1"),
    "an ambiguous match must be refused rather than guessed",
  );
});

/* ================================================================== *
 * H6 / global - no unauthenticated API routes
 * ================================================================== */

/**
 * Routes that are public on purpose, each with the reason.
 *
 * Adding to this list is a security decision. Anything not listed has to
 * call auth.getUser().
 */
const INTENTIONALLY_PUBLIC_ROUTES = new Map([
  ["src/app/api/admin/route.ts", "returns 403 unconditionally"],
  [
    "src/app/api/admin/invite/validate/route.ts",
    "checks a token before sign-in; rate limited, uniform errors",
  ],
  ["src/app/api/tools/sunpath2d/route.ts", "public diagram generator"],
  ["src/app/api/tools/sunpath3d/route.ts", "public diagram generator"],
  ["src/app/api/tools/windrose/route.ts", "public diagram generator"],
]);

test("H6: every API route authenticates, or is a reviewed public route", () => {
  const apiRoutes = allSourceFiles
    .filter((f) => rel(f).startsWith("src/app/api/"))
    .filter((f) => path.basename(f) === "route.ts");

  assert.ok(apiRoutes.length > 20, "sanity: routes should have been found");

  const unauthenticated = apiRoutes
    .filter((file) => !readFileSync(file, "utf8").includes("auth.getUser()"))
    .map(rel)
    .filter((r) => !INTENTIONALLY_PUBLIC_ROUTES.has(r));

  assert.deepEqual(
    unauthenticated,
    [],
    "these routes read or write data without checking who is calling; add " +
      "auth.getUser() or justify them in INTENTIONALLY_PUBLIC_ROUTES",
  );
});

test("H6: the username lookup is gated to administrators", () => {
  const contents = read("src/app/api/users/[username]/route.ts");

  assert.ok(contents.includes("auth.getUser()"), "must require a session");
  assert.ok(contents.includes("canAdminister"), "must require admin rights");
  assert.ok(
    !/error\?\.message/.test(contents),
    "the raw PostgREST error must not be returned to the caller",
  );
});

test("global: the service-role key never reaches a client component", () => {
  const offenders = allSourceFiles.filter((file) => {
    const contents = readFileSync(file, "utf8");
    return (
      isClientComponent(contents) &&
      (contents.includes("SUPABASE_SERVICE_ROLE_KEY") ||
        contents.includes("supabaseServer"))
    );
  });

  assert.deepEqual(offenders.map(rel), []);
});

/* ================================================================== *
 * M6 - admin profile editing
 * ================================================================== */

test("M6: a plain admin cannot edit a super admin's profile", () => {
  const contents = stripComments(read("src/app/api/admin/users/update/route.ts"));

  // The roles branch always had this guard; the profile branch runs first
  // and did not, so an admin could rename a super admin or take their name.
  // Bounded by the roles branch, not by a comment: stripComments removes
  // comments, so a comment marker would slice to end-of-file and pick up
  // the roles branch's own (unrelated) super_admin guard.
  const profileStart = contents.indexOf("if (firstname || lastname || username)");
  const rolesStart = contents.indexOf("if (roles && Array.isArray(roles)");
  assert.ok(profileStart > -1, "sanity: profile branch should be found");
  assert.ok(rolesStart > profileStart, "sanity: roles branch should follow it");
  const profileBranch = contents.slice(profileStart, rolesStart);

  assert.ok(
    profileBranch.includes("SUPER_ADMIN_ONLY_ROLES"),
    "the profile branch must refuse a super_admin target for a plain admin",
  );
  // The constant being mentioned is not proof the guard runs: assert the
  // actual condition and the refusal it produces.
  assert.ok(
    /if\s*\(\s*!isSuperAdmin\s*\)/.test(profileBranch),
    "the guard must be conditional on the caller not being a super admin",
  );
  assert.ok(
    /status:\s*403/.test(profileBranch),
    "a plain admin aiming at a super admin must be refused with a 403",
  );
  assert.ok(
    profileBranch.includes("validateProfileFields"),
    "an admin must not be able to set a username a user could not choose",
  );
  assert.ok(
    profileBranch.indexOf("SUPER_ADMIN_ONLY_ROLES") <
      profileBranch.indexOf('from("profiles")'),
    "the check must run before the write",
  );
});

/* ================================================================== *
 * M7 - chat
 * ================================================================== */

test("M7: chat bounds message length, rate and history", () => {
  const contents = stripComments(read("src/lib/Chat.ts"));

  assert.ok(
    /content\.length > MAX_MESSAGE_LENGTH/.test(contents),
    "messages must have a length ceiling",
  );
  assert.ok(
    contents.includes("RATE_LIMITS.chatPost"),
    "posting must be rate limited",
  );
  assert.ok(
    /\.limit\(CHAT_HISTORY_LIMIT\)/.test(contents),
    "history must be bounded rather than selecting the whole table",
  );
  // Both actions stay authenticated - this file is still "use server", so
  // its exports remain network-reachable by design.
  assert.equal(
    contents.split("auth.getUser()").length - 1,
    2,
    "both chat actions must check the session",
  );
  assert.equal(
    contents.split("isdaa").length - 1 >= 2,
    true,
    "both chat actions must check DAA enrollment",
  );
});

/* ================================================================== *
 * M8 - GET /api/events/register must be read-only
 * ================================================================== */

test("M8: the register GET handler performs no writes", () => {
  const contents = read("src/app/api/events/register/route.ts");

  const getStart = contents.indexOf("export async function GET");
  const postStart = contents.indexOf("export async function POST");
  assert.ok(getStart > -1 && postStart > getStart, "sanity: handlers found");

  const getBody = stripComments(contents.slice(getStart, postStart));

  for (const mutation of [".update(", ".insert(", ".delete(", ".upsert("]) {
    assert.ok(
      !getBody.includes(mutation),
      `GET must not call ${mutation}: the auth cookie is SameSite=Lax, so a ` +
        "cross-site top-level navigation still carries it, and a mutating " +
        "GET is also cacheable and prefetchable",
    );
  }

  // It must not mint a token either - an unpersisted one produces a QR code
  // that does not scan.
  assert.ok(
    !getBody.includes("randomUUID()"),
    "GET must not generate a check-in token it cannot persist",
  );
});

test("M8: POST still performs the writes GET gave up", () => {
  const contents = read("src/app/api/events/register/route.ts");
  const postBody = stripComments(
    contents.slice(contents.indexOf("export async function POST")),
  );

  assert.ok(postBody.includes(".update("), "POST still attaches user_id");
  assert.ok(postBody.includes(".insert("), "POST still creates registrations");
  // The identity rules are unchanged, not relaxed.
  assert.ok(postBody.includes("canRevealParticipantCheckInToken"));
  assert.ok(postBody.includes("canAttachParticipantToUser"));
});

/* ================================================================== *
 * M9 - write-path rate limiting
 * ================================================================== */

/**
 * Routes with no rate limit, and why that is acceptable.
 *
 * As with the auth allowlist, adding to this is a deliberate decision.
 */
const UNLIMITED_WRITE_ROUTES = new Map([
  ["src/app/api/admin/route.ts", "returns 403 unconditionally, no handler body"],
  [
    "src/app/api/files/like/[fileId]/route.ts",
    "dead route against a dropped table; audit finding L2, slated for removal",
  ],
]);

test("M9: every mutating API route is rate limited", () => {
  const routes = allSourceFiles
    .filter((f) => rel(f).startsWith("src/app/api/"))
    .filter((f) => path.basename(f) === "route.ts");

  const unlimited = routes
    .filter((file) => {
      const contents = readFileSync(file, "utf8");
      const mutates = /export\s+(async\s+)?(function|const)\s+(POST|PUT|PATCH|DELETE)/.test(
        contents,
      );
      if (!mutates) return false;

      /* Mentioning enforceRateLimit is not enough - the call has to be
         assigned and its result returned, or the limit does nothing. */
      const assigned = /const\s+limited\s*=\s*(await\s+)?enforceRateLimit\(/.test(
        contents,
      );
      const acted = /if\s*\(limited\)\s*return/.test(contents);
      return !(assigned && acted);
    })
    .map(rel)
    .filter((r) => !UNLIMITED_WRITE_ROUTES.has(r));

  assert.deepEqual(
    unlimited,
    [],
    "these routes accept writes with no rate limit; add enforceRateLimit or " +
      "justify them in UNLIMITED_WRITE_ROUTES",
  );
});

test("M9: rate-limit buckets are distinct per route", () => {
  // A shared bucket name would silently merge two routes' budgets.
  const buckets: string[] = [];

  for (const file of allSourceFiles) {
    // Comments stripped: rate-limit.ts documents usage with a worked
    // example that would otherwise read as a second declaration.
    const contents = stripComments(readFileSync(file, "utf8"));
    for (const match of contents.matchAll(/bucket:\s*["']([^"']+)["']/g)) {
      buckets.push(match[1]);
    }
  }

  const duplicates = buckets.filter((b, i) => buckets.indexOf(b) !== i);
  assert.deepEqual([...new Set(duplicates)], [], "bucket names must be unique");
});

/* ================================================================== *
 * M1 / M4 - routes must actually use the shared validators
 *
 * The unit tests prove the validators are correct; these prove the routes
 * still call them. Both halves are needed - a correct validator nothing
 * invokes protects nothing.
 * ================================================================== */

test("M1: the profile route validates through the shared validator", () => {
  const contents = stripComments(read("src/app/api/profile/update/route.ts"));

  assert.ok(
    /const\s+validated\s*=\s*validateProfileFields\(/.test(contents),
    "profile updates must run through validateProfileFields",
  );
  assert.ok(
    /if\s*\(!validated\.ok\)/.test(contents),
    "a validation failure must short-circuit the request",
  );
  assert.ok(
    contents.includes("validated.updates"),
    "the write must use the validated values, not the raw body",
  );
  // The raw body must never reach the update call.
  assert.ok(
    !/update\([\s\S]*?\{[\s\S]*?body\./.test(contents),
    "raw request fields must not be written directly",
  );
});

test("M2: onboarding validates the username before writing a profile", () => {
  const contents = stripComments(
    read("src/app/api/registration/onboarding/route.ts"),
  );

  assert.ok(
    /const\s+usernameCheck\s*=\s*validateUsername\(/.test(contents),
    "onboarding must validate the username server-side",
  );
  assert.ok(
    contents.indexOf("validateUsername(") < contents.indexOf('from("profiles")'),
    "validation must run before the profile write",
  );
  assert.ok(
    contents.includes("username: validUsername"),
    "the validated username must be what gets stored",
  );
});

test("M4: storage upload routes validate type and size", () => {
  for (const file of [
    "src/app/api/users/update-image/route.ts",
    "src/app/api/club/event/route.ts",
  ]) {
    const contents = stripComments(read(file));

    assert.ok(
      /const\s+imageCheck\s*=\s*validateImageUpload\(/.test(contents),
      `${file} must validate the uploaded image`,
    );
    assert.ok(
      /if\s*\(!imageCheck\.ok\)/.test(contents),
      `${file} must reject an invalid image`,
    );
    assert.ok(
      contents.includes("imageCheck.contentType"),
      `${file} must store the validated content type, not the client's`,
    );
  }
});

test("M4: the avatar filename extension comes from the MIME type", () => {
  const contents = stripComments(read("src/app/api/users/update-image/route.ts"));

  assert.ok(
    contents.includes("imageCheck.extension"),
    "the extension must be derived from the validated type",
  );
  assert.ok(
    !/file\.name\.split\(/.test(contents),
    "the extension must not be taken from the uploaded filename",
  );
  assert.ok(
    contents.includes("buildStoragePath("),
    "the object path must be built without a leading slash",
  );
});

test("M3: the file record is classified from the key, not the request body", () => {
  const contents = stripComments(read("src/app/api/files/create/route.ts"));

  assert.ok(
    /const\s+parsedKey\s*=\s*parseUploadKey\(/.test(contents),
    "the classification must be recovered from the signed key",
  );

  // The insert must use the derived values. A body-sourced category decides
  // which page a file appears on and was previously free-form.
  const insert = contents.slice(contents.indexOf('from("files").insert('));
  for (const field of ["category", "level", "subject"]) {
    assert.ok(
      insert.includes(`${field}: parsedKey.${field}`),
      `${field} must come from the parsed key`,
    );
    assert.ok(
      !insert.includes(`${field}: body.${field}`),
      `${field} must not come from the request body`,
    );
  }

  assert.ok(
    insert.includes("size: size.size"),
    "size must be the validated value",
  );
  assert.ok(
    insert.includes("type: contentType"),
    "type must be the content type the object is actually served with",
  );
  assert.ok(
    insert.includes("file_name: fileName.value"),
    "the display name must be validated text",
  );
});

/* ================================================================== *
 * L3 - raw database error text returned to callers
 *
 * Postgres/PostgREST messages name tables, columns and constraints. They
 * belong in the logs, not in a response body.
 * ================================================================== */

/**
 * Responses that may legitimately echo a message.
 *
 * These are the app's own validation strings, not database output.
 */
const ALLOWED_MESSAGE_ECHOES = [
  "usernameCheck.error",
  "validated.error",
  "check.error",
  "imageCheck.error",
  "fileName.error",
  "size.error",
  "declaredSize.error",
  "keyResult.error",
  "uploadErrorMessage(",
  "uniqueViolationMessage(",
];

/**
 * Extract the first argument of every NextResponse.json(...) call.
 *
 * A regex cannot do this: the response body is an object literal that
 * contains its own braces, parentheses and commas. An earlier version of
 * this test used one, matched nothing, and passed while the leak it was
 * meant to catch was still present - so it walks the call with a depth
 * counter instead.
 */
function responseBodies(contents: string): string[] {
  const bodies: string[] = [];
  const CALL = "NextResponse.json(";

  for (let i = contents.indexOf(CALL); i !== -1; i = contents.indexOf(CALL, i + 1)) {
    let depth = 1;
    let firstArg = "";
    let cursor = i + CALL.length;

    while (cursor < contents.length && depth > 0) {
      const ch = contents[cursor];
      if ("([{".includes(ch)) depth++;
      else if (")]}".includes(ch)) depth--;

      // A comma at depth 1 ends the body and starts the init object.
      if (depth === 1 && ch === "," ) break;
      if (depth > 0) firstArg += ch;
      cursor++;
    }

    bodies.push(firstArg);
  }

  return bodies;
}

test("L3: no API route returns a raw database error message", () => {
  const offenders: string[] = [];

  for (const file of allSourceFiles) {
    if (!rel(file).startsWith("src/app/api/")) continue;
    if (path.basename(file) !== "route.ts") continue;

    const contents = stripComments(readFileSync(file, "utf8"));

    for (const body of responseBodies(contents)) {
      if (!/\.message\b/.test(body)) continue;
      if (ALLOWED_MESSAGE_ECHOES.some((allowed) => body.includes(allowed))) {
        continue;
      }
      offenders.push(`${rel(file)}: ${body.replace(/\s+/g, " ").slice(0, 80)}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    "these responses relay a database error message to the caller",
  );
});

test("L3: the scanner actually sees a leak when one is present", () => {
  // Guards the guard: the previous version of this check matched nothing.
  const sample = `
    return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      { error: "Could not load club members" },
      { status: 500 },
    );
  `;

  const bodies = responseBodies(sample);
  assert.equal(bodies.length, 2, "both calls should be found");
  assert.ok(
    bodies.some((b) => /\.message\b/.test(b)),
    "the leaking call must be detected",
  );
  assert.ok(
    bodies.some((b) => b.includes("Could not load club members")),
    "the safe call must be read as its own body",
  );
});

/* ================================================================== *
 * L5 - dead checks and inert caching directives on admin pages
 * ================================================================== */

test("L5: the admin user page states its own role check", () => {
  const contents = stripComments(
    read("src/app/(auth)/admin/manage/users/page.tsx"),
  );

  // `if (!userRole)` was never true - getUserRoles always resolves to an
  // object - so the page relied entirely on the layout's gate.
  assert.ok(
    !/if\s*\(!userRole\)/.test(contents),
    "the dead truthiness check must be gone",
  );
  assert.ok(
    /!isAdmin\s*&&\s*!isSuperAdmin/.test(contents),
    "the page must check the actual capability",
  );
});

test("L5: cookie-reading admin pages declare no revalidate", () => {
  for (const file of [
    "src/app/(auth)/admin/manage/users/page.tsx",
    "src/app/(auth)/admin/manage/clubs/page.tsx",
    "src/app/(auth)/admin/manage/posts/page.tsx",
  ]) {
    const contents = stripComments(read(file));
    assert.ok(
      !/export\s+const\s+revalidate/.test(contents),
      `${file} reads cookies, so a revalidate directive is inert and misleading`,
    );
  }
});

/* ================================================================== *
 * L6 - the site origin came from request headers
 * ================================================================== */

test("L6: the origin prefers configuration over request headers", () => {
  const contents = stripComments(read("src/lib/base-url.ts"));

  assert.ok(
    contents.indexOf("NEXT_PUBLIC_BASE_URL") <
      contents.indexOf("x-forwarded-host"),
    "the configured origin must win over the header",
  );
  assert.ok(
    contents.includes("isPlausibleHost"),
    "a header-derived host must be validated before use",
  );
});

test("L6: nothing outside the helper derives an origin from request headers", () => {
  /* This replaced a check against a hardcoded list of two consumers, which
     is precisely why it missed a third: /register/page.tsx was still
     building its own base URL from x-forwarded-proto and x-forwarded-host
     and handing it to the check-in QR codes.

     Scanning the whole tree means a new caller cannot be forgotten - it
     either uses getBaseUrl or fails here. */
  const HOST_HEADERS = [
    "x-forwarded-host",
    "x-forwarded-proto",
  ];

  const offenders = allSourceFiles
    .filter((file) => {
      // The helper is the one place allowed to read them.
      if (rel(file) === "src/lib/base-url.ts") return false;
      const contents = stripComments(readFileSync(file, "utf8"));
      return HOST_HEADERS.some((header) => contents.includes(header));
    })
    .map(rel);

  assert.deepEqual(
    offenders,
    [],
    "these files build an origin from request headers; use getBaseUrl() from " +
      "@/lib/base-url, which prefers the configured origin and validates the host",
  );
});

test("L6: every consumer of a request-derived origin uses the helper", () => {
  // Anything that takes `headers()` and produces something called a base or
  // origin should be going through getBaseUrl.
  const consumers = allSourceFiles.filter((file) => {
    const contents = stripComments(readFileSync(file, "utf8"));
    return /\bbaseUrl\b/.test(contents) && contents.includes("next/headers");
  });

  assert.ok(consumers.length > 0, "sanity: expected some baseUrl consumers");

  for (const file of consumers) {
    const contents = stripComments(readFileSync(file, "utf8"));
    assert.ok(
      contents.includes("getBaseUrl("),
      `${rel(file)} derives a base URL without the shared helper`,
    );
  }
});

/* ================================================================== *
 * L9 - club artwork URLs were stored unvalidated
 * ================================================================== */

test("L9: club logo and banner URLs are validated", () => {
  for (const file of [
    "src/app/api/admin/clubs/create/route.ts",
    "src/app/api/admin/clubs/settings/route.ts",
  ]) {
    const contents = stripComments(read(file));

    assert.ok(
      contents.includes("validateImageUrl("),
      `${file} must validate artwork URLs through the shared validator`,
    );
    assert.ok(
      /if\s*\(!check\.ok/.test(contents),
      `${file} must reject an invalid URL`,
    );
  }
});

/* ================================================================== *
 * L10 - rate-limit keys came straight from request headers
 * ================================================================== */

test("L10: only well-formed addresses become rate-limit keys", () => {
  const contents = stripComments(read("src/lib/rate-limit.ts"));

  assert.ok(
    contents.includes("isIpAddress("),
    "header values must be validated before becoming a counter key",
  );
  assert.ok(
    contents.indexOf("x-vercel-forwarded-for") <
      contents.indexOf("x-forwarded-for"),
    "the platform header, which cannot be spoofed, must be preferred",
  );
});
