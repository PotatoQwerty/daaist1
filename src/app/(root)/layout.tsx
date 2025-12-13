import type { Metadata } from "next";
import "@/app/globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Josefin_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/Footer";
import ChatBubble from "@/components/ChatBubble";
import { auth } from "@/auth";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});

export const metadata: Metadata = {
  title: "Daa'ist",

  description:
    "Discover courses, past exams, design resources, documents, and club activities for architecture students at the Département d’Architecture d’Alger. Daa’ist brings academic content and student creativity together in one platform.",

  keywords: [
    "architecture students",
    "daaist",
    "Daa",
    "courses",
    "past exams",
    "design resources",
    "documents",
    "Alger architecture school",
    "Département d’Architecture d’Alger",
    "student clubs",
    "architecture projects",
    "studio materials",
  ],

  alternates: { canonical: "https://daaist.com/" },
};

// 1. ADD 'async' here
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body className="kabel-reg">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          {/* Optional: Pass session to wrapper to prevent flickering */}
          <SessionWrapper>
            <Toaster position="top-right" />
            <Navbar />
            {children}
            {/* Logic is perfect: Only show chat if logged in */}
            {session?.user && session?.user.isdaa && <ChatBubble />}
          </SessionWrapper>
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
