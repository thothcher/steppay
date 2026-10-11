import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — sandbox payments for students`, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b2a21",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
