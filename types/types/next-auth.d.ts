import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      studyYear?: string;
      isDaa?: boolean;
      onboarded?: boolean;
      username?: string;
      bio?: string;
      likedPosts: string[];
      ownPosts: string[];
    };
  }
  interface User {
    role?: string;
    studyYear?: string;
    isDaa?: boolean;
    username?: string;
    onboarded?: boolean;
    bio?: string;
    likedPosts: string[];
    ownPosts: string[];
  }
}
