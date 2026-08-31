import type { Metadata } from "next";
import "@/app/globals.css";
import { Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/Footer";
import ChatBubble from "@/components/ChatBubble";
import JsonLd from "@/components/JsonLd";
import { UserProvider } from "@/context/user-context";
import { getUserContext } from "@/lib/supabase/user-context";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

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
  // Lets every nested page express canonical and OG URLs as relative paths
  // and have them resolved against the real origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Pages set a bare name ("Clubs") and get "Clubs | Daa'ist".
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Kept short and specific. A longer list was here before; terms nobody
  // searches for do nothing, and search engines have ignored this tag for
  // years - it is retained only because it is cheap and occasionally read
  // by non-Google crawlers.
  keywords: [
    "Daa'ist",
    "Département d'Architecture d'Alger",
    "architecture students Algiers",
    "architecture course material",
    "student clubs",
  ],
  // No social accounts are invented here; only what is verifiable.
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // The default for the public shell. Private pages override it, either
  // through their own layout or inline.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "fr_DZ",
    images: [OG_IMAGE],
  },
  twitter: {
    // No @handle is claimed - none is known to exist.
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/DAAIST-LOGO.svg",
  },
  /* No `alternates.canonical` here on purpose.
     A canonical set on this layout is inherited by every page under it,
     including the gated ones - which then rendered
     <link rel="canonical" href="https://daaist.com"> on /courses, /profile
     and the rest, telling crawlers those pages are duplicates of the home
     page. Each public page declares its own; the private ones declare none,
     which is the correct answer for a noindexed page. */
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
        {/* Only facts that are actually true of this site: its name, its
            origin, and a logo that exists. No address, no social profiles,
            no contact points are asserted. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: SITE_NAME,
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                inLanguage: "fr",
                publisher: { "@id": `${SITE_URL}/#organization` },
              },
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/images/DAAIST-LOGO.svg`,
              },
            ],
          }}
        />
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
