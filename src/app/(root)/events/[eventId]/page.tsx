import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  ArrowLeft,
  ArrowRight,
  QrCode,
} from "lucide-react";
import bannerFallback from "../../../../../public/images/banner.jpg";
import {
  getClubById,
  getPublicEventById,
  getUserEventPasses,
  getUserClubRole,
} from "@/lib/supabase/actions";
import { formatEventDateRange } from "@/lib/event-date";
import {
  getEventCheckInPath,
  getEventPath,
  getEventSlug,
  getRegisterEventPath,
} from "@/lib/event-path";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/user-context";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export const revalidate = 30;

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getPublicEventById(eventId);

  if (!event) {
    return {
      title: "Event Not Found - Daa'ist",
    };
  }

  return {
    title: `${event.title} - Daa'ist`,
    description:
      event.description ||
      `View the details for ${event.title} and open the registration form.`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const event = await getPublicEventById(eventId);

  if (!event) {
    return (
      <section className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-4xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h1 className="text-3xl font-bold">Event not found</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This public event is no longer available or the link is invalid.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Browse public events
          </Link>
        </div>
      </section>
    );
  }

  if (decodeURIComponent(eventId) !== getEventSlug(event.title)) {
    redirect(getEventPath(event));
  }

  const club = event.club_id ? await getClubById(event.club_id) : null;
  const eventDate = formatEventDateRange(event.start_date, event.end_date);
  const userContext = await getUserContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role =
    user?.id && event.club_id
      ? await getUserClubRole(user.id, event.club_id)
      : null;
  const canManageCheckIns =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";
  const userPasses = userContext.session?.user?.id
    ? await getUserEventPasses({
        userId: userContext.session.user.id,
        email: userContext.session.user.email,
        registrationNumber: userContext.user?.registration_number,
      })
    : [];
  const existingPass = userPasses.find((pass) => pass.event_id === event.id);
  const registerCtaLabel = existingPass ? "View event pass" : "Register now";
  const registerPanelTitle = existingPass ? "Your pass is ready" : "Ready to join?";
  const registerPanelCopy = existingPass
    ? "You are already registered for this event. Open your event pass to review the QR code and check-in backup details."
    : "Open the dedicated registration page for this event and submit your details in one step.";
  const registerPanelButtonLabel = existingPass
    ? "Open event pass"
    : "Go to registration";

  return (
    <section className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/club"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {canManageCheckIns && (
              <Link
                href={getEventCheckInPath(event)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Organizer check-in
                <QrCode className="h-4 w-4" />
              </Link>
            )}
            <Link
              href={getRegisterEventPath(event)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              {registerCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-4xl border border-border bg-card shadow-[0_24px_90px_-45px_rgba(10,25,47,0.55)]">
          <div className="relative min-h-[360px] overflow-hidden sm:min-h-[420px]">
            <Image
              src={event.cover_image || bannerFallback}
              alt={`${event.title} banner`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary/95 via-primary/75 to-accent/60" />
            <div className="absolute -left-8 top-8 h-28 w-28 rounded-full border border-white/25 bg-secondary/70 blur-sm" />
            <div className="absolute bottom-6 right-6 h-32 w-32 rounded-4xl border border-white/20 bg-white/10 backdrop-blur-sm" />
            {event.square_image && (
              <div className="absolute right-6 top-6 h-28 w-28 overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm">
                <Image
                  src={event.square_image}
                  alt={`${event.title} square cover`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="relative flex h-full flex-col justify-end p-6 text-primary-foreground sm:p-10">
              <div className="max-w-4xl space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em]">
                    Public Event
                  </span>
                  {club?.name && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold">
                      {club.name}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    {event.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                    {event.description?.trim() ||
                      "Open the registration form to save your place and auto-fill your details if you are signed in."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  About This Event
                </p>
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                  {event.description?.trim() ||
                    "This event is now live on Daa'ist. Use the register button to open the dedicated registration form with the event banner and autofill support."}
                </p>
              </div>

              {club?.slug && (
                <div className="rounded-3xl border border-border bg-muted/35 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Hosted by
                  </p>
                  <h2 className="mt-3 text-2xl font-bold">{club.name}</h2>
                  <Link
                    href={`/club/${club.slug}`}
                    className="mt-4 inline-flex text-sm font-semibold text-primary transition hover:text-accent"
                  >
                    View club
                  </Link>
                </div>
              )}
            </div>

            <aside className="space-y-4 rounded-3xl border border-border bg-background p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Event Snapshot
              </p>

              <div className="rounded-2xl bg-muted/45 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Schedule
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {eventDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/45 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-accent/10 p-2 text-accent">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Location
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {event.location?.trim() || "Location to be announced"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-lg font-bold">{registerPanelTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {registerPanelCopy}
                </p>
                <Link
                  href={getRegisterEventPath(event)}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  {registerPanelButtonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {canManageCheckIns && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-lg font-bold">Organizer access</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    You can open the check-in desk for this event and scan
                    attendee passes or search the registration list manually.
                  </p>
                  <Link
                    href={getEventCheckInPath(event)}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    Open check-in desk
                    <QrCode className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
