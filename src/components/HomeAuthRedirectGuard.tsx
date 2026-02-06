"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useIsOnBoarded } from "@/hooks/use-is-onboarded";

export default function HomeAuthRedirectGuard() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useUser();
  const { onboarded, loading: onboardingLoading } = useIsOnBoarded();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (sessionLoading || onboardingLoading) return;
    if (!session) return;
    if (typeof onboarded !== "boolean") return;

    hasNavigated.current = true;

    if (!onboarded) {
      router.replace("/onboarding");
      return;
    }

    router.refresh();
  }, [onboardingLoading, onboarded, router, session, sessionLoading]);

  return null;
}
