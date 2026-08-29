"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminOnboarding from "../../_components/AdminOnboarding";
import { useUser } from "@/context/user-context";

type InviteState =
  | { status: "checking" }
  | { status: "invalid"; reason: string }
  | { status: "valid"; role: string; roleLabel: string };

function Page() {
  const { session, loading } = useUser();
  const params = useParams();

  // A catch-all param arrives as string | string[]; the token is the first
  // segment either way.
  const raw = params.invite;
  const token = Array.isArray(raw) ? raw[0] : raw;

  // The missing-token case is knowable at render, so it seeds the initial
  // state rather than being set from inside the effect.
  const [invite, setInvite] = useState<InviteState>(() =>
    token
      ? { status: "checking" }
      : { status: "invalid", reason: "No invite token in this link." },
  );

  useEffect(() => {
    if (!token) return;

    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/admin/invite/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (res.ok && data.valid) {
          setInvite({
            status: "valid",
            role: data.role,
            roleLabel: data.roleLabel ?? data.role,
          });
        } else {
          setInvite({
            status: "invalid",
            reason:
              data.error ?? "This invite link is invalid or has expired.",
          });
        }
      } catch {
        if (!active) return;
        setInvite({
          status: "invalid",
          reason: "Could not reach the server. Check your connection.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const signIn = useCallback(() => {
    // Routes through /auth/callback like every other sign-in on the site, so
    // the session cookie is set server-side, and lands back on this exact
    // invite. The previous target was /admin-invite/<token>, a route that does
    // not exist, so anyone not already signed in hit a 404 and lost the link.
    const origin = window.location.origin;
    const back = encodeURIComponent(`/invite/${token}`);

    createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?redirect_to=${back}` },
    });
  }, [token]);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );

  // The session and the token are checked in parallel; wait for both rather
  // than rendering a 404 on the first frame while validation is still in
  // flight, which is what the previous version did.
  if (loading || invite.status === "checking") {
    return shell(
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Checking your invite
      </p>,
    );
  }

  if (invite.status === "invalid") {
    return shell(
      <div>
        <div className="h-1 w-16 bg-accent" aria-hidden="true" />
        <h1 className="mt-6 text-3xl leading-tight font-bold">
          This invite can&apos;t be used.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{invite.reason}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite links last 24 hours and work once. Ask whoever sent it for a
          new one.
        </p>
      </div>,
    );
  }

  if (!session) {
    return shell(
      <div>
        <div className="h-1 w-16 bg-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl leading-tight font-bold">
          You&apos;ve been invited as {invite.roleLabel.toLowerCase()}.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Sign in with your Google account to accept. You&apos;ll come straight
          back here.
        </p>
        <button
          type="button"
          onClick={signIn}
          className="mt-8 w-full rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          Sign in with Google
        </button>
      </div>,
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center px-4">
      <AdminOnboarding token={token} roleLabel={invite.roleLabel} />
    </div>
  );
}

export default Page;
