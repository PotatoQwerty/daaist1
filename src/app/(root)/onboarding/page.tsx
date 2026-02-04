import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";
import { isOnboarded } from "@/lib/supabase/actions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Daa'ist - Onboarding",
  description: "Complete your profile to start using Daa'ist",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect("/");

  const onboarded = await isOnboarded(user.id);
  if (onboarded) redirect("/");

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-2 md:items-start">
        <section className="order-2 md:order-1 relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-10">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-accent/15" />
            <div className="absolute -top-20 -right-24 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Onboarding
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">
            Welcome to Daa&apos;ist
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Complete your profile to unlock courses, projects, clubs, and shared
            documents.
          </p>

          <div className="mt-8 space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <p>
                Choose a username that will appear on your profile and uploads.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <p>Add your study year for personalized quick access.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <p>
                If you study in DAA, we&apos;ll auto-fill your name after
                verification.
              </p>
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            This takes about a minute. You can update your profile later.
          </p>
        </section>

        <section className="order-1 md:order-2 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <OnboardingForm />
          </div>
        </section>
      </div>
    </main>
  );
}
