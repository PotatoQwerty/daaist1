import type { Metadata } from "next";
import { NOINDEX } from "@/lib/site";

/**
 * The registration pages are reachable without a session, but they are not
 * indexable: /register renders the visitor's own event passes - check-in
 * tokens included - once signed in, and /register/[eventId] is a form that
 * collects personal details. The public, linkable version of an event is
 * /events/[eventId], which is indexed instead.
 */
export const metadata: Metadata = { robots: NOINDEX };

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
