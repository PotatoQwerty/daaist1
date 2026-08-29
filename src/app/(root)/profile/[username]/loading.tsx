import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the real profile layout block for block, so nothing jumps when
 * the data lands. The previous skeleton described a layout the page no
 * longer had.
 */
export default function Loading() {
  const cards = Array.from({ length: 4 });

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <header className="rule-b flex flex-col gap-8 pb-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-28 shrink-0 rounded-full" />

          <div className="w-full max-w-md">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-2 h-3 w-28" />

            <div className="mt-4 flex gap-2">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            <Skeleton className="mt-6 h-16 w-full" />
          </div>
        </div>

        <div className="flex gap-10 md:shrink-0">
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-8 w-10" />
          </div>
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-8 w-10" />
          </div>
        </div>
      </header>

      <section className="mt-14">
        <Skeleton className="h-7 w-24" />
        <div className="mt-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={`club-${i}`}
              className="rule-t flex items-baseline justify-between py-4"
            >
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
          <div className="rule-t" />
        </div>
      </section>

      {["uploads", "favorites"].map((section) => (
        <section key={section} className="mt-14">
          <Skeleton className="h-7 w-32" />
          <div className="mt-5 flex gap-4 overflow-hidden">
            {cards.map((_, i) => (
              <div
                key={`${section}-${i}`}
                className="w-64 shrink-0 overflow-hidden rounded-lg border border-border"
              >
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-2 h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
