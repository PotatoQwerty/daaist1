import { createClient } from "@/lib/supabase/auth/server";
import OnboardingForm from "@/components/OnboardingForm";
import { isOnboarded } from "@/lib/supabase/actions";
import { redirect } from "next/navigation";
import BrandMark from "@/components/BrandMark";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Daa'ist - Onboarding",
  description: "Complete your profile to start using Daa'ist",
  robots: {
    index: false,
    follow: false,
  },
};

// What the form actually asks for, in the order it asks. This is the
// only place on the site where a numbered list is honest: it is a
// sequence the person is about to walk through.
const STEPS = [
  "Pick a username. It appears on your profile and on anything you upload.",
  "Choose your study year, so your courses come up first.",
  "Tell us if you study at DAA. If you do, your name fills in after verification.",
];

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect("/");

  const onboarded = await isOnboarded(user.id);
  if (onboarded) redirect("/");

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <section className="order-2 lg:order-1">
          <BrandMark className="h-auto w-16 text-foreground" />

          <h1 className="mt-8 text-4xl leading-[1.05] font-bold sm:text-5xl">
            Set up your profile.
          </h1>
          <p className="mt-4 max-w-[48ch] text-base text-muted-foreground">
            Three questions, about a minute. You can change any of it later
            from your profile.
          </p>

          <ol className="mt-10">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="rule-t flex gap-5 py-5 text-sm leading-relaxed text-muted-foreground"
              >
                <span
                  className="font-mono text-xs text-foreground tabular-nums"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="rule-t" />
        </section>

        <section className="order-1 rounded-lg border border-border bg-card p-6 md:p-8 lg:order-2">
          <OnboardingForm />
        </section>
      </div>
    </main>
  );
}
