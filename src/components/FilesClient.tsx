"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/user-context";
import FileList from "@/components/FileList";
import EmptyState from "@/components/EmptyState";
import type { File } from "@/types/next-auth";
import { subjectOptions, type LevelKey } from "@/constants/uploadConstants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileX2 } from "lucide-react";

type FilesClientProps = {
  initialFiles: File[];
  level?: string;
};

export default function FilesClient({ initialFiles, level }: FilesClientProps) {
  const [liked, setLiked] = useState<{ id: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [onlySum, setOnlySum] = useState<boolean>(false);
  const { session, loading } = useUser();
  const userId = session?.user?.id;

  const subjects = level ? subjectOptions[level as LevelKey] : [];

  useEffect(() => {
    if (loading || !session || !userId) return;
    let isMounted = true;

    const fetchLikedPosts = async () => {
      try {
        const res = await fetch(`/api/files/like/user/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setLiked(Array.isArray(data.likedFiles) ? data.likedFiles : []);
      } catch (err) {
        console.error("Failed to fetch liked posts", err);
      }
    };

    fetchLikedPosts();
    return () => {
      isMounted = false;
    };
  }, [loading, session, userId]);

  const handleLike = async (fileId: string) => {
    if (!userId) return;

    const isLiked = liked.some((item) => item.id === fileId);

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

      if (!res.ok) return;

      const data = await res.json();
      if (data.likedposts) {
        setLiked(Array.isArray(data.likedposts) ? data.likedposts : []);
      }
    } catch (err) {
      console.error("Like/unlike failed:", err);
    }
  };

  const filesToDisplay = useMemo(
    () =>
      initialFiles.filter(
        (file) =>
          (selectedSubject === "all" || file.subject === selectedSubject) &&
          (!onlySum || file.issum)
      ),
    [initialFiles, onlySum, selectedSubject]
  );

  const filesWithProps = useMemo(
    () =>
      filesToDisplay.map((file) => ({
        ...file,
        title: file.file_name,
        handleLike: () => handleLike(file.id),
        isLiked: liked.some((l) => l.id === file.id),
      })),
    [filesToDisplay, liked]
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {level && subjects.length > 0 && (
        <div className="rule-b pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-summaries"
                  checked={onlySum}
                  onCheckedChange={(checked) => setOnlySum(Boolean(checked))}
                />
                <Label
                  htmlFor="only-summaries"
                  className="text-sm text-muted-foreground"
                >
                  Summaries only
                </Label>
              </div>

              <p className="annot">
                {filesToDisplay.length}{" "}
                {filesToDisplay.length === 1 ? "result" : "results"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!initialFiles || initialFiles.length === 0 ? (
        <EmptyState
          icon={FileX2}
          title="No files yet"
          description="There are no uploads here yet. Check back later or be the first to share resources."
        />
      ) : filesToDisplay.length === 0 ? (
        <EmptyState
          icon={FileX2}
          title="No matches"
          description="Try a different subject filter, or disable summaries-only."
        />
      ) : (
        <FileList files={filesWithProps} />
      )}
    </div>
  );
}

