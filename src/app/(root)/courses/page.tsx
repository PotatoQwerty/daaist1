import { yearOptions } from "@/constants/uploadConstants";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "@/components/SignInButton";
export const metadata = {
  title: "Daa'ist — Courses by Year",
  description:
    "Explore courses, resources, and materials for all academic years.",
  alternates: {
    canonical: "https://daaist.com/courses",
  },
};
export default async function Courses() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-accent/30 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Access restricted
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be signed in to view courses and resources.
          </p>
          <div className="flex items-center justify-center gap-3">
            <SignInButton
              className="inline-flex items-center px-4 py-2 bg-accent text-background rounded-md shadow-sm hover:brightness-95 transition"
            >
              Sign in
            </SignInButton>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-accent/20 rounded-md text-foreground hover:bg-accent/5 transition"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-background to-accent/10 flex flex-col items-center px-4 py-10">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-foreground">
        View Courses by Year
      </h1>

      {/* Grid of Years */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {yearOptions.map((item) => (
          <Link
            key={item.value}
            href={`/courses/${item.value}`}
            className="relative flex flex-col items-center justify-center w-full h-[220px] rounded-2xl bg-card border border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="absolute inset-0 bg-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <span className="text-xl font-semibold text-foreground relative z-10">
              {item.label}
            </span>

            <span className="text-sm text-muted-foreground mt-1 relative z-10">
              Explore resources
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
