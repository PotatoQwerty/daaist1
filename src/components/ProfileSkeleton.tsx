import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary to-[#f3f3f3] flex flex-col items-center px-6 py-10">
      {/* Header Skeleton */}
      <div className="relative w-full max-w-5xl bg-background shadow-lg rounded-3xl p-10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-start md:gap-10 w-full">
          {/* Profile Image */}
          <Skeleton className="w-36 h-36 rounded-full shrink-0" />

          {/* User Info */}
          <div className="flex flex-col items-center md:items-start space-y-4 w-full">
            <div className="space-y-2 w-full flex flex-col items-center md:items-start">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="mt-3 w-full max-w-sm space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>

      {/* Sections Skeleton */}
      <div className="w-full max-w-5xl space-y-10">
        {[1, 2].map((i) => (
          <section key={i} className="w-full">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
