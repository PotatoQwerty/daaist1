"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import PfpPlaceholder from "../../../../../public/images/placeholder.png";
import { Stars, User, ShieldUser, Loader2Icon } from "lucide-react";
import EditProfileButton from "@/components/EditProfileButton";
import ProfileBio from "@/components/EditProfileBio";
import DaaLogo from "@/components/DaaLogo";
import UploadedCard from "@/components/UploadedCard";
import LikedCard from "@/components/LikedCard";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
export default function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  // const [files, setFiles] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();

        if (!res.ok) throw new Error("User fetch failed");

        // Keep a local variable
        const userData = data.user;

        const response = await fetch(`/api/files/${userData.id}`);
        const filesData = await response.json();

        // Merge both correctly
        setUser({ ...userData, uploads: filesData.files });
        // setFiles(filesData);
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
                5th Year (M2)
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
                  <User
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
                actualBio={user?.bio}
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
          {session?.user.username === username && (
            <Link
              href="/upload"
              className="text-sm bg-secondary hover:bg-[#e6b800] text-black font-semibold px-4 py-2 rounded-full shadow transition duration-300"
            >
              + Upload New
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.uploads.length ? (
            user?.uploads.map((i: any) => (
              <UploadedCard
                type={i.type}
                title={i.file_name}
                key={i.id}
                link={i.url}
                category={i.category}
                level={i.level}
                subject={i.subject}
                size={i.size}
                onDelete={() => handleDelete(i.url)}
              />
            ))
          ) : (
            <p className="text-gray-300 font-medium">Nothing posted yet 😔.</p>
          )}
        </div>
      </section>

      {/* Favorites */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Favorites
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.likedPosts?.length ? (
            user.likedPosts.map((i: any) => <LikedCard key={i} />)
          ) : (
            <p className="text-gray-300 font-medium">Nothing liked yet 😔.</p>
          )}
        </div>
      </section>

      <footer className="text-center text-sm text-gray-500 py-8">
        © 2025 DAA’ist
      </footer>
    </div>
  );
}
