import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth, { Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      // Add your custom fields here:
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.isDaa = user.isDaa;
      session.user.studyYear = user.studyYear;
      session.user.username = user.username;
      session.user.bio = user.bio;
      session.user.onboarded = user.onboarded;
      session.user.likedPosts = user.likedPosts;
      session.user.ownPosts = user.ownPosts;
      return session;
    },
  },
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
