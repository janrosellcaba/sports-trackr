import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import { ServiceWorkerRegister } from "@/components/offline/ServiceWorkerRegister";
import { themeBootstrapScript, resolveAccentTheme } from "@/lib/theme";
import { getCurrentUser } from "@/app/actions/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trackr",
  description: "Minimalist workout & activity logger",
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
  themeColor: "#09090b",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const accent = resolveAccentTheme(user?.accentTheme).id;

  return (
    <html lang="en" data-accent={accent}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript(user?.accentTheme),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider initialTheme={user?.accentTheme}>
          <OfflineProvider>
            {children}
            <ServiceWorkerRegister />
          </OfflineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
