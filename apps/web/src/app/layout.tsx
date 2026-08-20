import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { resolveBaseUrl } from "@/lib/config-check";

// Fonts are self-hosted (variable woff2 files in ./fonts) so production
// builds never depend on network access to Google Fonts.
const inter = localFont({
  src: "./fonts/Inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const playfair = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay.woff2", weight: "400 900", style: "normal" },
    { path: "./fonts/PlayfairDisplay-Italic.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const SITE_URL = resolveBaseUrl();
const SITE_NAME = "dontbeboringKE";
const SITE_DESCRIPTION =
  "Exceptional hotels, restaurants, events and golf clubs across Kenya — discover, book, and go.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: [
    "Kenya events", "Nairobi hotels", "Kenya restaurants", "Kenya golf clubs",
    "things to do in Nairobi", "Kenya event tickets", "Kenya hospitality",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
