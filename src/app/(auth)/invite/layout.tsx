import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans } from "next/font/google";
import { UserProvider } from "@/context/user-context";
import { Toaster } from "react-hot-toast";
import { getUserContext } from "@/lib/supabase/user-context";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});
export const metadata: Metadata = {
  title: `Daa'ist | Admin Sign up`,
  robots: {
    follow: false,
    index: false,
  },
};
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userContext = await getUserContext();

  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body>
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          defaultTheme="system"
        >
          <main className="kabel-reg w-full min-h-screen bg-background">
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
