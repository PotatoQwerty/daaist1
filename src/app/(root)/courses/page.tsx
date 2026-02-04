import { yearOptions } from "@/constants/uploadConstants";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "@/components/SignInButton";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Daa'ist â€” Courses by Year",
  description: "Explore courses, resources, and materials for all academic years.",
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
    return (
      <main className="relative min-h-screen w-full bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-10">
          <div className="w-full rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Courses
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              Access restricted
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need to be signed in to view courses and resources.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <SignInButton className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:brightness-95 transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                Sign in
              </SignInButton>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background/60 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/50 transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Courses
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-linear-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
            Choose your year
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-base text-muted-foreground">
            Browse shared courses, TDs, and past exams by academic year.
          </p>
        </header>

        <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {yearOptions.map((item) => (
            <Link
              key={item.value}
              href={`/courses/${item.value}`}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 transition will-change-transform hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10" />
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Year
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {item.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Explore resources
                  </p>
                </div>

                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/60 text-muted-foreground transition group-hover:text-foreground">
                  <ChevronRight className="size-5" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

