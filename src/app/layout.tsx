import type { Metadata, Viewport } from "next";
import { Geist, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TodayCookie } from "@/components/offline/TodayCookie";
import { getRequestToday } from "@/lib/request-today";
import {
  DARK_THEME_COLOR,
  LIGHT_THEME_COLOR,
  themeBootstrapScript,
} from "@/lib/theme";
import { todayBootstrapScript } from "@/lib/calculations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Trackr",
    template: "%s · Trackr",
  },
  description: "Gym, sports, and supplement log",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trackr",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: LIGHT_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: DARK_THEME_COLOR },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = await getRequestToday();
  return (
    <html lang="en" data-accent="volt" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: todayBootstrapScript(today),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${outfit.variable} antialiased`}>
        <ThemeProvider>
          <TodayCookie serverToday={today} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
