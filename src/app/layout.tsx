import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Qyntra — Personal Knowledge OS",
  description: "Your second brain, actually alive. Predicts what you'll read next.",
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
      </head>
      <body className="grain scanlines">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
