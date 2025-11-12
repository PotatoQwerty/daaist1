"use client";
import { useRef } from "react";
import UploadedCard from "./UploadedCard";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Props {
  uploads: string[];
  handleDelete: (url: string) => void;
}

export default function HorizontalUploads({ uploads, handleDelete }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.offsetWidth * 0.8; // scroll 80% of visible width
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full">
      {uploads.length > 0 ? (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white"
          >
            <ChevronLeftIcon className="size-5" />
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

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto py-2 px-6 scrollbar-hide scroll-smooth snap-x snap-mandatory"
      >
        {uploads.length ? (
          uploads.map((i) => (
            <div key={i.id} className="flex-shrink-0 snap-start">
              <UploadedCard
                type={i.type}
                title={i.file_name}
                link={i.url}
                category={i.category}
                level={i.level}
                subject={i.subject}
                size={i.size}
                onDelete={() => handleDelete(i.url)}
              />
            </div>
          ))
        ) : (
          <p className="text-gray-300 font-medium">Nothing posted yet 😔.</p>
        )}
      </div>
    </div>
  );
}
