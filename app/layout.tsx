import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SIH Explorer 2026", template: "%s · SIH Explorer 2026" },
  description: "A fast, resilient and searchable explorer for Smart India Hackathon 2026 problem statements."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}><body className="min-h-screen bg-neutral-50 font-sans">{children}<Analytics /></body></html>;
}
