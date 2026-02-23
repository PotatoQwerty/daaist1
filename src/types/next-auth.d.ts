declare module "next-auth" {
  interface Session {
    user: {
      user_id?: string;
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      studyYear?: string;
      isdaa?: boolean;
      onboarded?: boolean;
      username?: string;
      bio?: string;
      firstname?: string;
      lastname?: string;
      uploads: string[];
      likes: string[];
    };
  }
  export interface User {
    user_id?: string;
    id: string;
    firstname?: string;
    lastname: string;
    role?: string;
    studyyear?: string;
    isdaa?: boolean;
    username?: string;
    registration_number?: string;
    onboarded?: boolean;
    bio?: string;
    uploads: string[];
    likes: string[];
  }
}
type FileCategory = "td" | "course" | "exam" | "other" | "doc";

import type { LevelKey } from "@/constants/uploadConstants";

export interface File {
  id: string;
  file_name: string;
  username?: string;
  uploaded_by?: string;
  size: number;
  url: string;
  create_at?: Date;
  category: FileCategory;
  level: LevelKey;
  subject: string;
  type: string;
  issum?: boolean;
  title?: string;
  handleLike?: () => void;
  isLiked?: boolean;
}
