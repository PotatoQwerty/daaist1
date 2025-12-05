"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import FileList from "@/components/FileList";
import MessageCard from "@/components/MessageCard";
import { File } from "@/types/next-auth";

interface FilesClientProps {
  initialFiles: File[];
}

export default function FilesClient({ initialFiles }: FilesClientProps) {
  const [liked, setLiked] = useState<{ id: string }[]>([]);
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const fetchLikedPosts = async () => {
      try {
        const res = await fetch(`/api/files/like/user/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        setLiked(Array.isArray(data.likedFiles) ? data.likedFiles : []);
      } catch (err) {
        console.error("Failed to fetch liked posts", err);
      }
    };

    fetchLikedPosts();
  }, [status, userId]);

  const handleLike = async (fileId: string) => {
    if (!userId) return;

    const isLiked = liked.some((item) => item.id === fileId);

    // Optimistic update
    setLiked((prev) =>
      isLiked
        ? prev.filter((item) => item.id !== fileId)
        : [...prev, { id: fileId }]
    );

    try {
      const res = await fetch(`/api/files/like`, {
        method: "POST",
        body: JSON.stringify({ userId, fileId }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.likedposts) {
          setLiked(Array.isArray(data.likedposts) ? data.likedposts : []);
        }
      }
    } catch (err) {
      console.error("Like/unlike failed:", err);
    }
  };

  if (!initialFiles || initialFiles.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <MessageCard
          type="error"
          message="There is nothing uploaded here"
          key="err-msg"
        />
      </div>
    );
  }

  // Map files to include props needed for FileCard (via FileList)
  const filesWithProps = initialFiles.map((file) => ({
    ...file,
    title: file.file_name, // Map file_name to title
    handleLike: () => handleLike(file.id),
    isLiked: liked.some((l) => l.id === file.id),
  }));

  return <FileList files={filesWithProps} />;
}
