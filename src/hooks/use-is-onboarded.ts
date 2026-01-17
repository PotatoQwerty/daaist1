"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/user-context";

export function useIsOnBoarded() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { session, loading: sessionLoading } = useUser();

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/users/onboarded", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch onboarded status");

        const data = await res.json();
        setOnboarded(data.onboarded);
      } catch (err) {
        console.error(err);
        setOnboarded(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [session, sessionLoading]);

  return { onboarded, loading };
}
