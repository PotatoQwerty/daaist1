import type { Metadata } from "next";
import "@/app/globals.css";
import { Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
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
  display: "swap",
});

// The annotation face: years, file sizes, counts, dates. Kept to
// the utility role so it never competes with Kabel for display.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
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

// maximumScale and userScalable were removed: locking zoom breaks
// pinch-to-zoom for low-vision users and fails WCAG 1.4.4.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userContext = await getUserContext();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${josefin.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Adobe Fonts kit carrying neue-kabel. Preconnecting lets the
            font request start before the CSS finishes parsing, which an
            @import inside globals.css could not do. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/eef1cbb.css" />
        {/* Scroll reveals start at opacity 0 and are switched on by an
            IntersectionObserver. With scripting off nothing would ever
            switch them on, so the content is forced visible instead. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="kabel-reg antialiased">
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
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Toaster position="top-right" />
            <Navbar />
            <div id="main" className="min-h-[60vh]">
              {children}
            </div>
            <ChatBubble />
            <Footer />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
