import Link from "next/link";
import SignInButton from "@/components/SignInButton";

/**
 * Shown where content requires a session. Previously duplicated, with
 * drifting copy, on /courses and /docs.
 */
export default function AccessGate({
  what = "this section",
  redirectTo = "/",
}: {
  /** Names the thing behind the gate, so the message is specific. */
  what?: string;
  redirectTo?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[1400px] items-center px-4 py-16 sm:px-6">
      <div className="max-w-lg">
        <div className="h-1 w-16 bg-accent" aria-hidden="true" />
        <h1 className="mt-6 text-4xl leading-tight font-bold">
          Sign in to open {what}.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Course material and documents are shared between DAA students, so
          they sit behind a student account.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <SignInButton
            redirectTo={redirectTo}
            className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Sign in
          </SignInButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
