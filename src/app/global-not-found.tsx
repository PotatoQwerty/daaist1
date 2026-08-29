import type { Metadata } from "next";
import "@/app/globals.css";
import { Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Page not found - Daa'ist",
  robots: { index: false, follow: false },
};

/**
 * 404 for URLs that match no route group at all.
 *
 * Without this, Next serves its own built-in page: a bare <html> with no
 * stylesheet, no fonts and no navigation. It has to render the full
 * document itself because it sits above every layout, so the font wiring
 * is repeated here on purpose.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${josefin.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/eef1cbb.css" />
      </head>
      <body className="kabel-reg antialiased">
        <div className="brand-band" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <main className="mx-auto flex min-h-[calc(100dvh-4px)] w-full max-w-[1400px] items-center px-4 py-16 sm:px-6">
          <div className="max-w-xl">
            <p className="font-mono text-sm text-muted-foreground tabular-nums">
              404
            </p>
            <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">
              That page isn&apos;t here.
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              The link may be out of date, or the file may have been removed.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
              >
                Back to home
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 font-bold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
