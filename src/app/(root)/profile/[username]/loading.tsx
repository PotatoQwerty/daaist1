import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  const uploadSkeletons = Array.from({ length: 4 });
  const favoriteSkeletons = Array.from({ length: 4 });
  const clubSkeletons = Array.from({ length: 2 });

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative flex flex-col gap-8 p-6 md:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Skeleton className="h-36 w-36 rounded-full bg-muted/30" />
              <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 w-full">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-56 rounded bg-muted/30" />
                  <Skeleton className="h-4 w-32 rounded bg-muted/20" />
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Skeleton className="h-6 w-24 rounded-full bg-muted/30" />
                  <Skeleton className="h-6 w-28 rounded-full bg-muted/30" />
                </div>
                <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-xl bg-muted/20" />
                  <Skeleton className="h-14 rounded-xl bg-muted/20" />
                </div>
                <Skeleton className="h-20 w-full max-w-sm rounded-2xl bg-muted/20" />
              </div>
            </div>
            <Skeleton className="hidden lg:block h-24 w-24 rounded-full bg-muted/20" />
          </div>
        </section>

        <section className="w-full">
          <Skeleton className="h-7 w-24 rounded bg-muted/30 mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            {clubSkeletons.map((_, index) => (
              <div
                key={`club-${index}`}
                className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
              >
                <Skeleton className="h-3 w-20 rounded bg-muted/30" />
                <Skeleton className="mt-3 h-5 w-40 rounded bg-muted/20" />
                <Skeleton className="mt-2 h-3 w-24 rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </section>

        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-56 rounded bg-muted/30" />
            <Skeleton className="h-9 w-28 rounded-full bg-muted/20" />
          </div>
          <div className="relative w-full rounded-2xl border border-border/60 bg-card/50 supports-backdrop-filter:bg-card/60 min-h-[350px] flex items-center">
            <div className="flex gap-4 overflow-x-auto py-4 px-6 md:px-16 scrollbar-hide scroll-smooth w-full">
              {uploadSkeletons.map((_, index) => (
                <div
                  key={`upload-${index}`}
                  className="shrink-0 w-64 h-80 rounded-2xl bg-background/70 border border-border/60 p-4"
                >
                  <Skeleton className="h-36 w-full rounded-xl bg-muted/20" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded bg-muted/30" />
                    <Skeleton className="h-3 w-1/2 rounded bg-muted/20" />
                    <Skeleton className="h-9 w-full rounded-xl bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full">
          <Skeleton className="h-7 w-40 rounded bg-muted/30 mb-4" />
          <div className="relative w-full rounded-2xl border border-border/60 bg-card/50 supports-backdrop-filter:bg-card/60 min-h-[350px] flex items-center">
            <div className="flex gap-4 overflow-x-auto py-4 px-6 md:px-16 scrollbar-hide scroll-smooth w-full">
              {favoriteSkeletons.map((_, index) => (
                <div
                  key={`favorite-${index}`}
                  className="shrink-0 w-64 h-[320px] rounded-2xl bg-background/70 border border-border/60 p-4"
                >
                  <Skeleton className="h-40 w-full rounded-xl bg-muted/20" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-5/6 rounded bg-muted/30" />
                    <Skeleton className="h-3 w-1/2 rounded bg-muted/20" />
                    <Skeleton className="h-9 w-full rounded-xl bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
