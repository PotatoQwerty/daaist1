import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import EventCheckInClient from "@/components/EventCheckInClient";
import SignInButton from "@/components/SignInButton";
import {
  getClubById,
  getEventByEventId,
  getUserClubRole,
} from "@/lib/supabase/actions";
import {
  getEventCheckInPath,
  getEventPath,
  getEventSlug,
} from "@/lib/event-path";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { NOINDEX } from "@/lib/site";

/**
 * Organiser-only, and the URL carries a check-in token.
 *
 * Set on the page rather than a layout: the only layout above it also
 * wraps /events/[eventId], which is public and indexed.
 */
export const metadata: Metadata = {
  title: "Event check-in",
  robots: NOINDEX,
};

type EventCheckInPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EventCheckInPage({
  params,
  searchParams,
}: EventCheckInPageProps) {
  const { eventId } = await params;
  const { token } = await searchParams;
  const event = await getEventByEventId(eventId);

  if (!event) {
    return (
      <section className="min-h-[100dvh] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <h1 className="text-3xl font-bold">Event not found</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This event could not be found.
          </p>
        </div>
      </section>
    );
  }

  if (decodeURIComponent(eventId) !== getEventSlug(event.title)) {
    redirect(getEventCheckInPath(event, token));
  }

  const club = event.club_id ? await getClubById(event.club_id) : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = event
    ? getEventCheckInPath(event, token)
    : `/events/${eventId}/check-in${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  if (!user) {
    return (
      <section className="min-h-[100dvh] bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">
            Organizer sign-in required
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Sign in with an authorized club account to open the check-in desk
            for {event.title}.
          </p>
          <div className="mt-6 flex justify-center">
            <SignInButton
              redirectTo={redirectTo}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Sign in to continue
            </SignInButton>
          </div>
        </div>
      </section>
    );
  }

  const role = event.club_id
    ? await getUserClubRole(user.id, event.club_id)
    : null;
  const canManageEvents =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";

  if (!canManageEvents) {
    return (
      <section className="min-h-[100dvh] bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-3xl font-bold">Access restricted</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            You do not have permission to manage check-ins for this event.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[100dvh] bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={club?.slug ? `/club/${club.slug}` : getEventPath(event)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-[0_20px_80px_-40px_rgba(10,25,47,0.35)] sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="annot">
                Organizer Check-In Desk
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {event.title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Scan attendee passes with your phone camera or search the
                registration list manually.
              </p>
            </div>

            {club?.name && (
              <div className="rounded-lg bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                Hosted by{" "}
                <span className="font-semibold text-foreground">
                  {club.name}
                </span>
              </div>
            )}
          </div>

          <EventCheckInClient
            eventId={event.id}
            eventTitle={event.title}
            initialToken={token}
          />
        </div>
      </div>
    </section>
  );
}
