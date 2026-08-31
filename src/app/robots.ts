import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * Crawler guidance. Not access control.
 *
 * Every path below is already enforced server-side - a signed-out request to
 * /courses gets the sign-in gate, /admin/* returns a 404, /api/* checks the
 * session per route. This file only keeps well-behaved crawlers off pages
 * that would waste their time and ours.
 *
 * A note on the interaction with noindex, because the two pull in opposite
 * directions: Disallow stops a crawler fetching the page, which also stops
 * it seeing the noindex tag, so a disallowed URL can still be indexed
 * URL-only if something links to it. Both are applied anyway - Disallow for
 * crawl budget, noindex for the crawlers that ignore this file or arrive by
 * a link. For these routes that is the right trade: none of them render
 * anything to an anonymous crawler in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Privileged.
          "/admin/",
          // Session-gated content.
          "/courses/",
          "/docs/",
          "/upload/",
          "/onboarding/",
          // The URL is a username, and the page requires a session.
          "/profile/",
          // Renders the visitor's own event passes, check-in tokens included.
          "/register/",
          // The URL carries a live single-use invite token.
          "/invite/",
          // Organiser-only, and takes a check-in token as a query parameter.
          // Kept narrow so the public /events/<slug> pages stay crawlable.
          "/events/*/check-in",
          // Not pages.
          "/api/",
          "/auth/",
          // Placeholder with no content yet.
          "/projects",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
