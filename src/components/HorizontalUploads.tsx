"use client";
import UploadedCard from "./UploadedCard";
import HorizontalScroller from "./HorizontalScroller";
import type { File } from "../types/next-auth";

interface Props {
  uploads: File[];
  handleDelete: (url: string) => void;
  isOwnProfile: boolean;
}

export default function HorizontalUploads({
  uploads,
  handleDelete,
  isOwnProfile,
}: Props) {
  if (uploads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>
    );
  }

  return (
    <HorizontalScroller label="Uploads">
      {uploads.map((file) => (
        <div key={file.id} className="w-64 shrink-0 snap-start">
          <UploadedCard
            isOwnProfile={isOwnProfile}
            type={file.type}
            title={file.file_name}
            link={file.url}
            category={file.category}
            level={file.level}
            subject={file.subject}
            size={file.size}
            onDelete={() => handleDelete(file.url)}
          />
        </div>
      ))}
    </HorizontalScroller>
  );
}
