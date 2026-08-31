import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import bannerFallback from "../../../../public/images/banner.jpg";
import MyEventPasses from "@/components/MyEventPasses";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { formatEventDate } from "@/lib/event-date";
import { getRegisterEventPath } from "@/lib/event-path";
import { getPublicEvents, getUserEventPasses } from "@/lib/supabase/actions";
import { getBaseUrl } from "@/lib/base-url";
import { getUserContext } from "@/lib/supabase/user-context";

export const revalidate = 30;

export async function generateMetadata() {
  return {
    title: "Event registration",
    description:
      "Public DAA events open for registration, and the passes you already hold.",
  };
}

async function RegisterPage() {
  const userContext = await getUserContext();
  const events = await getPublicEvents();
  // Same helper as /register/[eventId] and the invite route: the configured
  // origin wins over the request headers, and a malformed host is refused
  // rather than echoed. This value reaches MyEventPasses, which builds the
  // check-in QR codes from it.
  const baseUrl = getBaseUrl(await headers());
  const passes = userContext.session?.user?.id
    ? await getUserEventPasses({
        userId: userContext.session.user.id,
        email: userContext.session.user.email,
        registrationNumber: userContext.user?.registration_number,
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader
        title="Events open for registration"
        lede="Pick an event to open its form. Signed in, most of it fills itself."
        domain="clubs"
        meta={`${events.length} ${events.length === 1 ? "event" : "events"}`}
      />

      {userContext.session?.user?.id ? (
        <div className="mt-12">
          <MyEventPasses baseUrl={baseUrl} passes={passes} />
        </div>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">All events</h2>
          <Link
            href="/club"
            className="text-sm font-bold text-primary transition-colors hover:text-foreground"
          >
            See clubs
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-16 text-center">
            <h3 className="text-xl font-bold">Nothing open right now</h3>
            <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
              When a club marks an event public, it appears here with its own
              registration form.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, i) => (
              <Reveal
                as="article"
                key={event.id}
                delay={i * 60}
                className="h-full"
              >
                <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-domain-clubs">
                  <div className="relative h-44 overflow-hidden border-b border-border">
                    <Image
                      src={event.cover_image || bannerFallback}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl leading-snug font-bold">
                      {event.title}
                    </h3>

                    <p className="annot mt-3 flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          className="size-3.5"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        {formatEventDate(event.start_date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          className="size-3.5 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        {event.location?.trim() || "Location to be announced"}
                      </span>
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {event.description?.trim() ||
                        "Open the form for the full details."}
                    </p>

                    <Link
                      href={getRegisterEventPath(event)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
                    >
                      Register
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default RegisterPage;
