import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

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

export const metadata: Metadata = {
  title: "dontbeboring",
  description: "Exceptional hotels, restaurants and events across Kenya.",
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
