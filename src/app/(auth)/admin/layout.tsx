import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(auth)/_components/AppSideBar";
import { Toaster } from "react-hot-toast";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
import { UserProvider } from "@/context/user-context";
const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});
export const metadata: Metadata = {
  title: `Daa'ist | Admin Dashboard`,
  robots: {
    follow: false,
    index: false,
  },
};
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) notFound();
  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body>
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          defaultTheme="system"
        >
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <main className="kabel-reg w-full flex flex-col min-h-screen bg-background">
              <div className="p-4 bg-background">
                <SidebarTrigger />
              </div>
              <Toaster position="top-right" />
              <SessionWrapper>
                <UserProvider>{children}</UserProvider>
              </SessionWrapper>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
