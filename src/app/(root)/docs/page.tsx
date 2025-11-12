"use client";
import FileCard from "@/components/FileCard";
import { useEffect, useState } from "react";
import { File } from "../../../../types/types/next-auth";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

function DocsPage() {
  const [docs, setDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [liked, setLiked] = useState<{ id: string }[]>([]);
  const { data: session, status } = useSession();
  const userId = session?.user.id;
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/files/docs");
        const data = await res.json();
        if (data?.files) setDocs(data.files);
      } catch (err) {
        console.error("Failed to fetch docs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const fetchLikedPosts = async () => {
      const res = await fetch(`/api/files/like/user/${userId}`);
      if (!res.ok) return;
      const data = await res.json();

      setLiked(Array.isArray(data.likedFiles) ? data.likedFiles : []);
    };

    fetchLikedPosts();
  }, [status, userId]);

  // ❤️ Like/unlike handler
  const handleLike = async (fileId: string) => {
    if (!userId) return;

    const isLiked = liked.some((item) => item.id === fileId);

    // 🔹 Optimistic UI update (instant feedback)
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

      // Optionally reconcile with server if backend returns updated list
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
  return (
    <div className="flex flex-col w-full min-h-screen p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
        Documents
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-foreground flex gap-2">
            <Loader2 className="size-5 animate-spin" />
            Loading documents...
          </p>
        </div>
      ) : docs.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-500">No documents found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr justify-items-center">
          {docs.map((doc) => (
            <FileCard
              key={doc.id}
              link={doc.url}
              title={doc.file_name}
              type={doc.type}
              subject={doc.subject}
              handleLike={() => handleLike(doc.id)}
              isLiked={liked.some((i) => i.id === doc.id)}
              size={doc.size}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DocsPage;
