import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import FileCard from "./FileCard";

interface LikesProps {
  likes: any[];
  liked: { id: string }[];
  handleLike: (fileId: string) => void;
}

function HorizontalLikes({ likes, liked, handleLike }: LikesProps) {
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
    <div className="relative w-full">
      {likes.length ? (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      ) : (
        <></>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto py-2 px-6 scrollbar-hide scroll-smooth snap-x snap-mandatory"
      >
        {likes.length ? (
          likes.map((i) => (
            <div key={i.id} className="flex-shrink-0 snap-start">
              <FileCard
                size={i.size}
                title={i.file_name}
                subject={i.subject}
                type={i.type}
                link={i.url}
                handleLike={() => handleLike(i.id)}
                isLiked={liked.some((item) => item.id === i.id)}
              />
            </div>
          ))
        ) : (
          <p className="text-gray-300 font-medium">Nothing liked yet 😔.</p>
        )}
      </div>
    </div>
  );
}

export default HorizontalLikes;
