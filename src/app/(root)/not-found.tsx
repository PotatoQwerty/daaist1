import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[1400px] items-center px-4 py-16 sm:px-6">
      <div className="max-w-xl">
        <p className="font-mono text-sm text-muted-foreground tabular-nums">
          404
        </p>
        <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">
          That page isn&apos;t here.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          The link may be out of date, or the file may have been removed. The
          course archive and the club listings are both still where you left
          them.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Back to home
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
          >
            Browse courses
          </Link>
        </div>
      </div>
    </main>
  );
}
