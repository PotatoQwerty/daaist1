import { yearOptions, subjectOptions } from "@/constants/uploadConstants";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import AccessGate from "@/components/AccessGate";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Daa'ist - Courses by year",
  description:
    "Lecture notes, TDs and past exams for every year at the Département d'Architecture d'Alger, filed by year and subject.",
  alternates: {
    canonical: "https://daaist.com/courses",
  },
};

export default async function Courses() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return <AccessGate what="the course archive" redirectTo="/courses" />;
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader
        title="Courses"
        lede="Lecture notes, TDs and corrected exams, filed by year and by subject."
        domain="courses"
        meta={`${yearOptions.length} years`}
      />

      {/* The years are a real sequence, so they are laid out as a ladder
          and marked with their actual level codes. Listing each year's
          subjects turns the choice into information rather than five
          identical tiles. */}
      <ul className="mt-4">
        {yearOptions.map((year, i) => {
          const subjects = subjectOptions[year.value] ?? [];
          return (
            <Reveal as="li" key={year.value} delay={i * 50}>
              <Link
                href={`/courses/${year.value}`}
                className="rule-t group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-7 transition-colors duration-200 hover:bg-subtle sm:gap-8"
              >
                <span className="font-mono text-2xl font-medium text-domain-courses tabular-nums sm:text-3xl">
                  {year.value}
                </span>

                <div className="min-w-0">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {year.label.replace(` (${year.value})`, "")}
                  </h2>
                  {subjects.length > 0 && (
                    <p className="mt-1.5 truncate text-sm text-muted-foreground">
                      {subjects.map((s) => s.label).join(", ")}
                    </p>
                  )}
                </div>

                <ArrowRight
                  className="size-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          );
        })}
      </ul>
      <div className="rule-t" />
    </main>
  );
}
