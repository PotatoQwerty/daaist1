import { Skeleton } from "@/components/ui/skeleton";

function ClubCardSkeleton() {
  return (
    <div className="bg-chart-5 rounded-lg overflow-hidden flex flex-col min-w-2xs">
      {/* Banner skeleton */}
      <div className="relative h-32">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Avatar skeleton */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <Skeleton className="h-18 w-18 rounded-full ring-4 ring-chart-5" />
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 px-4 pb-4 flex flex-col flex-1 gap-3">
        <Skeleton className="h-5 w-2/3 mx-auto" />

        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        <Skeleton className="mt-auto h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

export default ClubCardSkeleton;
