import Link from "next/link";
import SignInButton from "@/components/SignInButton";
import HomeAuthRedirectGuard from "@/components/HomeAuthRedirectGuard";
import HomeView from "@/components/HomeView";

const PRIMARY_CTA =
  "inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]";

const SECONDARY_CTA =
  "inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background";

export default function HomeLoggedOut() {
  return (
    <>
      <HomeAuthRedirectGuard />
      <HomeView
        // One label per intent: "Sign in" is the only signup wording used
        // anywhere on this page, in the nav, and in the closing block.
        primaryAction={
          <SignInButton className={PRIMARY_CTA}>Sign in</SignInButton>
        }
        secondaryAction={
          <Link href="/club" prefetch={false} className={SECONDARY_CTA}>
            See clubs
          </Link>
        }
        notice={
          <p className="border-l-2 border-accent bg-background py-3 pl-4 text-sm text-foreground">
            This is an early version. Expect the occasional bug, and tell
            Archibénévoles when you hit one.
          </p>
        }
        closing={
          <section className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6">
            <div className="rule-t flex flex-col gap-6 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[40ch] text-2xl font-bold sm:text-3xl">
                Sign in with your student account to open the archive.
              </p>
              <SignInButton className={PRIMARY_CTA}>Sign in</SignInButton>
            </div>
          </section>
        }
      />
    </>
  );
}
