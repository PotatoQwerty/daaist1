import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function ProfileRedirectPage() {
  const session = await getServerSession(authOptions);

  // If not logged in → go to login
  if (!session) {
    redirect("/login");
  }

  // Redirect logged-in user to their public profile
  redirect(`/profile/${session.user.username}`);
}
