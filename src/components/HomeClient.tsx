"use client";

import Loading from "@/components/Loading";
import Link from "next/link";
import { useUser } from "@/context/user-context";
import MessageCard from "@/components/MessageCard";
import { createClient } from "@/lib/supabase/client";

export default function HomeClient() {
  const { session, loading } = useUser();

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  if (loading) return <Loading />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO + VALUE */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/80 to-accent" />
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-28 left-0 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-white">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <p className="text-xs tracking-[0.35em] uppercase opacity-85">
                Architecture Community Hub
              </p>
              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                Daa&apos;ist
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Built by students for students — a focused space for courses,
                projects, clubs, and shared academic resources.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {!session ? (
                  <>
                    <button
                      title="Start using daaist"
                      className="px-6 py-3 bg-white text-primary font-semibold rounded-xl shadow-lg shadow-black/20 hover:-translate-y-0.5 transition"
                      type="button"
                      onClick={handleSignIn}
                    >
                      Start using Daa&apos;ist
                    </button>
                    <Link
                      href="/privacy"
                      className="px-6 py-3 border border-white/60 font-semibold rounded-xl hover:bg-white/10 transition"
                    >
                      Privacy policies
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/courses"
                      className="px-6 py-3 bg-white text-primary font-semibold rounded-xl shadow hover:bg-gray-100 transition"
                    >
                      Explore Courses
                    </Link>
                    <Link
                      prefetch={false}
                      href="/club"
                      className="px-6 py-3 border border-white/60 font-semibold rounded-xl hover:bg-white/10 transition"
                    >
                      Join a Club
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  title: "Courses & Exams",
                  desc: "Access shared courses, studio briefs, and past exams.",
                },
                {
                  title: "Projects & Portfolios",
                  desc: "Showcase your work and explore peer projects.",
                },
                {
                  title: "Clubs & Community",
                  desc: "Join clubs, events, and collaboration groups.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm opacity-90">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* APP INFO */}
      <section className="bg-muted py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Built by Students for Students</h2>
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

      {/* QUICK LINKS */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
          <h2 className="text-2xl font-bold">Quick Access</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Jump straight into the most-used areas. If a page is protected,
            you’ll be prompted to sign in.
          </p>
        </div>
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
              className={`${item.color} rounded-2xl p-7 flex flex-col items-start text-left border border-white/10 shadow-lg shadow-black/10 hover:-translate-y-1 hover:shadow-xl transition`}
            >
              <span className="text-3xl mb-3 drop-shadow-sm">
                {item.icon}
              </span>
              <h3 className="font-semibold text-lg text-white">{item.name}</h3>
              <p className="text-xs text-white/80 mt-1">Open section</p>
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST / FOOTNOTE */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto rounded-2xl border border-border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Built and maintained by the Archibenevoles club. Early access means
            you may see occasional issues.
          </p>
          {!session && (
            <button
              title="Start using daaist"
              className="px-5 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-primary/90 transition"
              type="button"
              onClick={handleSignIn}
            >
              Start using Daa&apos;ist
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
