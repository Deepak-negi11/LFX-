import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteNav } from "@/components/site-nav";
import { themeInitScript } from "@/components/theme-toggle";
import { getSite } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });

const site = getSite();
const DESCRIPTION = `Unofficial explorer for Linux Foundation LFX Mentorship. Browse ${site.orgs.length} organizations and ${site.programCount.toLocaleString("en-US")} programs since ${site.years[0]}: past projects by year, required skills, paid or unpaid, and selected mentees.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LFX Mentorship organizations, year by year | LFX Orgs",
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "LFX Mentorship",
    "Linux Foundation mentorship",
    "LFX Mentorship organizations",
    "CNCF mentorship",
    "LF Decentralized Trust mentorship",
    "paid open source internship",
    "open source mentorship projects",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: "LFX Mentorship organizations, year by year",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "LFX Mentorship organizations, year by year",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script may set data-theme before React hydrates.
    <html lang="en" className={`${jakarta.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
          <SiteNav />
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        {/* Vercel Web Analytics: cookie-free page views; does nothing outside Vercel. */}
        <Analytics />
      </body>
    </html>
  );
}
