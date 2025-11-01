"use client";
import { useEffect, useState } from "react";
import type { File } from "../../../../../types/types/next-auth";
import ManageFiles from "@/components/ManageFiles";
import { Loader2Icon } from "lucide-react";
function ManagePosts() {
  const [files, setFiles] = useState<File[] | null>();
  useEffect(() => {
    const getAllFiles = async () => {
      try {
        const res = await fetch("/api/files/manage");
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files);
        }
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    getAllFiles();
  }, []);

  return (
    <div className="flex flex-col gap-2 p-8 justify-center items-center flex-wrap">
      <h1 className="text-2xl font-black self-start mb-2">
        Manage All uploaded files
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {files ? (
          files?.map((i) => (
            <ManageFiles
              id={i.id}
              key={i.id}
              file_name={i.file_name}
              type={i.type}
              url={i.url}
              uploaded_by={i.username || "not available"}
              level={i.level}
              category={i.category}
              subject={i.subject}
              size={i.size}
            />
          ))
        ) : (
          <div className="w-full p-4 h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl">Loading files</h1>
            <Loader2Icon className="size-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePosts;
