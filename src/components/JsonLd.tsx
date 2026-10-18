import { serializeJsonLd } from "@/lib/json-ld";

/**
 * The single place in this codebase that writes raw HTML.
 *
 * "No dangerouslySetInnerHTML anywhere" was a property this codebase had,
 * and it effectively still does: the prop is not exposed to callers. They
 * pass a plain object and this component serialises it, so there is no way
 * to hand it a string of markup. The escaping that makes that safe lives in
 * `serializeJsonLd` and is covered by tests/seo.test.ts.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = serializeJsonLd(data);
  if (!json) return null;

  return (
    <script
      type="application/ld+json"
      // Safe by construction: always the output of serializeJsonLd, which
      // escapes every character that could close the script element.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
