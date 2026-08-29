"use client";

import { useState } from "react";
import { useUser } from "@/context/user-context";
import toast from "react-hot-toast";
import Link from "next/link";
import { Stars, UserIcon, ShieldUser, FolderOpen, Heart } from "lucide-react";
import EditProfileButton from "@/components/EditProfileButton";
import ProfileBio from "@/components/EditProfileBio";
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
  const { isAdmin, isSuperAdmin, canUpload } = useCurrentRole();

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
          success: "File deleted",
          error: "Could not delete the file. Try again.",
        },
      );

      setUser((prev) => ({
        ...prev,
        uploads: prev.uploads.filter((file) => file.url !== fileUrl),
      }));
    } catch (err) {
      console.error(err);
      toast.error("Could not delete the file. Try again.");
    }
  };

  const handleLike = async (fileId: string) => {
    if (!user) return;

    const isLiked = user.likes?.some((item) => item.id === fileId);

    setUser((prev) => ({
      ...prev,
      likes: isLiked
        ? prev.likes.filter((item) => item.id !== fileId)
        : [...prev.likes, { id: fileId }],
    }));

    try {
      const res = await fetch(`/api/files/like`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, fileId }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
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

  const standing =
    isAdmin || isSuperAdmin ? "Admin" : user.isdaa ? "DAA'ist" : "Guest";
  const StandingIcon =
    isAdmin || isSuperAdmin ? ShieldUser : user.isdaa ? Stars : UserIcon;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      {/* Identity block. Avatar, name, standing, and the two counts that
          describe this person's activity, on one rule. */}
      <header className="rule-b flex flex-col gap-8 pb-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <EditProfileButton
            isOwnProfile={isOwnProfile}
            currentImage={user.image || "/images/placeholder.png"}
          />

          <div className="min-w-0">
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
              {displayName}
            </h1>
            {user.username && (
              <p className="annot mt-1.5">@{user.username}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-xs font-bold">
                {displayYear?.label || "Year not set"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-xs font-bold text-primary">
                <StandingIcon
                  className="size-3.5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {standing}
              </span>
            </div>

            <div className="mt-6 max-w-md">
              <ProfileBio actualBio={user.bio} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>

        <dl className="flex gap-10 md:shrink-0">
          <div>
            <dt className="annot">Uploads</dt>
            <dd className="mt-1 font-mono text-3xl font-medium tabular-nums">
              {uploadsCount}
            </dd>
          </div>
          <div>
            <dt className="annot">Favorites</dt>
            <dd className="mt-1 font-mono text-3xl font-medium tabular-nums">
              {likesCount}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-14">
        <h2 className="text-2xl font-bold">Clubs</h2>

        {clubs.length > 0 ? (
          <ul className="mt-5">
            {clubs.map((club) => {
              const roleLabel = club.role ? club.role.replace(/_/g, " ") : null;
              return (
                <li
                  key={club.id}
                  className="rule-t flex items-baseline justify-between gap-4 py-4"
                >
                  {club.slug ? (
                    <Link
                      href={`/club/${club.slug}`}
                      className="font-bold transition-colors hover:text-accent-ink"
                    >
                      {club.name}
                    </Link>
                  ) : (
                    <span className="font-bold">{club.name}</span>
                  )}
                  {roleLabel && <span className="annot">{roleLabel}</span>}
                </li>
              );
            })}
            <li className="rule-t" />
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            {isOwnProfile
              ? "You are not in a club yet. Club pages list how to join."
              : "Not a member of any club yet."}
          </p>
        )}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Uploads</h2>
          {isOwnProfile && canUpload && (
            <Link
              href="/upload"
              className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Upload a file
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
            title="Nothing uploaded yet"
            description={
              isOwnProfile
                ? "Share a course, a TD or a corrected exam and it will show up here."
                : "This student has not uploaded anything yet."
            }
          />
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-2xl font-bold">Favorites</h2>

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
            title="No favorites yet"
            description="Heart a file anywhere in the archive and it will be saved here for quick access."
          />
        )}
      </section>
    </main>
  );
}
