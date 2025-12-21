"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import FileList from "@/components/FileList";
import MessageCard from "@/components/MessageCard";
import { File } from "@/types/next-auth";

interface FilesClientProps {
  initialFiles: File[];
}

import { subjectOptions, LevelKey } from "@/constants/uploadConstants";
import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";

interface FilesClientProps {
  initialFiles: File[];
  level?: string;
}

export default function FilesClient({ initialFiles, level }: FilesClientProps) {
  const [liked, setLiked] = useState<{ id: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [onlySum, setOnlySum] = useState<boolean>(false);
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const filesToDisplay = initialFiles.filter(
    (file) =>
      (selectedSubject === "all" || file.subject === selectedSubject) &&
      (!onlySum || file.issum)
  );

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

  const getSubjectLabel = (value: string) => {
    if (!level) return value;
    const subjects = subjectOptions[level as LevelKey];
    return subjects?.find((s) => s.value === value)?.label || value;
  };

  // Map files to include props needed for FileCard (via FileList)
  const filesWithProps = filesToDisplay.map((file) => ({
    ...file,
    title: file.file_name, // Map file_name to title
    handleLike: () => handleLike(file.id),
    isLiked: liked.some((l) => l.id === file.id),
  }));

  const subjects = level ? subjectOptions[level as LevelKey] : [];

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {level && subjects && subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto no-scrollbar mask-linear">
          <div className="flex gap-1">
            <Button
              variant={selectedSubject === "all" ? "default" : "outline"}
              onClick={() => setSelectedSubject("all")}
              size="sm"
              className="rounded-full"
            >
              All
            </Button>
            {subjects.map((subject) => (
              <Button
                key={subject.value}
                variant={
                  selectedSubject === subject.value ? "default" : "outline"
                }
                onClick={() => setSelectedSubject(subject.value)}
                size="sm"
                className="rounded-full"
              >
                {subject.label}
              </Button>
            ))}
          </div>
          <label
            htmlFor="issum"
            className="flex gap-1 justify-center items-center text-xl "
          >
            <input
              type="checkbox"
              title="issum"
              name="issum"
              id="issum"
              className="peer hidden"
              checked={onlySum}
              onChange={() => setOnlySum(!onlySum)}
            />

            <CircleCheck className="size-5 peer-checked:fill-accent" />

            <span>Show only summaries</span>
          </label>
        </div>
      )}

      {!initialFiles || initialFiles.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <MessageCard
            type="error"
            message="There is nothing uploaded here"
            key="err-msg"
          />
        </div>
      ) : filesToDisplay.length === 0 ? (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <p className="text-muted-foreground">
            No files found for {getSubjectLabel(selectedSubject)}
          </p>
        </div>
      ) : (
        <FileList files={filesWithProps} />
      )}
    </div>
  );
}
