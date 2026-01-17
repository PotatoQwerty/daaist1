"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type SignInButtonProps = {
  className?: string;
  children?: ReactNode;
};

export default function SignInButton({
  className,
  children,
}: SignInButtonProps) {
  const supabase = useMemo(() => createClient(), []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <button type="button" onClick={handleSignIn} className={className}>
      {children || "Sign in"}
    </button>
  );
}
