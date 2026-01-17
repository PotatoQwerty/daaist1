import type { Metadata } from "next";
import "@/app/globals.css";
import { Josefin_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/Footer";
import ChatBubble from "@/components/ChatBubble";
import { UserProvider } from "@/context/user-context";
import { getUserContext } from "@/lib/supabase/user-context";
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
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userContext = await getUserContext();

  return (
    <html lang="en" suppressHydrationWarning className={`${josefin.variable}`}>
      <body className="kabel-reg">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <UserProvider
            initialSession={userContext.session}
            initialUser={userContext.user}
            initialRoles={userContext.roles}
            initialIsAdmin={userContext.isAdmin}
            initialIsSuperAdmin={userContext.isSuperAdmin}
          >
            <Toaster position="top-right" />
            <Navbar />
            {children}
            <ChatBubble />
          </UserProvider>
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
