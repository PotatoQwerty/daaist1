import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center px-6 py-16">
      <div className="max-w-lg">
        <p className="font-mono text-sm text-muted-foreground tabular-nums">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          Nothing here.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Either this admin page does not exist, or your account does not have
          access to it.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
