"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FileIcon, Edit, FileX, MoreVertical } from "lucide-react";
import type { File } from "../../types/types/next-auth";

function ManageFiles({
  file_name,
  type,
  url,
  uploaded_by,
  level,
  subject,
  category,
  size,
}: File) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="bg-background rounded-2xl shadow-md p-4 w-[320px] h-[280px] flex relative flex-col items-center justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-foreground/10">
      {/* Top-right menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <MoreVertical
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="opacity-70 hover:opacity-100 cursor-pointer"
        />
        {isOpen && (
          <div className="absolute top-7 right-0 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-2 w-[120px] animate-in fade-in slide-in-from-top-2 z-50">
            <button className="flex w-full items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition">
              <FileX className="size-4" />
              <span className="text-sm font-medium">Delete</span>
            </button>
            <button className="flex w-full items-center gap-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 px-2 py-1 rounded-md transition">
              <Edit className="size-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          </div>
        )}
      </div>

      {/* File Preview */}
      <div className="w-full h-[160px] flex items-center justify-center bg-muted rounded-xl overflow-hidden">
        {type.includes("image") ? (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[300px] h-[160px] block"
          >
            <Image
              src={url}
              alt={file_name}
              width={300}
              height={160}
              className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
            />
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileIcon className="w-12 h-12 mb-2" />
            <span className="text-sm">No preview</span>
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-xs hover:text-foreground"
            >
              Open file
            </Link>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="w-full mt-3 text-center space-y-1">
        <h1 className="truncate font-semibold text-lg">{file_name}</h1>
        <p className="text-sm text-muted-foreground">
          Uploaded by <span className="font-medium">{uploaded_by}</span>
        </p>
        {category === "doc" ? (
          <span className="text-sm italic text-foreground/80">Document</span>
        ) : (
          <span className="text-sm text-foreground/80">
            Year: {level} • Subject: {subject}
          </span>
        )}
        <p className="text-xs text-muted-foreground">
          {(size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}

export default ManageFiles;
