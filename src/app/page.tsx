"use client";

import Loading from "@/components/Loading";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Home() {
  const { data: session, status } = useSession();
  console.log(session);

  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated" && session?.user?.onboarded === false) {
      router.push("/onboarding");
    }
  });
  // loading state
  if (status === "loading") {
    return <Loading />;
  }

  // not signed in
  if (status === "unauthenticated") {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center relative">
        <div className="w-3/4 h-3/4 bg-accent opacity-20 absolute -z-10" />
        <h1 className="font-bold text-2xl max-w-3xs sm:text-3xl sm:max-w-full">
          Daa&apos;ist — Built by Students, For Students.
        </h1>
        <p className="font-light text-xl sm:text-2xl max-w-3xs text-accent sm:max-w-full">
          Find documentation, past exams, and events at the Département
          d&apos;Architecture d&apos;Alger and more!
        </p>
        <button
          onClick={() => signIn("google")}
          className="w-32 h-32 rounded-full bg-primary text-white font-bold hover:scale-110 transition-all ease-in-out duration-200 m-3"
        >
          Let&apos;s get you Started!
        </button>
      </div>
    );
  }

  // authenticated
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <Loading />
      <h1 className="font-bold text-2xl">
        Welcome back, {session?.user?.username}
      </h1>
      <p className="mt-2">
        You&apos;re signed in — go to your profile or sign out.
      </p>
      <div className="mt-4">
        <button
          onClick={() => router.push("/profile")}
          className="mr-2 px-4 py-2 bg-accent text-white rounded"
        >
          Profile
        </button>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default Home;
