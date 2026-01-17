"use client";

import { useState } from "react";
import { useUser } from "@/context/user-context";
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

interface ClubMembership {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  role?: string | null;
}

interface ProfileUser {
  id?: string;
  user_id: string;
  files?: any[];
  uploads: any[];
  likes: any[];
  clubs?: ClubMembership[];
  studyyear?: string;
  bio?: string;
  isdaa?: boolean;
  role?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  image?: string;
  email?: string;
}

interface ProfileClientProps {
  initialUser: ProfileUser;
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const { session } = useUser();
  const [user, setUser] = useState(initialUser);
  const { isAdmin, isSuperAdmin } = useCurrentRole();

  const isOwnProfile = session?.user.id === user.user_id;

  const handleDelete = async (fileUrl: string) => {
    try {
      toast.promise(
        (async () => {
          let fileKey = "";
          try {
            const urlObj = new URL(fileUrl);
            fileKey = urlObj.pathname.substring(1);
          } catch (e) {
            console.error("Invalid URL", e);
            fileKey = fileUrl;
          }

          const res = await fetch(`/api/files/${fileKey}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete file");
          return res.json();
        })(),
        {
          loading: "Deleting file...",
          success: "File deleted successfully!",
          error: "Something went wrong!",
        },
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
    (element) => element.value == user.studyyear,
  );
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ");
  const displayName = fullName || user.username || "Student";
  const uploadsCount = user.uploads?.length ?? 0;
  const likesCount = user.likes?.length ?? 0;
  const clubs = user.clubs ?? [];

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative flex flex-col gap-8 p-6 md:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <EditProfileButton
                isOwnProfile={isOwnProfile}
                currentImage={user.image || "/images/placeholder.png"}
              />

              <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {displayName}
                  </h1>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full shadow-sm">
                    {displayYear?.label || "Unknown year"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                    {isAdmin || isSuperAdmin ? (
                      <ShieldUser
                        className="size-4"
                        fill="var(--secondary)"
                        stroke="var(--primary)"
                        strokeWidth="1px"
                      />
                    ) : user.isdaa ? (
                      <Stars
                        className="size-4"
                        fill="var(--secondary)"
                        stroke="none"
                      />
                    ) : (
                      <UserIcon
                        className="size-4"
                        fill="var(--primary)"
                        stroke="none"
                      />
                    )}
                    <span>
                      {isAdmin || isSuperAdmin
                        ? "Admin"
                        : user.isdaa
                          ? "DAA'ist"
                          : "Guest"}
                    </span>
                  </span>
                </div>

                <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-center md:text-left">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Uploads
                    </p>
                    <p className="text-lg font-semibold">{uploadsCount}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-center md:text-left">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Favorites
                    </p>
                    <p className="text-lg font-semibold">{likesCount}</p>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background/70 p-4">
                  <ProfileBio
                    actualBio={user.bio}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="scale-90 opacity-90">
                <DaaLogo />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Clubs</h2>
          </div>

          {clubs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {clubs.map((club) => {
                const roleLabel = club.role
                  ? club.role.replace(/_/g, " ")
                  : null;
                return (
                  <div
                    key={club.id}
                    className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
                  >
                    {club.slug ? (
                      <Link
                        href={`/club/${club.slug}`}
                        className="inline-flex items-center text-lg font-semibold text-foreground hover:text-accent transition"
                      >
                        Member of {club.name}
                      </Link>
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        Member of {club.name}
                      </p>
                    )}
                    {roleLabel && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Role: {roleLabel}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-6 text-sm text-muted-foreground">
              Not a member of any club yet.
            </div>
          )}
        </section>

        <section className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Uploaded Projects
            </h2>
            {isOwnProfile && isAdmin && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-secondary transition"
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

        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
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
    </div>
  );
}
