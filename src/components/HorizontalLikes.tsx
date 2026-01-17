import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import FileCard from "./FileCard";
import type { File } from "../types/next-auth";

interface LikesProps {
  likes: File[];
  liked: { id: string }[];
  handleLike: (fileId: string) => void;
  isOwnProfile: boolean;
}

function HorizontalLikes({
  likes,
  liked,
  handleLike,
  isOwnProfile,
}: LikesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full rounded-2xl border border-border/60 bg-card/50 supports-backdrop-filter:bg-card/60 min-h-[350px] flex items-center">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto py-4 px-6 md:px-16 scrollbar-hide scroll-smooth snap-x snap-mandatory w-full"
      >
        {likes.length ? (
          <>
            <button
              type="button"
              title="left-scroll"
              onClick={() => scroll("left")}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-foreground/70 text-background shadow-md hover:bg-foreground/80 hover:scale-110 transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="right-scroll"
              onClick={() => scroll("right")}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-foreground/70 text-background shadow-md hover:bg-foreground/80 hover:scale-110 transition-all"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            {likes.map((i) => (
              <div key={i.id} className="shrink-0 snap-start w-64 h-[320px]">
                <FileCard
                  {...i}
                  title={i.file_name}
                  isOwnProfile={isOwnProfile}
                  handleLike={() => handleLike(i.id)}
                  isLiked={liked.some((item) => item.id === i.id)}
                  showLikeButton={isOwnProfile}
                  previewClassName="h-40"
                />
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground font-medium w-full text-center">
            Nothing liked yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default HorizontalLikes;

