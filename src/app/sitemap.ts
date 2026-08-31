import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { getEventSlug } from "@/lib/event-path";
import { absoluteUrl } from "@/lib/site";

/**
 * The sitemap lists only pages a signed-out visitor can actually read.
 *
 * Deliberately excluded, and why:
 *
 *   /courses, /courses/*, /docs   gated behind AccessGate; a crawler sees
 *                                 the sign-in prompt, never the archive
 *   /profile, /profile/*          requires a session, and the URL itself is
 *                                 a username
 *   /admin/*                      privileged
 *   /invite/*                     the URL contains a live single-use token
 *   /register, /register/[id]      renders the visitor's own event passes,
 *                                 including check-in tokens, when signed in
 *   the event check-in pages       organiser-only, and take a token
 *   /upload                       requires the upload capability
 *   /onboarding                   account setup
 *   /projects                     a placeholder page with no content yet
 *   /api/*, /auth/*               not pages
 *
 * Nothing here is derived from a user record, so no username, registration
 * number, account id or token can reach the output.
 */

/** Revalidated daily; events and clubs do not change minute to minute. */
export const revalidate = 86_400;

type SitemapEntry = MetadataRoute.Sitemap[number];

/** Only these paths are public and worth indexing. */
const STATIC_ROUTES: SitemapEntry[] = [
  {
    url: absoluteUrl("/"),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: absoluteUrl("/club"),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: absoluteUrl("/tools"),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: absoluteUrl("/privacy"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: absoluteUrl("/terms"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

/** A row's timestamp, when it is usable. Never a fabricated date. */
function lastModified(value: unknown): Date | undefined {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Active clubs.
 *
 * `is_active` is the closest thing this schema has to a draft flag - the
 * club settings form exposes it as a toggle - so an inactive club is left
 * out rather than advertised.
 */
async function clubRoutes(): Promise<SitemapEntry[]> {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("clubs")
    // Only what a URL and a date need.
    .select("slug, created_at")
    .eq("is_active", true);

  if (error) {
    console.error("Sitemap: club fetch failed", error);
    return [];
  }

  return (data ?? [])
    .filter((club): club is { slug: string; created_at: string } =>
      Boolean(club?.slug),
    )
    .map((club) => ({
      url: absoluteUrl(`/club/${club.slug}`),
      lastModified: lastModified(club.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
}

/**
 * Public events.
 *
 * `is_public` is the same flag /events/[eventId] itself filters on, so this
 * cannot advertise a page that would 404 for a signed-out visitor.
 *
 * The public route is a slug derived from the title, not the event id, so
 * no internal UUID appears in the output. Two events sharing a title
 * collapse to one URL - the page resolves such a slug to a single event
 * anyway, so emitting both would list a URL that renders the other one.
 */
async function eventRoutes(): Promise<SitemapEntry[]> {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("title, created_at")
    .eq("is_public", true);

  if (error) {
    console.error("Sitemap: event fetch failed", error);
    return [];
  }

  const bySlug = new Map<string, SitemapEntry>();

  for (const event of data ?? []) {
    if (!event?.title) continue;

    const slug = getEventSlug(event.title);
    // getEventSlug falls back to "event" for a title with no usable
    // characters; that is not a real page, so it is skipped.
    if (!slug || slug === "event" || bySlug.has(slug)) continue;

    bySlug.set(slug, {
      url: absoluteUrl(`/events/${slug}`),
      lastModified: lastModified(event.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return [...bySlug.values()];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A database that is unreachable at build time should cost the dynamic
  // entries, not the whole sitemap.
  const [clubs, events] = await Promise.all([
    clubRoutes().catch((error) => {
      console.error("Sitemap: clubs unavailable", error);
      return [] as SitemapEntry[];
    }),
    eventRoutes().catch((error) => {
      console.error("Sitemap: events unavailable", error);
      return [] as SitemapEntry[];
    }),
  ]);

  return [...STATIC_ROUTES, ...clubs, ...events];
}
