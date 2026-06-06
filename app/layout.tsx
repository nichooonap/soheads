import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import CookieConsentBanner from "@/components/cookie-consent";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "soheads — discover Sorare dream squads",
  description: "Browse top voted Sorare squads or build your own. Mix any players, rarities and seasons — no rules.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${spaceGrotesk.variable} font-sans min-h-full flex flex-col`}>
        <Providers>
          <CookieConsentBanner />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
