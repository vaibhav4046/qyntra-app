import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, Pixelify_Sans, VT323 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";

// Self-host Google Fonts via next/font so they don't block first paint and
// LCP doesn't wait on a third-party stylesheet round-trip.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-qyntra-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-qyntra-mono",
  display: "swap",
});
const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-qyntra-pixel",
  display: "swap",
});
const vt323 = VT323({ subsets: ["latin"], weight: ["400"], variable: "--font-qyntra-vt", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qyntra-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Qyntra — Personal Knowledge OS",
    template: "%s · Qyntra",
  },
  description:
    "Your own private Wikipedia, compiled from your Notion, Drive, Gmail, GitHub and desktop files. Cited answers, 3D galaxy view, Wikithon ’26 Finalist.",
  applicationName: "Qyntra",
  keywords: ["personal knowledge", "wiki", "RAG", "Notion", "Drive", "Gmail", "GitHub", "Wikithon"],
  manifest: "/manifest.webmanifest",
  authors: [{ name: "Vaibhav Lalwani", url: "https://vaibhavlalwani.vercel.app" }],
  creator: "Vaibhav Lalwani",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Qyntra",
    title: "Qyntra — Personal Knowledge OS",
    description: "Your own private Wikipedia, compiled from your apps. Wikithon ’26 Finalist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qyntra — Personal Knowledge OS",
    description: "Your own private Wikipedia. Cited answers. 3D galaxy view.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ff5b1f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = `${spaceGrotesk.variable} ${jetbrainsMono.variable} ${pixelifySans.variable} ${vt323.variable}`;
  return (
    <html lang="en" className={fontVars}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('qyntra:theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="grain scanlines">
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
