"use client";

import { useEffect, useState } from "react";
import type { File } from "@/types/next-auth";
import ManageFiles from "@/components/ManageFiles";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { redirect, RedirectType } from "next/navigation";
import { RoleGate } from "@/components/RoleGate";

export default function ManagePosts() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<File[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status == "loading") return;
    if (!session) redirect("/", RedirectType.replace);

    const fetchFiles = async () => {
      try {
        const res = await fetch("/api/files/manage");
        if (!res.ok) throw new Error("Failed to fetch files");

        const data = await res.json();
        setFiles(data.files);
      } catch (error) {
        console.error("Error fetching files:", error);
        toast.error("Error fetching files");
      }
    };
    if (status == "authenticated" && session?.user?.role === "admin") {
      fetchFiles();
    }
  }, [status, session]);

  const handleDelete = async (fileUrl: string) => {
    toast.promise(
      (async () => {
        const res = await fetch("/api/files/manage/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
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
  };

  const filteredFiles = files?.filter(
    (f) =>
      f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.level?.toLowerCase().includes(search.toLowerCase()) ||
      f.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGate AllowedRoles={["admin"]}>
      {!files ? (
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
                <ManageFiles
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
    </RoleGate>
  );
}
