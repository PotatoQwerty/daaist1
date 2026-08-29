import { File } from "@/types/next-auth";
import { Heart, FileText, Download } from "lucide-react";
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
  const extension = type.split("/")[1]?.toUpperCase() || "DOC";
  const isImage = type.includes("image");

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-foreground">
      {/* Preview. Images show themselves; everything else gets a plain
          mark on a flat ground rather than a simulated document. */}
      <div
        className={`relative flex h-40 items-center justify-center overflow-hidden border-b border-border bg-subtle ${previewClassName || ""}`}
      >
        {isImage ? (
          <Image
            src={url || ""}
            alt={title || "File preview"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <FileText
            className="size-9 text-muted-foreground"
            strokeWidth={1.25}
            aria-hidden="true"
          />
        )}

        {showLikeButton && (
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            className="absolute top-2 right-2 rounded-md border border-border bg-card p-2 transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            <Heart
              className={`size-4 transition-colors duration-200 ${
                isLiked
                  ? "fill-accent text-accent"
                  : "text-muted-foreground hover:text-accent"
              }`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground">
          {title}
        </h3>

        {/* The annotation line: type, subject, size. Read as values, so
            set in mono and tabular. */}
        <p className="annot mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{extension}</span>
          {subject && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{subject}</span>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span>{fileSizeMB} MB</span>
        </p>

        {(category === "td" || issum) && (
          <p className="mt-3 flex flex-wrap gap-2">
            {category === "td" && (
              <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase text-muted-foreground">
                TD / Exam
              </span>
            )}
            {issum && (
              <span className="rounded-full border border-primary px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase text-primary">
                Summary
              </span>
            )}
          </p>
        )}

        <a
          href={url}
          download={title}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <Download className="size-4" strokeWidth={2} aria-hidden="true" />
          Download
        </a>
      </div>
    </article>
  );
}

export default FileCard;
