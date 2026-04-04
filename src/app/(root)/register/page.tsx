import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import bannerFallback from "../../../../public/images/banner.jpg";
import MyEventPasses from "@/components/MyEventPasses";
import { formatEventDate } from "@/lib/event-date";
import { getRegisterEventPath } from "@/lib/event-path";
import { getPublicEvents, getUserEventPasses } from "@/lib/supabase/actions";
import { getUserContext } from "@/lib/supabase/user-context";

export const revalidate = 30;

export async function generateMetadata() {
  return {
    title: "Event Registration - Daa'ist",
    description:
      "Browse public DAA events and open the matching registration form for each one.",
  };
}

async function RegisterPage() {
  const userContext = await getUserContext();
  const events = await getPublicEvents();
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const passes = userContext.session?.user?.id
    ? await getUserEventPasses({
        userId: userContext.session.user.id,
        email: userContext.session.user.email,
        registrationNumber: userContext.user?.registration_number,
      })
    : [];

  return (
    <section className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-linear-to-br from-primary via-primary/90 to-accent px-6 py-12 text-primary-foreground shadow-[0_24px_90px_-45px_rgba(10,25,47,0.55)] sm:px-10">
          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full border border-white/20 bg-secondary/70 blur-sm" />
          <div className="absolute bottom-0 right-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/75">
                Public Event Forms
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                One reusable registration flow for every event.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                Open any public event, get the right banner and event details up
                top, and let signed-in members breeze through with profile
                autofill.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                How it works
              </p>
              <div className="mt-4 space-y-3 text-sm text-primary-foreground/90">
                <p>Pick an event.</p>
                <p>Review the event banner, schedule, and location.</p>
                <p>Submit your details with autofill if you are signed in.</p>
              </div>
            </div>
          </div>
        </div>

        {userContext.session?.user?.id ? (
          <MyEventPasses baseUrl={baseUrl} passes={passes} />
        ) : null}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Upcoming Forms
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Register by event
            </h2>
          </div>
          <Link
            href="/club"
            className="text-sm font-semibold text-primary transition hover:text-accent"
          >
            Explore clubs
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
            <h3 className="text-2xl font-bold">No public events yet</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Once an event is marked public, it will appear here automatically
              with its own registration page and banner header.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-[1.75rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-[0_20px_70px_-40px_rgba(10,25,47,0.45)]"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={event.cover_image || bannerFallback}
                    alt={`${event.title} banner`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-primary/85 via-primary/30 to-transparent" />
                  {event.square_image && (
                    <div className="absolute right-4 top-4 h-16 w-16 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
                      <Image
                        src={event.square_image}
                        alt={`${event.title} square cover`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary-foreground backdrop-blur-sm">
                      Public Event
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {event.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {event.description?.trim() ||
                        "Open the form to see the full event header and register with your student details."}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatEventDate(event.start_date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      {event.location?.trim() || "Location to be announced"}
                    </p>
                  </div>

                  <Link
                    href={getRegisterEventPath(event)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                  >
                    Open registration
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RegisterPage;
