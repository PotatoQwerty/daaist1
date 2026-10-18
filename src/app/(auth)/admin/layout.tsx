import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(auth)/_components/AppSideBar";
import { Toaster } from "react-hot-toast";
import { notFound } from "next/navigation";
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
  title: `Daa'ist | Admin Dashboard`,
  robots: NOINDEX,
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userContext = await getUserContext();

  if (!userContext.session?.user?.id) notFound();
  if (!userContext.isAdmin && !userContext.isSuperAdmin) notFound();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${josefin.variable} ${plexMono.variable}`}
    >
      {/* Admin is a separate document root, so it needs its own copy of
          the font wiring. Without this the Typekit kit never loads here
          and the dashboard falls back to Josefin. */}
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
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <main className="flex min-h-[100dvh] w-full flex-col bg-background">
              <div className="rule-b flex items-center gap-3 px-4 py-3">
                <SidebarTrigger />
                <span className="annot">Admin</span>
              </div>
              <Toaster position="top-right" />
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
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
