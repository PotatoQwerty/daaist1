"use client";

import { useEffect, useState } from "react";
import type { File } from "../../../../../../types/types/next-auth";
import ManageFiles from "@/components/ManageFiles";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";

function ManagePosts() {
  const [files, setFiles] = useState<File[] | null>(null);
  const [search, setSearch] = useState("");

  // Fetch all files on mount
  useEffect(() => {
    const getAllFiles = async () => {
      try {
        const res = await fetch("/api/files/manage");
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files);
        } else {
          toast.error("Failed to fetch files");
        }
      } catch (err) {
        console.error("Error fetching files:", err);
        toast.error("Error fetching files");
      }
    };

    getAllFiles();
  }, []);

  // Delete file handler
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

        // Update state to remove deleted file
        setFiles((prev) => prev?.filter((f) => f.url !== fileUrl) || null);
      })(),
      {
        loading: "Deleting file...",
        success: "File deleted successfully! 🎉",
        error: "Failed to delete file ❌",
      }
    );
  };

  // Filtered files for search
  const filteredFiles = files?.filter(
    (f) =>
      f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.level?.toLowerCase().includes(search.toLowerCase()) ||
      f.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 p-8 justify-center items-center flex-wrap">
      <h1 className="text-2xl font-black self-start mb-2">
        Manage All Uploaded Files
      </h1>

      <div className="w-full mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          name="search"
          type="text"
          placeholder="Search by username, title, year or subject..."
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        {files ? (
          filteredFiles?.map((file) => (
            <ManageFiles
              id={file.id}
              key={file.id}
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
          ))
        ) : (
          <div className="w-full p-4 h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl">Loading files...</h1>
            <Loader2Icon className="size-8 animate-spin mt-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePosts;
