"use client";
import { useRef } from "react";
import UploadedCard from "./UploadedCard";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { File } from "../types/next-auth";

interface Props {
  uploads: File[];
  handleDelete: (url: string) => void;
  isOwnProfile: boolean;
}

export default function HorizontalUploads({
  uploads,
  handleDelete,
  isOwnProfile,
}: Props) {
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
    <div className="relative w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 min-h-[350px] flex items-center">
      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto py-2 px-16 scrollbar-hide scroll-smooth snap-x snap-mandatory w-full"
      >
        {uploads.length > 0 ? (
          <>
            <button
              type="button"
              title="left-scroll"
              onClick={() => scroll("left")}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white shadow-md hover:scale-110 transition-all"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              title="right-scroll"
              onClick={() => scroll("right")}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white shadow-md hover:scale-110 transition-all"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            {uploads.map((i) => (
              <div key={i.id} className="shrink-0 snap-start w-64 h-[320px]">
                <UploadedCard
                  isOwnProfile={isOwnProfile}
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
            ))}
          </>
        ) : (
          <p className="text-gray-300 font-medium w-full text-center">
            Nothing posted yet 😔.
          </p>
        )}
      </div>
    </div>
  );
}
