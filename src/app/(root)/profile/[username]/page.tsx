import {
  getUserByUsername,
  getUserByUserId,
  getUserByChatUsername,
  getFilesByUserId,
  getLikedFiles,
  getUserClubsByUserId,
} from "@/lib/data";
import ProfileClient from "@/components/ProfileClient";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const title = `Daa'ist — ${username}'s profile`;
  const description = `${username}'s uploads and liked files on Daa'ist.`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
  };
}
export default async function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // 1. Fetch user first to get ID
  const userData =
    (await getUserByUsername(username)) ||
    (await getUserByUserId(username)) ||
    (await getUserByChatUsername(username));

  if (!userData) {
    notFound();
  }

  if (userData.username && userData.username !== username) {
    redirect(`/profile/${userData.username}`);
  }

  // 2. Fetch files and likes in parallel
  const [uploads, likes, clubs] = await Promise.all([
    getFilesByUserId(userData.user_id),
    getLikedFiles(userData.user_id),
    getUserClubsByUserId(userData.user_id),
  ]);

  const initialUser = {
    ...userData,
    uploads,
    likes,
    clubs,
  };

  return <ProfileClient initialUser={initialUser} />;
}
