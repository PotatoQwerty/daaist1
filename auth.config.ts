import Google from "next-auth/providers/google";
import type { NextAuthConfig, Session, User } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.isDaa = user.isDaa;
      session.user.studyYear = user.studyyear;
      session.user.username = user.username;
      session.user.bio = user.bio;
      session.user.onboarded = user.onboarded;
      session.user.likes = user.likes;
      session.user.uploads = user.uploads;
      return session;
    },
  },
} satisfies NextAuthConfig;
