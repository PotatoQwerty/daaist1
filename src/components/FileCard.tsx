import { File } from "@/types/next-auth";
import { Heart, FileIcon, DownloadCloud } from "lucide-react";
import Image from "next/image";

function FileCard({
  title,
  size,
  type,
  url,
  handleLike,
  category,
  issum,

  isLiked,
  subject,
  showLikeButton = true,
  previewClassName,
}: File & {
  isOwnProfile?: boolean;
  handleLike?: () => void;
  isLiked?: boolean;
  showLikeButton?: boolean;
  previewClassName?: string;
}) {
  const fileSizeMB = (size / (1024 * 1024)).toFixed(2);

  return (
    <div className="group relative w-full h-full bg-card/40 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 border border-white/20 flex flex-col overflow-hidden">
      {/* Visual Header / Background Element */}
      <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-br from-primary/10 via-accent/5 to-transparent -z-10 group-hover:from-primary/20 group-hover:via-accent/10 transition-colors duration-500" />

      {/* Badges Container */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
        {category === "td" && (
          <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full backdrop-blur-md border border-orange-500/20 shadow-sm">
            TD
          </span>
        )}
        {issum && (
          <span className="bg-primary/10 text-primary dark:text-primary-foreground/90 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full backdrop-blur-md border border-primary/20 shadow-sm">
            Summary
          </span>
        )}
      </div>

      {/* Like Button */}
      {showLikeButton && (
        <button
          type="button"
          onClick={handleLike}
          className="absolute top-3 right-3 z-30 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-sm border border-white/30 dark:border-white/10 rounded-full p-2 hover:scale-110 active:scale-95 transition-all duration-300"
        >
          {isLiked ? (
            <Heart className="size-5 fill-accent stroke-2 stroke-accent hover:stroke-black hover:fill-none transition-all duration-300 transform scale-110" />
          ) : (
            <Heart className="size-5 text-gray-600 stroke-2 dark:text-gray-300 hover:fill-accent hover:stroke-accent transition-colors duration-300" />
          )}
        </button>
      )}

      {/* File Preview Section */}
      <div
        className={`relative flex flex-col items-center justify-center pt-8 pb-4 px-4 overflow-hidden h-48 ${previewClassName || ""}`}
      >
        <div className="absolute inset-0 bg-radial-gradient from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500 ease-out">
          {type.includes("image") ? (
            <div className="relative w-full h-full bg-white/40 dark:bg-white/5 rounded-2xl shadow-inner border border-white/40 overflow-hidden">
              <Image
                src={url || ""}
                alt={title || "Image Preview"}
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="p-4 bg-white/40 dark:bg-white/5 rounded-2xl shadow-inner border border-white/40">
              <FileIcon className="size-14 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* File Info Section */}
      <div className="p-5 flex flex-col grow gap-1 mt-auto bg-linear-to-t from-white/40 to-transparent dark:from-black/10">
        <h2 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 min-h-10">
          {title}
        </h2>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/50 max-w-20 truncate">
            {type.split("/")[1]?.toUpperCase() || "DOC"}
          </span>
          {subject && (
            <span className="text-[11px] font-bold text-primary/80 dark:text-primary-foreground/70 truncate uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
              {subject}
            </span>
          )}
        </div>

        <p className="text-[12px] text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
          {fileSizeMB} MB
        </p>

        {/* Download Button */}
        <a
          href={url}
          download={title}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 px-4 text-sm font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 group/btn"
        >
          <DownloadCloud className="size-4 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
          Download
        </a>
      </div>
    </div>
  );
}

export default FileCard;
