"use client";

import Loading from "@/components/Loading";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MessageCard from "@/components/MessageCard";
import { useIsOnBoarded } from "@/hooks/use-is-onboarded";

export default function HomeClient() {
  const { onboarded, loading } = useIsOnBoarded();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && !loading && onboarded === false) {
      router.push("/onboarding");
    }
  }, [status, loading, onboarded, router]);

  if (status === "loading") return <Loading />;

  if (status === "unauthenticated") {
    return (
      <div className="w-full min-h-screen flex justify-center items-center p-4">
        <div className="relative w-[90%] sm:w-3/4 rounded-2xl bg-primary/60 flex flex-col items-center text-center space-y-4 p-6 sm:p-10">
          <MessageCard type="info" message="Please note..." />
          <h1 className="font-bold text-2xl sm:text-3xl text-foreground">
            Daa'ist — Built by Students
          </h1>
          <p className="font-light text-lg sm:text-xl text-white">
            Find documentation, past exams...
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-primary text-white font-bold hover:scale-110 transition"
          >
            Let&apos;s get you started!
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-tl from-primary to-accent text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Empowering Architecture Students
        </h1>
        <p className="max-w-2xl text-lg opacity-90 mb-8">
          Access shared courses, past exams, and creative projects — all in one
          community-driven space.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/courses"
            className="px-6 py-3 bg-white text-primary font-semibold rounded-xl shadow hover:bg-gray-100 transition"
          >
            Explore Courses
          </Link>
          <Link
            href="/club"
            className="px-6 py-3 border border-white font-semibold rounded-xl hover:bg-white/10 transition"
          >
            Join a Club
          </Link>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold mb-8 text-center">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              name: "Courses",
              color: "bg-primary",
              icon: "📘",
              link: "/courses",
            },
            {
              name: "Projects",
              color: "bg-accent",
              icon: "🏗️",
              link: "/projects",
            },
            { name: "Clubs", color: "bg-primary", icon: "🎨", link: "/club" },
            {
              name: "Documents",
              color: "bg-accent",
              icon: "📄",
              link: "/docs",
            },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.link}
              className={`${item.color} rounded-2xl p-8 flex flex-col items-center text-center hover:scale-105 transition`}
            >
              <span className="text-4xl mb-3">{item.icon}</span>
              <h3 className="font-semibold text-lg text-white">{item.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
