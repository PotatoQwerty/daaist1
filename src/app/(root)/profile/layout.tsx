import type { Metadata } from "next";
import { NOINDEX } from "@/lib/site";

/**
 * Profiles require a session and the URL itself is a username, so neither
 * the page nor the address should reach an index. Covers /profile (which
 * redirects to the signed-in user's own page) and /profile/[username].
 */
export const metadata: Metadata = { robots: NOINDEX };

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
