import type { Metadata } from "next";
import "@/app/globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Josefin_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";
const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});
export const metadata: Metadata = {
  title: "Daa'ist",
  description: "Daa'ist the architect student library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body className="kabel-reg">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <SessionWrapper>
            <Navbar />
            {children}
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
