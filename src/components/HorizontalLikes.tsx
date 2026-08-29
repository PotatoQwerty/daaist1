"use client";
import FileCard from "./FileCard";
import HorizontalScroller from "./HorizontalScroller";
import type { File } from "../types/next-auth";

interface LikesProps {
  likes: File[];
  liked: { id: string }[];
  handleLike: (fileId: string) => void;
  isOwnProfile: boolean;
}

function HorizontalLikes({
  likes,
  liked,
  handleLike,
  isOwnProfile,
}: LikesProps) {
  if (likes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing saved yet.</p>;
  }

  return (
    <HorizontalScroller label="Favorites">
      {likes.map((file) => (
        <div key={file.id} className="w-64 shrink-0 snap-start">
          <FileCard
            {...file}
            title={file.file_name}
            isOwnProfile={isOwnProfile}
            handleLike={() => handleLike(file.id)}
            isLiked={liked.some((item) => item.id === file.id)}
            showLikeButton={isOwnProfile}
          />
        </div>
      ))}
    </HorizontalScroller>
  );
}

export default HorizontalLikes;
