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
      likedposts: string[];
      ownPosts: string[];
      firstname?: string;
      lastname?: string;
    };
  }
  export interface User {
    firstname?: string;
    lastname: string;
    role?: string;
    studyyear?: string;
    isDaa?: boolean;
    username?: string;
    registration_number?: string;
    onboarded?: boolean;
    bio?: string;
    likedposts: string[];
    ownPosts: string[];
  }
}
type FileCategory = "doc" | "image" | "video" | "other";
import type { LevelKey } from "../../constants/uploadConstants";

export interface File {
  id: string;
  file_name: string;
  username?: string;
  uploaded_by: string;
  size: number;
  url: string;
  create_at?: Date;
  category: FileCategory;
  level: LevelKey;
  subject: string;
  type: string;
}
