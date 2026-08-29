"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import Reveal from "@/components/Reveal";

type Lens = "courses" | "clubs" | "docs";

type IndexRow = {
  href: string;
  name: string;
  holds: string;
  lens: Lens | null;
  bar: string;
  status?: string;
};

/**
 * The index. Colour is wayfinding, not decoration: each destination takes
 * the colour of the lens it belongs to in the mark above, and Projects
 * takes the mark's black dot because it is not a content domain yet.
 */
const INDEX: IndexRow[] = [
  {
    href: "/courses",
    name: "Courses",
    holds: "Lecture notes, TDs and past exams, filed by year and subject.",
    lens: "courses",
    bar: "bg-domain-courses",
  },
  {
    href: "/docs",
    name: "Documents",
    holds: "Admin paperwork, forms and reference material for the year.",
    lens: "docs",
    bar: "bg-domain-docs",
  },
  {
    href: "/club",
    name: "Clubs",
    holds: "The clubs running at DAA, and the events they have coming up.",
    lens: "clubs",
    bar: "bg-domain-clubs",
  },
  {
    href: "/projects",
    name: "Projects",
    holds: "Studio work from across the years.",
    lens: null,
    bar: "bg-foreground",
    status: "In progress",
  },
];

type HomeViewProps = {
  /** Primary action differs by session: sign in, or go straight to work. */
  primaryAction: ReactNode;
  secondaryAction: ReactNode;
  /** Early-access notice, shown to signed-out visitors only. */
  notice?: ReactNode;
  closing?: ReactNode;
};

export default function HomeView({
  primaryAction,
  secondaryAction,
  notice,
  closing,
}: HomeViewProps) {
  // Drives the lens highlight in the hero. Hovering a destination shows
  // which part of the mark it belongs to, which is how the colour coding
  // on every page below gets taught without a legend.
  const [hovered, setHovered] = useState<Lens | null>(null);

  return (
    <main className="bg-background text-foreground">
      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 pb-20 sm:px-6 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr] md:gap-16">
          <div>
            <h1 className="text-[2.5rem] leading-[1.02] font-bold sm:text-5xl lg:text-6xl">
              Your year&apos;s coursework, in one place.
            </h1>

            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Courses, past exams, studio briefs and documents shared by DAA
              students. Plus the clubs and events running now.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {primaryAction}
              {secondaryAction}
            </div>
          </div>

          {/* The mark at real scale, as the anchor of the composition. */}
          <div className="order-first flex justify-center md:order-none md:justify-end">
            <BrandMark
              active={hovered}
              className="h-auto w-40 text-foreground sm:w-52 md:w-full md:max-w-[300px]"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Index ---------------- */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-6">
        <h2 className="annot">Sections</h2>

        <ul className="mt-5">
          {INDEX.map((row, i) => (
            <Reveal as="li" key={row.href} delay={i * 60}>
              <Link
                href={row.href}
                prefetch={false}
                onMouseEnter={() => setHovered(row.lens)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(row.lens)}
                onBlur={() => setHovered(null)}
                className="rule-t group flex items-center gap-5 py-6 transition-colors duration-200 hover:bg-subtle sm:gap-8 sm:py-7"
              >
                <span
                  className={`h-12 w-1.5 shrink-0 ${row.bar} transition-transform duration-300 group-hover:scale-y-125`}
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-8">
                  <span className="block text-2xl font-bold sm:w-48 sm:shrink-0 sm:text-3xl">
                    {row.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground sm:mt-0 sm:text-base">
                    {row.holds}
                  </span>
                </div>

                {row.status ? (
                  <span className="annot shrink-0">{row.status}</span>
                ) : (
                  <ArrowRight
                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </Reveal>
          ))}
        </ul>
        <div className="rule-t" />
      </section>

      {/* ---------------- Who runs it ---------------- */}
      <section className="rule-t bg-subtle">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
              <h2 className="max-w-[16ch] text-3xl leading-tight font-bold sm:text-4xl">
                Students file the material. Everyone in the year gets it.
              </h2>

              <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
                <p>
                  Daa&apos;ist collects what students at the Département
                  d&apos;Architecture d&apos;Alger already pass around: lecture
                  notes, corrected exams, studio briefs, the forms nobody can
                  find in week one. It sits in one place, sorted by year and
                  subject, instead of scattered across group chats.
                </p>
                <p>
                  The site is built and run by the Archibénévoles club. Clubs
                  post their own events and handle their own check-in.
                </p>

                {notice}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {closing}
    </main>
  );
}
