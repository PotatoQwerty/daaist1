"use client";

import { useEffect, useState } from "react";

export function useIsOnBoarded() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return { onboarded, loading };
}
