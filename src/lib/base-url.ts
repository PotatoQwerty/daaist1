import "server-only";

/**
 * The site's own origin.
 *
 * Two places needed this and each did it differently. The event register
 * page built it from `x-forwarded-proto` + `x-forwarded-host`, both of which
 * are request headers; the invite route used
 * `process.env.NEXT_PUBLIC_BASE_URL ?? ""`, and that variable is not set, so
 * invite links came out as bare paths with no origin.
 *
 * A browser sets Host itself, so header spoofing is not reachable from an
 * ordinary victim - but the value ends up inside a QR code that a person
 * scans and an invite link that a person clicks, so it should not be
 * attacker-influenced at all when a configured value exists.
 *
 * Order: the configured origin, then the request headers, then nothing.
 * Returning "" rather than guessing is deliberate - a wrong absolute URL is
 * worse than a relative one.
 */

/** Hosts the request headers may name. Empty means "trust the header". */
function configuredOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // Normalised, so a trailing slash in the env var cannot produce "//".
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** A host header is only usable if it looks like one. */
function isPlausibleHost(host: string): boolean {
  return /^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(host) && host.length <= 255;
}

export type HeaderLike = { get(name: string): string | null };

export function getBaseUrl(headerList: HeaderLike): string {
  const configured = configuredOrigin();
  if (configured) return configured;

  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  if (!host || !isPlausibleHost(host)) return "";

  const forwardedProto = headerList.get("x-forwarded-proto") || "";
  // Only these two are meaningful here, and a header carrying a list
  // ("https,http") or anything else falls back rather than being echoed.
  const protocol = forwardedProto === "http" ? "http" : "https";

  return `${protocol}://${host}`;
}
