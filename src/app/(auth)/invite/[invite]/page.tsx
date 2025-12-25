"use client";
import { signIn, useSession } from "next-auth/react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminOnboarding from "../../_components/AdminOnboarding";
function Page() {
  const { data: session } = useSession();
  const [isValid, setIsValid] = useState<boolean>(false);
  const params = useParams();
  const rawTokenFromUrl = params.invite;
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
  if (!session)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <button
          className="p-2 bg-accent rounded-lg hover:opacity-80 transition ease-in-out duration-200"
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: `/admin-invite/${rawTokenFromUrl}`,
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
