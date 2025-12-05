import { getUserByUsername, getFilesByUserId, getLikedFiles } from "@/lib/data";
import ProfileClient from "@/components/ProfileClient";

export default async function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // 1. Fetch user first to get ID
  const userData = await getUserByUsername(username);

  if (!userData) {
    // Render not found state directly or use Next.js notFound()
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <p>User not found 😕</p>
      </div>
    );
  }

  // 2. Fetch files and likes in parallel
  const [uploads, likes] = await Promise.all([
    getFilesByUserId(userData.id),
    getLikedFiles(userData.id),
  ]);

  // 3. Construct the full user object expected by the client
  const initialUser = {
    ...userData,
    uploads,
    likes,
  };

  return <ProfileClient initialUser={initialUser} username={username} />;
}
