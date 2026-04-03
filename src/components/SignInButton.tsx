"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type SignInButtonProps = {
  className?: string;
  children?: ReactNode;
  redirectTo?: string;
};

export default function SignInButton({
  className,
  children,
  redirectTo = "/",
}: SignInButtonProps) {
  const supabase = useMemo(() => createClient(), []);

  const handleSignIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(
          redirectTo,
        )}`,
      },
    });
  };

  return (
    <button type="button" onClick={handleSignIn} className={className}>
      {children || "Sign in"}
    </button>
  );
}
