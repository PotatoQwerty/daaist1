"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  MapPin,
  QrCode,
} from "lucide-react";
import bannerFallback from "../../public/images/banner.jpg";
import { formatEventDateRange } from "@/lib/event-date";
import { getEventPath, getRegisterEventPath } from "@/lib/event-path";
import CheckInQRCode from "./CheckInQRCode";
import { Button } from "./ui/button";

type EventPassItem = {
  id: string;
  event_id: string;
  registration_number: string;
  created_at?: string | null;
  checked_in_at?: string | null;
  check_in_method?: string | null;
  check_in_token?: string | null;
  attendance_role?: string | null;
  attendance_role_label?: string | null;
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    cover_image?: string | null;
    square_image?: string | null;
    is_public?: boolean | null;
  };
};

type MyEventPassesProps = {
  baseUrl: string;
  passes: EventPassItem[];
};

export default function MyEventPasses({
  baseUrl,
  passes,
}: MyEventPassesProps) {
  const [expandedPassId, setExpandedPassId] = useState<string | null>(
    passes[0]?.check_in_token ? passes[0].id : null,
  );

  const summary = useMemo(() => {
    return passes.reduce(
      (accumulator, pass) => {
        if (pass.checked_in_at) {
          accumulator.checkedIn += 1;
        } else {
          accumulator.ready += 1;
        }

        return accumulator;
      },
      { checkedIn: 0, ready: 0 },
    );
  }, [passes]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            My Event Passes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Reopen your saved QR codes
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            Signed-in registrations stay here so you can quickly reopen your
            access pass, copy the backup link, or jump back to the event form.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-auto">
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Ready
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.ready}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Checked In
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.checkedIn}</p>
          </div>
        </div>
      </div>

      {passes.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-12">
          <h3 className="text-xl font-bold">No saved passes yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Once you register for a public event while signed in, your QR access
            pass will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {passes.map((pass) => {
            const isExpanded = expandedPassId === pass.id;
            const passIsReady = Boolean(pass.check_in_token);
            const eventDate = formatEventDateRange(
              pass.event.start_date,
              pass.event.end_date,
            );

            return (
              <article
                key={pass.id}
                className="overflow-hidden rounded-[2rem] border border-border bg-card"
              >
                <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                  <div className="relative min-h-[220px]">
                    <Image
                      src={
                        pass.event.square_image ||
                        pass.event.cover_image ||
                        bannerFallback
                      }
                      alt={`${pass.event.title} pass art`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 280px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-primary-foreground backdrop-blur-sm">
                        Pass saved
                      </span>
                      {pass.checked_in_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                          <CheckCircle2 className="h-3 w-3" />
                          Checked in
                        </span>
                      ) : (
                        <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                          Ready to scan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight">
                            {pass.event.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {pass.event.description?.trim() ||
                              "Your saved registration pass is ready to reopen whenever you need it."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          {pass.attendance_role_label ? (
                            <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-muted-foreground">
                              {pass.attendance_role_label}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-muted-foreground">
                            Reg #{pass.registration_number}
                          </span>
                          {pass.check_in_token ? (
                            <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-muted-foreground">
                              Pass #{pass.check_in_token.slice(0, 8)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isExpanded ? "secondary" : "outline"}
                        className="h-11 rounded-xl px-5"
                        onClick={() =>
                          setExpandedPassId((current) =>
                            current === pass.id ? null : pass.id,
                          )
                        }
                        disabled={!passIsReady}
                      >
                        <QrCode className="h-4 w-4" />
                        {isExpanded ? "Hide QR code" : "Show QR code"}
                        <ChevronDown
                          className={`h-4 w-4 transition ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {eventDate}
                        </p>
                        <p className="mt-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          {pass.event.location?.trim() || "Location to be announced"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                        <p>
                          Saved{" "}
                          {pass.created_at
                            ? new Date(pass.created_at).toLocaleString()
                            : "recently"}
                        </p>
                        {pass.checked_in_at ? (
                          <p className="mt-3">
                            Checked in{" "}
                            {new Date(pass.checked_in_at).toLocaleString()} via{" "}
                            {pass.check_in_method || "manual"}
                          </p>
                        ) : (
                          <p className="mt-3">
                            Keep this pass handy for fast organizer scanning at the
                            door.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                        <Link href={getRegisterEventPath(pass.event)}>
                          Open registration page
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="h-11 rounded-xl px-5">
                        <Link href={getEventPath(pass.event)}>Open event page</Link>
                      </Button>
                    </div>

                    {isExpanded && pass.check_in_token ? (
                      <CheckInQRCode
                        baseUrl={baseUrl}
                        eventId={pass.event.id}
                        eventTitle={pass.event.title}
                        checkInToken={pass.check_in_token}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
