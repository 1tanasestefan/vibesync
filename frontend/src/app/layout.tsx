import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "VibeSync | AI-Powered Music Discovery",
  description: "Translating your visual aesthetic and daily moods directly into curated Spotify playlists using Artificial Intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
