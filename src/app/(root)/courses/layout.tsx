import type { Metadata } from "next";
import { NOINDEX } from "@/lib/site";

/**
 * Course material sits behind a student account, so none of it should be
 * indexed. Set here rather than on each page because this subtree contains
 * only gated routes - /courses and /courses/[...id] both return the
 * AccessGate to a signed-out visitor.
 *
 * Deliberately not on the (root) layout: that one also wraps the public
 * home, club and event pages.
 */
export const metadata: Metadata = { robots: NOINDEX };

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
