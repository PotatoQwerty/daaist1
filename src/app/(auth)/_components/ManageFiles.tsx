"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FileIcon, Edit, FileX, MoreVertical, Loader2Icon } from "lucide-react";
import type { File } from "../../../types/next-auth";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import ManageFileCard from "./ManageFileCard";
interface FilesClientProps {
  initialFiles: File[];
}

function ManageFiles({ initialFiles }: FilesClientProps) {
  const [files, setFiles] = useState<File[] | null>(initialFiles ?? null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFiles(initialFiles ?? []);
  }, [initialFiles]);

  const handleDelete = async (fileUrl: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure you want to delete this file?",
      icon: "warning",
      confirmButtonText: "Yes, Go on Delete",
      confirmButtonColor: "oklch(0.67 0.23 25)",
      cancelButtonText: `NOOOO`,
      cancelButtonColor: "oklch(0.32 0.05 250)",
      showCancelButton: true,
    });
    if (confirm.isConfirmed) {
      toast.promise(
        (async () => {
          const res = await fetch("/api/files/manage/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ fileUrl }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to delete file");

          setFiles((prev) => prev?.filter((f) => f.url !== fileUrl) || null);
        })(),
        {
          loading: "Deleting file...",
          success: "File deleted successfully! 🎉",
          error: "Failed to delete file ❌",
        }
      );
    }
    return;
  };
  const filteredFiles = files?.filter(
    (f) =>
      f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.level?.toLowerCase().includes(search.toLowerCase()) ||
      f.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {files === null ? (
        <div className="flex flex-col items-center justify-center w-full h-96">
          <h2 className="text-3xl mb-4">Loading files...</h2>
          <Loader2Icon className="size-8 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-8 w-full">
          <h1 className="text-2xl font-black mb-4">
            Manage All Uploaded Files
          </h1>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, title, year, or subject..."
            className="w-full p-2 border border-gray-300 rounded-md mb-6"
          />

          {filteredFiles?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <ManageFileCard
                  key={file.id}
                  id={file.id}
                  file_name={file.file_name}
                  type={file.type}
                  url={file.url}
                  uploaded_by={file.username || "not available"}
                  level={file.level}
                  category={file.category}
                  subject={file.subject}
                  size={file.size}
                  onDelete={() => handleDelete(file.url)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center w-full text-gray-500 mt-8">
              No files match your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageFiles;
