import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.supabaseUrl as string,
    secret: process.env.supabaseServiceRoleKey as string,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // Add your custom fields here:
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.isdaa = user.isdaa;
      session.user.studyyear = user.studyyear;
      session.user.onboarded = user.onboarded;
      session.user.username = user.username;
      session.user.bio = user.bio;
      return session;
    },
  },
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
