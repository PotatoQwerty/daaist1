"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared scroll row for the profile shelves.
 *
 * The arrow buttons previously lived *inside* the scrolling element, so
 * they slid out of view along with the cards. They are siblings of the
 * track now, and they are hidden on touch widths where swiping is the
 * natural gesture.
 */
export default function HorizontalScroller({
  children,
  label,
}: {
  children: ReactNode;
  /** Names the row for screen readers, e.g. "Uploads". */
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.offsetWidth * 0.8;
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {children}
      </div>

      <div className="mt-4 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          aria-label={`Scroll ${label} left`}
          onClick={() => scroll("left")}
          className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={`Scroll ${label} right`}
          onClick={() => scroll("right")}
          className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
        >
          <ChevronRight className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
