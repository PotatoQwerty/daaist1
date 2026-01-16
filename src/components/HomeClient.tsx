"use client";

import Loading from "@/components/Loading";
import Link from "next/link";
import { useEffect, useState } from "react";
import MessageCard from "@/components/MessageCard";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function HomeClient() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [session, setSession] = useState<User | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await createClient().auth.getUser();
      const user = data.user;

      setSession(user);
      setSessionLoading(false);
    };

    fetchSession();
  }, []);

  if (sessionLoading) return <Loading />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* APP INFO SECTION - Always visible to explain app purpose for OAuth verification */}
      <section className="bg-muted py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold">Daa&apos;ist</h1>
          <h2 className="text-2xl font-bold">Built by Students for Students</h2>
          <p className="text-muted-foreground">
            Daa&apos;ist is a community-driven platform where architecture
            students at the Département d&apos;Architecture d&apos;Alger can
            share and access academic resources, collaborate on projects, join
            clubs, and connect with peers. Our mission is to empower students by
            centralizing educational materials and fostering collaboration
            within the architecture community.
          </p>
          {!session && (
            <MessageCard
              type="info"
              message="Please note that this website is developed and maintained by the club Archibenevoles. You might encounter some errors and bugs since you're using one of the earliest versions of this website."
            />
          )}
        </div>
      </section>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-linear-to-tl from-primary to-accent text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Empowering Architecture Students
        </h1>
        <p className="max-w-2xl text-lg opacity-90 mb-8">
          Access shared courses, past exams, and creative projects — all in one
          community-driven space.
        </p>

        {!session ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm opacity-80 max-w-md">
              Join Daa&#39;ist to contribute resources, join clubs, and connect
              with your peers at Département d’Architecture d’Alger.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/courses"
              className="px-6 py-3 bg-white text-primary font-semibold rounded-xl shadow hover:bg-gray-100 transition"
            >
              Explore Courses
            </Link>
            <Link
              prefetch={false}
              href="/club"
              className="px-6 py-3 border border-white font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Join a Club
            </Link>
          </div>
        )}
      </section>

      {/* QUICK LINKS - Visible to everyone, but likely redirected if protected by middleware/page logic, 
          but showing them here improves landing page content for Google. 
          If the links themselves are protected, user will be redirected to login upon click. */}
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
