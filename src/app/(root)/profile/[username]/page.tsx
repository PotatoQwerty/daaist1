import { supabaseServer } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import PfpPlaceholder from "../../../../../public/images/placeholder.png";
import DaaistLogo from "../../../../../public/images/DAAIST-LOGO.svg";
import DaaistLogoDark from "../../../../../public/images/daalogodark.svg";
import { getServerSession } from "next-auth";
import { Heart, File, Stars, User, ShieldUser, Edit } from "lucide-react";
import EditProfileButton from "@/components/EditProfileButton";
import ProfileBio from "@/components/EditProfileBio";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DaaLogo from "@/components/DaaLogo";
import UploadedCard from "@/components/UploadedCard";
import LikedCard from "@/components/LikedCard";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}
export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  return {
    title: `${username}'s Profile | DAA’ist`,
  };
}
export default async function UserProfile({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  const { username } = await params;

  const { data: user, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <p>User not found 😕</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary to-[#f3f3f3] text-gray-900 flex flex-col items-center px-6 py-10">
      {/* ================= Header / Profile ================= */}
      <div className="relative w-full max-w-5xl bg-background shadow-lg rounded-3xl p-10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Profile Info */}
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-start md:gap-10">
          {/* Profile Image + Edit Button */}
          <div className="relative w-36 h-36 shrink-0">
            <Image
              src={user.image || PfpPlaceholder}
              alt="Profile"
              fill
              className="object-cover rounded-full border-4 border-accent shadow-lg"
              sizes="144px"
              priority
            />
            <div className="absolute bottom-2 right-2">
              <EditProfileButton
                isOwnProfile={session?.user.username === username}
              />
            </div>
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

            {/* Bio Section */}
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

      {/* ================= Uploaded Posts ================= */}
      <section className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Uploaded Projects
          </h2>
          {session && session.user.username === username ? (
            <Link
              href={"/upload"}
              className="text-sm bg-secondary hover:bg-[#e6b800] text-black font-semibold px-4 py-2 rounded-full shadow cursor-pointer transition duration-300 ease-in-out"
            >
              + Upload New
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.ownPosts?.length ? (
            <>
              {user.ownPosts.map((i) => {
                return <UploadedCard title={i.name} key={i.id} />;
              })}
            </>
          ) : (
            <>
              <p className="text-gray-300 font-medium">
                Nothing posted yet 😔.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ================= Liked Posts ================= */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Favorites
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {session?.user.likedPosts?.length ? (
            <>
              {session.user.likedPosts.map((i) => {
                return <LikedCard key={i} />;
              })}
            </>
          ) : (
            <>
              <p className="text-gray-300 font-medium">Nothing liked yet 😔.</p>
            </>
          )}
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="text-center text-sm text-gray-500 py-8">
        © 2025 DAA’ist
      </footer>
    </div>
  );
}
