import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemedDialRoot } from "@/components/themed-dial-root";
import "dialkit/styles.css";
import { Providers } from "./providers";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-render",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Visual Poetry",
  description: "Turn your poems into generative art.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/branding/vp-favicon.svg",
    shortcut: "/branding/vp-favicon.svg",
    apple: "/branding/vp-favicon.svg",
  },
  openGraph: {
    title: "Visual Poetry",
    description: "Turn your poems into generative art.",
    url: "/",
    siteName: "Visual Poetry",
    images: [
      {
        url: "/branding/opengraph.png",
        alt: "Visual Poetry social preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Poetry",
    description: "Turn your poems into generative art.",
    images: ["/branding/opengraph.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#FFF4ED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
        <ThemedDialRoot />
      </body>
    </html>
  );
}
