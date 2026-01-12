import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(auth)/_components/AppSideBar";
import { Toaster } from "react-hot-toast";
import { notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
import { UserProvider } from "@/context/user-context";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);

  if (!isAdmin && !isSuperAdmin) notFound();
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
              <UserProvider>{children}</UserProvider>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
