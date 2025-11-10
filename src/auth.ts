import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth, { Session, User } from "next-auth";
import Google from "next-auth/providers/google";
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }),
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      // Add your custom fields here:
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.isDaa = user.isDaa;
      session.user.studyYear = user.studyyear;
      session.user.username = user.username;
      session.user.bio = user.bio;
      session.user.onboarded = user.onboarded;
      session.user.likedposts = user.likedposts;
      session.user.ownPosts = user.ownPosts;
      return session;
    },
  },
});
