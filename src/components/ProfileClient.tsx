"use client";

import { useState } from "react";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Stars, UserIcon, ShieldUser, FolderOpen, Heart } from "lucide-react";
import EditProfileButton from "@/components/EditProfileButton";
import ProfileBio from "@/components/EditProfileBio";
import DaaLogo from "@/components/DaaLogo";
import HorizontalUploads from "@/components/HorizontalUploads";
import HorizontalLikes from "@/components/HorizontalLikes";
import EmptyState from "@/components/EmptyState";
import { yearOptions } from "@/constants/uploadConstants";
import { useCurrentRole } from "@/hooks/use-current-role";

interface ProfileClientProps {
  initialUser: User & {
    uploads: any[];
    likes: any[];
    user_id: string;
    studyyear?: string;
    bio?: string;
    isdaa?: boolean;
    role?: string;
  };
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState(initialUser);
  const { isAdmin, roles } = useCurrentRole();

  const isOwnProfile = session?.user.id === user.user_id;

  const handleDelete = async (fileUrl: string) => {
    try {
      toast.promise(
        (async () => {
          const res = await fetch(`/api/files/${fileUrl}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete file");
          return res.json();
        })(),
        {
          loading: "Deleting file...",
          success: "File deleted successfully!",
          error: "Something went wrong!",
        }
      );

      // Remove the deleted file from user.uploads
      setUser((prev) => ({
        ...prev,
        uploads: prev.uploads.filter((file) => file.url !== fileUrl),
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file ❌");
    }
  };

  const handleLike = async (fileId: string) => {
    // If not logged in or invalid state, return
    if (!user) return;

    const isLiked = user.likes?.some((item) => item.id === fileId);

    // 🔹 Optimistic UI update
    setUser((prev) => ({
      ...prev,
      likes: isLiked
        ? prev.likes.filter((item) => item.id !== fileId) // unlike
        : [...prev.likes, { id: fileId }], // like (placeholder object)
    }));

    try {
      const res = await fetch(`/api/files/like`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, fileId }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        // Sync with backend response if needed
        if (data.likedposts) {
          setUser((prev) => ({
            ...prev,
            likes: Array.isArray(data.likedposts)
              ? data.likedposts
              : prev.likes,
          }));
        }
      }
    } catch (err) {
      console.error("Like/unlike failed:", err);
      // Revert optimization on error if needed (omitted for brevity)
    }
  };

  const displayYear = yearOptions.find(
    (element) => element.value == user.studyyear
  );

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-primary to-[#f3f3f3] text-gray-900 flex flex-col items-center px-6 py-10">
      {/* Header */}
      <div className="relative w-full max-w-5xl bg-background supports-backdrop-filter:bg-background/60 shadow-lg rounded-3xl p-10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8 ">
        {/* Profile Info */}
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-start md:gap-10">
          {/* Profile Image */}
          <div className="relative w-36 h-36 shrink-0">
            <div className="absolute">
              <EditProfileButton
                isOwnProfile={isOwnProfile}
                currentImage={user.image || "/images/placeholder.png"}
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 w-full">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {user.firstname + " " + user.lastname}
              </h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-sm font-medium bg-primary text-white px-3 py-1 rounded-full shadow-sm">
                {displayYear?.label || "Unknown"}
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-100 font-medium bg-accent/80 px-3 py-1 rounded-full shadow-sm">
                {user.isdaa ? (
                  <Stars
                    className="size-5"
                    fill="var(--secondary)"
                    stroke="none"
                  />
                ) : isAdmin ? (
                  <ShieldUser
                    className="size-5"
                    fill="var(--secondary)"
                    stroke="var(--primary)"
                    strokeWidth="1px"
                  />
                ) : (
                  <UserIcon
                    className="size-5"
                    fill="var(--primary)"
                    stroke="none"
                  />
                )}
                <span>
                  {user.isdaa ? `DAA'ist` : isAdmin ? `Admin` : "Guest"}
                </span>
              </span>
            </div>

            <div className="mt-3 w-full max-w-sm">
              <ProfileBio actualBio={user.bio} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="hidden md:block">
          <DaaLogo />
        </div>
      </div>

      {/* Uploaded Projects */}
      <section className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Uploaded Projects
          </h2>
          {isOwnProfile && isAdmin && (
            <Link
              href="/upload"
              className="text-sm min-w-fit bg-secondary hover:bg-secondary/85 hover:text-white text-black font-semibold px-4 py-2 rounded-full shadow transition duration-300"
            >
              + Upload New
            </Link>
          )}
        </div>

        {user.uploads && user.uploads.length > 0 ? (
          <HorizontalUploads
            isOwnProfile={isOwnProfile}
            uploads={user.uploads}
            handleDelete={handleDelete}
          />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No Uploads Yet"
            description={
              isOwnProfile
                ? "You haven't uploaded any files yet. Share your work with the community!"
                : "This user hasn't uploaded any documents yet."
            }
          />
        )}
      </section>

      {/* Favorites */}
      <section className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Favorites
          </h2>
        </div>

        {user.likes && user.likes.length > 0 ? (
          <HorizontalLikes
            isOwnProfile={isOwnProfile}
            likes={user.likes}
            liked={user.likes}
            handleLike={handleLike}
          />
        ) : (
          <EmptyState
            icon={Heart}
            title="No Favorites"
            description="No favorite files yet. Heart some files to see them here!"
          />
        )}
      </section>
    </div>
  );
}
