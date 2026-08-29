import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches the shape of ClubCard exactly, so the layout does not shift
 * when real data arrives.
 */
function ClubCardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="h-36 w-full rounded-none" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        <Skeleton className="mt-5 h-4 w-24" />
      </div>
    </div>
  );
}

export default ClubCardSkeleton;
