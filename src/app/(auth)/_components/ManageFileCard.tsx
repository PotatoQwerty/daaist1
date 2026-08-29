"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileIcon, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ManageFileCardProps = {
  id: string;
  file_name: string;
  type: string;
  url: string;
  uploaded_by: string;
  level?: string | null;
  subject?: string | null;
  category?: string | null;
  size: number;
  onDelete: () => void;
};

function categoryBadgeClassName(category?: string | null) {
  switch (category) {
    case "td":
      return "border-warning/30 bg-warning/10 text-warning";
    case "doc":
      return "bg-primary/10 text-primary border-primary/20";
    case "course":
      return "bg-accent/10 text-accent border-accent/20";
    default:
      return "bg-muted/30 text-muted-foreground border-border";
  }
}

function categoryLabel(category?: string | null) {
  switch (category) {
    case "td":
      return "TD/Exam";
    case "doc":
      return "Document";
    case "course":
      return "Course";
    default:
      return "File";
  }
}

export default function ManageFileCard({
  file_name,
  type,
  url,
  uploaded_by,
  level,
  subject,
  category,
  size,
  onDelete,
}: ManageFileCardProps) {
  const fileSizeMB = (size / (1024 * 1024)).toFixed(2);
  const ext = type?.split("/")[1]?.toUpperCase() || "FILE";
  const isImage = type?.includes("image");

  return (
    <div className="group relative w-full overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-1 hover:shadow-md">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      </div>

      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            categoryBadgeClassName(category)
          )}
        >
          {categoryLabel(category)}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {ext}
        </span>
      </div>

      <div className="absolute right-3 top-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full bg-background/60 hover:bg-background/80"
              title="Actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link
                href={url}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open file
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative p-4 pt-12">
        <Link
          href={url}
          prefetch={false}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={`Open ${file_name}`}
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted/30">
            {isImage ? (
              <Image
                src={url}
                alt={file_name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileIcon className="size-10" />
                <span className="text-xs">No preview</span>
              </div>
            )}
          </div>
        </Link>

        <div className="mt-4 space-y-2">
          <h3
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground"
            title={file_name}
          >
            {file_name}
          </h3>
          <p className="text-xs text-muted-foreground">
            Uploaded by{" "}
            <span className="font-medium text-foreground">{uploaded_by}</span>
          </p>
          {category !== "doc" && (level || subject) && (
            <p className="text-xs text-muted-foreground">
              {level ? (
                <>
                  <span className="font-medium text-foreground">{level}</span>
                  {subject ? <span className="mx-2">•</span> : null}
                </>
              ) : null}
              {subject ? (
                <span className="font-medium text-foreground">{subject}</span>
              ) : null}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{fileSizeMB} MB</p>
        </div>
      </div>
    </div>
  );
}

