import {
  getUserByUsername,
  getUserByUserId,
  getUserByChatUsername,
  getFilesByUserId,
  getLikedFiles,
  getUserClubsByUserId,
} from "@/lib/data";
import ProfileClient from "@/components/ProfileClient";
import AccessGate from "@/components/AccessGate";
import { NOINDEX } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const title = `${username}'s profile`;
  const description = `${username}'s uploads and liked files on Daa'ist.`;

  return {
    title,
    description,
    robots: NOINDEX,
  };
}
export default async function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Profiles carry a real person's details and their upload history, so they
  // sit behind a student account like the rest of the archive. This page had
  // no check at all, which made every profile readable anonymously.
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  if (!viewer) {
    return (
      <AccessGate
        what="student profiles"
        redirectTo={`/profile/${encodeURIComponent(username)}`}
      />
    );
  }

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
