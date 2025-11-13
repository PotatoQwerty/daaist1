"use client";

import { yearOptions } from "../../../../../constants/uploadConstants";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import PfpPlaceholder from "../../../../../public/images/placeholder.png";
import { Stars, UserIcon, ShieldUser, Loader2Icon } from "lucide-react";
import EditProfileButton from "@/components/EditProfileButton";
import ProfileBio from "@/components/EditProfileBio";
import DaaLogo from "@/components/DaaLogo";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useCurrentRole } from "@/hooks/use-current-role";
import type { User } from "next-auth";
import HorizontalUploads from "@/components/HorizontalUploads";
import HorizontalLikes from "@/components/HorizontalLikes";
export default function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const role = useCurrentRole();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();

        if (!res.ok) throw new Error("User fetch failed");

        // Keep a local variable
        const userData = data.user;

        const response = await fetch(`/api/files/${userData.id}`);
        const liked = await fetch(`/api/files/like/user/${userData.id}`);
        const likedData = await liked.json();

        const filesData = await response.json();

        // Merge both correctly
        setUser({
          ...userData,
          uploads: filesData.files,
          likes: likedData.likedFiles,
        });
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);
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
    if (!user) return;

    const isLiked = user.likes?.some((item) => item.id === fileId);

    // 🔹 Optimistic UI update (instant toggle)
    setUser((prev) =>
      prev
        ? {
            ...prev,
            likes: isLiked
              ? prev.likes.filter((item) => item.id !== fileId) // unlike
              : [...prev.likes, { id: fileId }], // like
          }
        : prev
    );

    try {
      const res = await fetch(`/api/files/like`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, fileId }),
        headers: { "Content-Type": "application/json" },
      });

      // 🔹 Optional: sync with backend response
      if (res.ok) {
        const data = await res.json();
        if (data.likedposts) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  likes: Array.isArray(data.likedposts)
                    ? data.likedposts
                    : prev.likes,
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error("Like/unlike failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2 text-gray-400">
        <Loader2Icon className="animate-spin size-6" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <p>User not found 😕</p>
      </div>
    );
  }
  const displayYear = yearOptions.find(
    (element) => element.value == user.studyyear
  );
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary to-[#f3f3f3] text-gray-900 flex flex-col items-center px-6 py-10">
      {/* Header */}
      <div className="relative w-full max-w-5xl bg-background shadow-lg rounded-3xl p-10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Profile Info */}
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-start md:gap-10">
          {/* Profile Image */}
          <div className="relative w-36 h-36 shrink-0">
            <Image
              src={user.image || PfpPlaceholder}
              alt="Profile"
              fill
              className="object-cover rounded-full border-4 border-accent shadow-lg"
              sizes="144px"
              priority
            />
            {session?.user.username === username && (
              <div className="absolute bottom-2 right-2">
                <EditProfileButton isOwnProfile />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 w-full">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {user?.name}
              </h1>
              <p className="text-gray-600">@{user?.username}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-sm font-medium bg-primary text-white px-3 py-1 rounded-full shadow-sm">
                {displayYear?.label}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-300">
                {user?.isDaa ? (
                  <Stars
                    className="size-5"
                    fill="var(--secondary)"
                    stroke="none"
                  />
                ) : user?.role === "admin" ? (
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
                  {user?.isDaa
                    ? `DAA'ist`
                    : user?.role === "admin"
                    ? `Admin`
                    : "Guest"}
                </span>
              </span>
            </div>

            <div className="mt-3 w-full max-w-sm">
              <ProfileBio
                actualBio={user?.bio || "No bio Yet"}
                isOwnProfile={session?.user.username === username}
              />
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
          {session?.user.username === username && role === "admin" && (
            <Link
              href="/upload"
              className="text-sm min-w-fit bg-secondary hover:bg-secondary/85 hover:text-white text-black font-semibold px-4 py-2 rounded-full shadow transition duration-300"
            >
              + Upload New
            </Link>
          )}
        </div>
        <HorizontalUploads uploads={user.uploads} handleDelete={handleDelete} />
      </section>

      {/* Favorites */}
      <section className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Favorites
          </h2>
        </div>

        <HorizontalLikes
          likes={user.likes} // the array of all the files
          liked={user.likes} // the state you maintain for which files are liked
          handleLike={handleLike} // the function that toggles like for a given file ID
        />
      </section>
    </div>
  );
}
