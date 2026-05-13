import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BetterEveryday — Daily Growth Tracker",
  description:
    "Track skills, build projects, analyze gaps, and get brutally honest weekly reviews. Compound your growth — 1.01^365 = 37.8×",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0a0b0f" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
