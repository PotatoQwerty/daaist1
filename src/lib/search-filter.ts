/**
 * Building a PostgREST `or=(...)` filter from user input.
 *
 * The participant search interpolated the query straight into
 *
 *     first_name.ilike.%<term>%,last_name.ilike.%<term>%,...
 *
 * and defended it by stripping `%`, `_` and `,`. That covers the ilike
 * wildcards and the condition separator, but not `(`, `)`, `.` or `:`,
 * which are all structural in the same grammar - a `)` closes the group
 * early and the rest of the filter is reparsed as something else.
 *
 * Blocklisting a grammar is the wrong shape of defence. These fields hold
 * names, emails, phone numbers, universities, study years and matricules,
 * so the set of characters that can legitimately appear is small and known.
 * Anything outside it is dropped.
 */

/**
 * Characters allowed in a search term.
 *
 * Includes Latin-1 accented letters: this is a French-language school and
 * "Amélie" has to be searchable.
 *
 * `.` and `@` are allowed on purpose, because the search covers the `email`
 * column and dropping them would break searching by address. That is safe
 * here: PostgREST splits a condition as `column.operator.value` on the first
 * two dots only, so further dots are literal. What makes a dot dangerous is
 * a `,` to start a new condition or a `)` to close the group early, and
 * both of those are removed.
 *
 * Excluded: , ( ) : % _ * \ " and everything else - the separators, the
 * group delimiters, and the two ilike wildcards.
 */
const SEARCH_ALLOWED = /[^A-Za-z0-9À-ɏ@.'\- ]+/g;

/** Long enough for any real name or email, short enough to bound the filter. */
export const MAX_SEARCH_LENGTH = 80;

/**
 * Reduce a raw query parameter to something safe to interpolate.
 *
 * Returns "" when nothing usable survives, which callers treat as "no
 * search" rather than as a filter that matches everything.
 */
export function sanitizeSearchTerm(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFC")
    .replace(SEARCH_ALLOWED, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .trim();
}

/**
 * Build the `or=(...)` argument for a set of columns.
 *
 * The term is sanitized here rather than trusted from the caller, so there
 * is no way to use this helper and forget the sanitizing step.
 */
export function buildIlikeOrFilter(
  columns: readonly string[],
  rawTerm: unknown,
): string | null {
  const term = sanitizeSearchTerm(rawTerm);
  if (!term) return null;

  return columns.map((column) => `${column}.ilike.%${term}%`).join(",");
}
