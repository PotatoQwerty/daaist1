"use client";

import Loading from "@/components/Loading";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Home() {
  const { data: session, status } = useSession();

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
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO SECTION */}
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
            { name: "Courses", color: "bg-primary", icon: "📘" },
            { name: "Projects", color: "bg-accent", icon: "🏗️" },
            { name: "Clubs", color: "bg-primary", icon: "🎨" },
            { name: "Exams", color: "bg-accent", icon: "📝" },
          ].map((item) => (
            <div
              key={item.name}
              className={`${item.color} rounded-2xl p-8 flex flex-col items-center text-center hover:scale-105 transition`}
            >
              <span className="text-4xl mb-3">{item.icon}</span>
              <h3 className="font-semibold text-lg">{item.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST UPLOADS */}
      <section className="bg-background py-16 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Latest Uploads
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-5 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg mb-2">Project {i}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  A newly added architecture project from Year 3 students.
                </p>
                <span className="text-accent text-sm font-medium">
                  View Details →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold mb-8 text-center">Upcoming Events</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold mb-2">Workshop {i}</h3>
              <p className="text-sm text-gray-700">
                Join the hands-on model making workshop hosted by Club Archi.
              </p>
              <span className="block mt-4 text-indigo-600 text-sm font-medium">
                Learn more →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED STUDENT / CLUB */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-700 py-20 text-white text-center">
        <h2 className="text-2xl font-bold mb-6">Featured Club</h2>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-md">
            <h3 className="text-xl font-semibold mb-2">ArchiDesign Club</h3>
            <p className="text-sm text-gray-200 mb-4">
              Promoting creative thinking and design exploration through
              collaborative workshops and exhibitions.
            </p>
            <button className="px-6 py-2 bg-white text-indigo-700 font-medium rounded-lg shadow hover:bg-gray-100 transition">
              Discover More
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
