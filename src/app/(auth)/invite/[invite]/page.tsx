"use client";
import { createClient } from "@/lib/supabase/client";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminOnboarding from "../../_components/AdminOnboarding";

function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState<boolean>(false);
  const params = useParams();
  const rawTokenFromUrl = params.invite;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSession(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleValidate = async () => {
      if (!rawTokenFromUrl) return;
      const res = await fetch("/api/admin/invite/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: rawTokenFromUrl }),
      });

      if (res.ok) {
        setIsValid(true);
      }
    };
    handleValidate();
  }, [session, rawTokenFromUrl]);

  if (loading) return <div>Loading...</div>;

  if (!session)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <button
          className="p-2 bg-accent rounded-lg hover:opacity-80 transition ease-in-out duration-200"
          type="button"
          onClick={() =>
            createClient().auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/admin-invite/${rawTokenFromUrl}`,
              },
            })
          }
        >
          Sign in with google
        </button>
      </div>
    );
  if (!isValid) return notFound();
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <AdminOnboarding token={rawTokenFromUrl} />
    </div>
  );
}

export default Page;
