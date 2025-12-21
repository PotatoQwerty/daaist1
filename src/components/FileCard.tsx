import { File } from "@/types/next-auth";
import { Heart, FileIcon, DownloadCloud, ImageIcon } from "lucide-react";

function FileCard({
  title,
  size,
  type,
  url,
  handleLike,
  isLiked,
  subject,
  category,
  issum,
}: File) {
  const fileSizeMB = (size / (1024 * 1024)).toFixed(2);

  // const screenWidth = window.innerWidth; make the width depend on the screensize?
  return (
    <div className="relative w-[280px] h-fit bg-background rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-accent flex flex-col overflow-hidden">
      {/* TD Badge */}
      {category === "td" && (
        <span className="absolute top-3 left-3 z-10 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-orange-200">
          TD
        </span>
      )}
      {issum && (
        <span className="absolute top-3 left-3 z-10 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-white/60">
          Summary
        </span>
      )}

      {/* Like Button */}
      <button
        type="button"
        onClick={handleLike}
        className="absolute top-3 right-3 z-10 bg-white shadow-sm rounded-full p-1.5 hover:scale-110 transition-transform"
      >
        {isLiked ? (
          <Heart className="size-6 fill-accent stroke-none hover:stroke-2 hover:stroke-black hover:fill-none transition-all duration-200 " />
        ) : (
          <Heart className="size-6 stroke-black hover:fill-accent hover:stroke-none transition-all duration-200" />
        )}
      </button>

      {/* File Preview */}
      <div className="flex flex-col items-center justify-center p-5 bg-accent/10">
        {type.includes("image") ? (
          <ImageIcon className="size-14 text-accent" />
        ) : (
          <FileIcon className="size-14 text-accent" />
        )}
      </div>

      {/* File Info */}
      <div className="p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-foreground text-lg truncate">
          {title}
        </h2>
        <p className="text-sm text-gray-500 truncate">
          {type && subject ? (
            <>
              {type} • <span className="font-bold">{subject}</span>
            </>
          ) : (
            <>
              <span className="font-bold">Document</span>
            </>
          )}
        </p>
        <p className="text-sm text-gray-500 truncate">{fileSizeMB} MB</p>

        {/* Download Button */}
        <a
          href={url}
          download={title}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-white  py-2 px-3 text-sm font-bold hover:bg-accent/60 transition-all ease-in-out duration-200"
        >
          <DownloadCloud className="size-4" />
          Download
        </a>
      </div>
    </div>
  );
}

export default FileCard;
