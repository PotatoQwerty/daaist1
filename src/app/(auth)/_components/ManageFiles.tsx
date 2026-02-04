"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, FileText } from "lucide-react";
import type { File } from "@/types/next-auth";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import ManageFileCard from "./ManageFileCard";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";

interface ManageFilesProps {
  initialFiles: File[];
}

export default function ManageFiles({ initialFiles }: ManageFilesProps) {
  const [files, setFiles] = useState<File[] | null>(initialFiles ?? null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFiles(initialFiles ?? []);
  }, [initialFiles]);

  const handleDelete = async (fileUrl: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure you want to delete this file?",
      icon: "warning",
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "oklch(0.67 0.23 25)",
      cancelButtonText: "Cancel",
      cancelButtonColor: "oklch(0.32 0.05 250)",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    toast.promise(
      (async () => {
        let fileKey = "";
        try {
          const urlObj = new URL(fileUrl);
          fileKey = urlObj.pathname.substring(1);
        } catch (e) {
          console.error("Invalid URL", e);
          throw new Error("Invalid file URL");
        }

        const res = await fetch(`/api/files/${fileKey}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete file");

        setFiles((prev) => prev?.filter((f) => f.url !== fileUrl) || null);
      })(),
      {
        loading: "Deleting file...",
        success: "File deleted successfully!",
        error: "Failed to delete file",
      }
    );
  };

  const filteredFiles = useMemo(() => {
    if (!files) return [];
    const q = search.trim().toLowerCase();
    if (!q) return files;

    return files.filter((f) => {
      return (
        f.file_name?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q) ||
        f.level?.toLowerCase().includes(q) ||
        f.subject?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    });
  }, [files, search]);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      {files === null ? (
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading posts…</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Admin
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Manage posts
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Search uploads and delete files when needed.
            </p>
          </header>

          <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, username, year, subject…"
                  className="pl-9"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {filteredFiles.length} result
                {filteredFiles.length === 1 ? "" : "s"}
              </p>
            </div>
          </section>

          {filteredFiles.length > 0 ? (
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => (
                <ManageFileCard
                  key={file.id}
                  id={file.id}
                  file_name={file.file_name}
                  type={file.type}
                  url={file.url}
                  uploaded_by={file.username || "Unknown"}
                  level={file.level}
                  category={file.category}
                  subject={file.subject}
                  size={file.size}
                  onDelete={() => handleDelete(file.url)}
                />
              ))}
            </section>
          ) : (
            <EmptyState
              icon={FileText}
              title="No posts found"
              description={
                search.trim()
                  ? "No uploads match your search query."
                  : "There are no uploads yet."
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

