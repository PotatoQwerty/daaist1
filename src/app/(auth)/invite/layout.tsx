import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import { UserProvider } from "@/context/user-context";
import { getUserContext } from "@/lib/supabase/user-context";
import { NOINDEX } from "@/lib/site";

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
  title: `Daa'ist | Admin Sign up`,
  robots: NOINDEX,
};
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userContext = await getUserContext();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${josefin.variable} ${plexMono.variable}`}
    >
      {/* Its own document root, so it carries its own font wiring. */}
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/eef1cbb.css" />
      </head>
      <body className="kabel-reg antialiased">
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          defaultTheme="system"
        >
          <main className="kabel-reg w-full min-h-[100dvh] bg-background">
            <UserProvider
              initialSession={userContext.session}
              initialUser={userContext.user}
              initialRoles={userContext.roles}
              initialIsAdmin={userContext.isAdmin}
              initialIsSuperAdmin={userContext.isSuperAdmin}
            >
              {children}
            </UserProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
