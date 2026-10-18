/**
 * Serialise a JSON-LD payload for injection into a <script> tag.
 *
 * Kept apart from the component so it is a plain module with no JSX: the
 * escaping is the security-relevant half and it deserves direct tests.
 *
 * JSON-LD has to be injected rather than rendered as a React child, because
 * React escapes text children as HTML entities and would turn a `<` inside
 * any string value into `&lt;`, corrupting the JSON. Injection is only safe
 * if nothing in the output can be read as markup, which is what this does:
 *
 *   - JSON.stringify can only emit `<`, `>` or `&` inside a string value,
 *     and all three are rewritten to their JSON unicode escape afterwards,
 *     so a club named `</script><script>...` serialises to text no parser
 *     sees as a tag while still parsing back to the identical string.
 *   - a value that cannot be serialised returns "", so the caller renders
 *     nothing rather than half a document.
 */
export function serializeJsonLd(data: unknown): string {
  let json: string;

  try {
    json = JSON.stringify(data);
  } catch {
    // Circular structures, BigInt, and anything else JSON cannot express.
    return "";
  }

  if (!json) return "";

  /*
   * The replacements are escaped twice on purpose.
   *
   * "\\u003c" in this source is the six-character text <, which is
   * what JSON reads back as "<". Writing "<" instead would compile to
   * the character "<" and make every replace below a silent no-op - which
   * is exactly the bug the escaping test in tests/seo.test.ts caught.
   */
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
