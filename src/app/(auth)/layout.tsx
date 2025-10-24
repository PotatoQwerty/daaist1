import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSideBar";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});
export const metadata: Metadata = {
  title: `Daa'ist || Admin Dashboard`,
};
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body>
        <ThemeProvider>
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <main className="kabel-reg">
              <SidebarTrigger />
              <SessionWrapper>{children}</SessionWrapper>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
