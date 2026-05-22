import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";

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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Pixelify+Sans:wght@400;500;600;700&family=VT323&display=swap"
          rel="stylesheet"
        />
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
