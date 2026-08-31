import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/**
 * Teach the Node test runner the "@/" path alias.
 *
 * tsconfig maps "@/*" to "./src/*" and the bundler honours it, but Node's
 * ESM resolver does not - so importing an application module under test
 * fails on the first aliased import it hits.
 *
 * The alternative was to rewrite app source to use relative paths with
 * explicit .ts extensions purely to suit the tests, which would make the
 * application code worse to serve the test setup. This keeps the alias in
 * the source and teaches the runner instead, and means any module can be
 * tested directly rather than only the ones that happen to have no imports.
 *
 * Loaded via `node --import ./tests/alias-hook.mjs`.
 */
const SRC = path.resolve(import.meta.dirname, "..", "src");

/** Node needs a real file; TypeScript specifiers omit the extension. */
function resolveSourceFile(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

/**
 * Modules that only make sense inside the Next bundle.
 *
 * `server-only` deliberately throws unless it is resolved under the
 * "react-server" condition, which is how it turns a client import into a
 * build error. The test runner is neither a client nor a server bundle, so
 * it resolves to the throwing copy and takes down any module that imports
 * it. Stubbing it keeps that guarantee intact where it matters - the real
 * build still enforces it, and `tests/security-invariants.test.ts` asserts
 * the import is present - while letting the module be unit tested.
 */
const STUBBED = new Map([
  ["server-only", "export {};"],
  /**
   * `next/server` is a conditional subpath export that only resolves under
   * the bundler's conditions. The stub is faithful rather than hollow:
   * NextResponse.json delegates to the platform Response, so status codes
   * and headers behave exactly as they do in the app and assertions about
   * them stay meaningful.
   */
  [
    "next/server",
    `export class NextResponse extends Response {
       static json(body, init) { return Response.json(body, init); }
     }`,
  ],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (STUBBED.has(specifier)) {
      return {
        url: `data:text/javascript,${encodeURIComponent(STUBBED.get(specifier))}`,
        shortCircuit: true,
      };
    }

    if (specifier.startsWith("@/")) {
      const resolved = resolveSourceFile(path.join(SRC, specifier.slice(2)));
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});
