import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Geist (sans) for body/UI copy
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Playfair Display (serif) for headings — gives the classic editorial feel.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "FreeMovieFinder — Find any movie. Watch it free.",
  description: "Search across Tubi, Pluto TV, YouTube, Plex and Crackle to find where to stream movies for free.",
  keywords: ["movies", "streaming", "free movies", "Tubi", "Pluto TV", "Plex", "Crackle", "YouTube"],
  authors: [{ name: "FreeMovieFinder" }],
  openGraph: {
    title: "FreeMovieFinder",
    description: "Find any movie. Watch it free.",
    siteName: "FreeMovieFinder",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // suppressHydrationWarning here ignores attributes injected by
        // browser extensions (e.g. Grammarly adds `data-gr-ext-installed`)
        // which would otherwise trigger React hydration mismatches.
        suppressHydrationWarning
        className={`${geistSans.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
