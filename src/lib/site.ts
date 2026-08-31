/**
 * Canonical identity of the site.
 *
 * Deliberately a constant rather than a request-derived value. `base-url.ts`
 * answers "what origin did this request arrive on", which is right for
 * building a link back to the caller; canonical URLs, sitemap entries and
 * Open Graph tags must be stable no matter which host served the page, or
 * two origins end up competing for the same content.
 */
export const SITE_URL = "https://daaist.com";

export const SITE_NAME = "Daa'ist";

export const SITE_DESCRIPTION =
  "Course material, past exams and documents for architecture students at " +
  "the Département d'Architecture d'Alger, alongside the student clubs and " +
  "the events they run.";

/**
 * The one raster asset in the repository suitable for a social preview.
 *
 * No new image is generated for this: the logos are SVG, which most
 * scrapers will not render, and logo.png is 5.7 MB. See the note in the
 * handover about replacing this with a purpose-built 1200x630 image.
 */
export const OG_IMAGE = {
  url: `${SITE_URL}/images/banner.jpg`,
  width: 8000,
  height: 3000,
  alt: SITE_NAME,
} as const;

/** Absolute URL for a site-relative path, with no doubled or trailing slash. */
export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  // "/" stays as the bare origin so the home canonical is not "https://x.com/".
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.replace(/\/+$/, "")}`;
}

/**
 * Robots directives for anything that is not meant to be indexed.
 *
 * Applied through the highest layout that wraps only private routes, and
 * inline on the private pages whose nearest layout also wraps public ones.
 */
export const NOINDEX = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
} as const;

/**
 * Trim free text down to a description length.
 *
 * Club and event descriptions are author-written and unbounded; a meta
 * description past roughly 160 characters is truncated by search engines
 * anyway, and an unbounded one bloats every page's head.
 */
export function metaDescription(
  text: unknown,
  fallback: string,
  max = 160,
): string {
  if (typeof text !== "string") return fallback;

  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= max) return clean;

  // Cut on a word boundary so the ellipsis does not land mid-word.
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
