import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_SEARCH_LENGTH,
  buildIlikeOrFilter,
  sanitizeSearchTerm,
} from "../src/lib/search-filter.ts";

const COLUMNS = ["first_name", "last_name", "email"] as const;

/* ------------------------------------------------------------------ *
 * L1 - PostgREST filter injection in the participant search
 *
 * The old sanitizer stripped %, _ and , which covers the ilike wildcards
 * and the condition separator, but left ( ) . and : - all structural in
 * the same grammar.
 * ------------------------------------------------------------------ */

test("L1: characters that are structural to PostgREST cannot survive", () => {
  // Each of these can terminate or redirect the or=(...) group.
  for (const structural of ["(", ")", ",", ":", "%", "_", "*", "\\", '"']) {
    const term = sanitizeSearchTerm(`a${structural}b`);
    assert.ok(
      !term.includes(structural),
      `${structural} must not survive sanitizing (got ${JSON.stringify(term)})`,
    );
  }
});

test("L1: a filter built from hostile input contains no injected syntax", () => {
  const hostile = [
    "x),or=(id.eq.1",
    "%,or(email.ilike.%",
    "a.ilike.b",
    "');DROP TABLE users;--",
    "*)(uid=*",
  ];

  for (const attempt of hostile) {
    const filter = buildIlikeOrFilter(COLUMNS, attempt);
    if (filter === null) continue;

    // Exactly one condition per column, and nothing else.
    const conditions = filter.split(",");
    assert.equal(
      conditions.length,
      COLUMNS.length,
      `"${attempt}" produced ${conditions.length} conditions`,
    );

    for (const condition of conditions) {
      assert.match(
        condition,
        /^(first_name|last_name|email)\.ilike\.%[^%,():\\]*%$/,
        `condition "${condition}" is not a plain ilike on an expected column`,
      );
    }
  }
});

test("L1: ordinary searches still work", () => {
  // Names, emails and matricules must remain searchable, including the
  // accented characters normal for a French-language school.
  for (const term of [
    "Zaki",
    "Ben Ali",
    "Amélie",
    "Déjà",
    "zaki@example.com",
    "20230012",
    "O'Brien",
    "Ben-Ali",
  ]) {
    const cleaned = sanitizeSearchTerm(term);
    assert.equal(cleaned, term, `${term} should pass through unchanged`);
    assert.ok(buildIlikeOrFilter(COLUMNS, term));
  }
});

test("L1: whitespace is collapsed and length is bounded", () => {
  assert.equal(sanitizeSearchTerm("  Ben   Ali  "), "Ben Ali");
  assert.equal(sanitizeSearchTerm("x".repeat(500)).length, MAX_SEARCH_LENGTH);
});

test("L1: nothing usable means no filter, not a match-everything filter", () => {
  for (const empty of ["", "   ", "%%%", "((()))", null, undefined, 42]) {
    assert.equal(
      buildIlikeOrFilter(COLUMNS, empty),
      null,
      `${JSON.stringify(empty)} must produce no filter`,
    );
  }
});

test("L1: a dot is allowed in the value but cannot start a new condition", () => {
  // Dots are needed for email search. Without a comma they cannot introduce
  // a second condition, and the comma is stripped.
  const filter = buildIlikeOrFilter(["email"], "a.ilike.b,id.eq.1");
  // The comma becomes a space, so the two fragments stay separated rather
  // than fusing into one token.
  assert.equal(filter, "email.ilike.%a.ilike.b id.eq.1%");
  assert.equal(filter!.split(",").length, 1, "still exactly one condition");
});

test("L1: the helper sanitizes on the way in", () => {
  // Callers cannot forget the sanitizing step by passing a raw value,
  // because the helper does it rather than trusting its argument.
  const filter = buildIlikeOrFilter(["email"], "a)b");
  assert.equal(filter, "email.ilike.%a b%");
});
