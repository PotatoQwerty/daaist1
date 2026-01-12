"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
export function useIsOnBoarded() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(undefined);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(session);
      setSession(session);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // Wait for session load attempt

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
  }, [session]);

  return { onboarded, loading };
}
