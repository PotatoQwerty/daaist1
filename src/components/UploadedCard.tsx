"use client";

import { MoreVertical, Trash2, FileText } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UploadedCard({
  title,
  category,
  subject,
  link,
  type,
  size,
  onDelete,
  isOwnProfile,
}: {
  title: string;
  category: string;
  subject: string;
  level: string;
  link: string;
  type: string;
  size: number;
  onDelete: () => void;
  isOwnProfile: boolean;
}) {
  const extension = type.split("/")[1]?.toUpperCase() || "DOC";
  const isImage = type.includes("image");

  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-foreground">
      <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-border bg-subtle">
        {isImage ? (
          <Image
            src={link || ""}
            alt={title || "File preview"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="256px"
          />
        ) : (
          <FileText
            className="size-9 text-muted-foreground"
            strokeWidth={1.25}
            aria-hidden="true"
          />
        )}

        {/* Radix replaces the hand-rolled menu, which had no keyboard
            support and no focus management. */}
        {isOwnProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${title}`}
                className="absolute top-2 right-2 rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MoreVertical className="size-4" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-lg">
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground">
          {title}
        </h3>

        <p className="annot mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{extension}</span>
          {subject && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{subject}</span>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span>{(size / (1024 * 1024)).toFixed(2)} MB</span>
        </p>

        {category === "td" && (
          <p className="mt-3">
            <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase text-muted-foreground">
              TD / Exam
            </span>
          </p>
        )}

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          View file
        </a>
      </div>
    </article>
  );
}
