import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";
import { Josefin_Sans } from "next/font/google";

import { Toaster } from "react-hot-toast";

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
  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body>
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          defaultTheme="system"
        >
          <main className="kabel-reg w-full min-h-screen bg-background">
            <SessionWrapper>{children}</SessionWrapper>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
