import Link from "next/link";

export async function generateMetadata() {
  return {
    title: "Daa'ist - Projects",
    description:
      "Studio work from students at the Département d'Architecture d'Alger. This section is still being built.",
  };
}

export default function ProjectsPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[1400px] items-center px-4 py-16 sm:px-6">
      <div className="max-w-xl">
        <div className="h-1 w-16 bg-foreground" aria-hidden="true" />
        <h1 className="mt-6 text-4xl leading-tight font-bold sm:text-5xl">
          Projects is still being built.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          This is where studio work from across the years will live. Nothing to
          show yet. In the meantime, coursework and past exams are already
          filed under Courses.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Browse courses
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
