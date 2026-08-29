"use client";

import Link from "next/link";
import Loading from "@/components/Loading";
import HomeView from "@/components/HomeView";
import { useUser } from "@/context/user-context";

const PRIMARY_CTA =
  "inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]";

const SECONDARY_CTA =
  "inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background";

export default function HomeClient() {
  const { session, loading } = useUser();

  if (loading) return <Loading />;
  if (!session) return null;

  return (
    <HomeView
      primaryAction={
        <Link href="/courses" className={PRIMARY_CTA}>
          Browse courses
        </Link>
      }
      secondaryAction={
        <Link href="/club" prefetch={false} className={SECONDARY_CTA}>
          See clubs
        </Link>
      }
    />
  );
}
