import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import Script from 'next/script';
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
  title: "TinkerWithTech Blog",
  description: "Extended write-ups and supplementary guides by TinkerWithTech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col items-center selection:bg-accent/30 selection:text-accent`}
      >
        <div className="w-full max-w-2xl px-6 py-12 md:py-20 flex flex-col flex-grow overflow-x-hidden">
          <nav className="flex items-center justify-between mb-16 text-sm font-medium text-secondary/70">
            <Link href="/" className="hover:text-accent transition-colors">
              TinkerWithTech
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-accent transition-colors">home</Link>
              <Link href="/episodes" className="hover:text-accent transition-colors">episodes</Link>
            </div>
          </nav>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="mt-20 pt-8 border-t border-foreground/10 text-xs text-foreground/50 text-center">
            &copy; {new Date().getFullYear()} TinkerWithTech. All rights reserved.
          </footer>
        </div>
        <Script
          src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"
          strategy="afterInteractive"
        />
        <Script id="kofi-widget" strategy="afterInteractive">
          {`kofiwidget2.init('Support me on Ko-fi', '#ff6501', 'Y8Y51KQK8E');
          kofiwidget2.draw();`}
        </Script>
      </body>
    </html>
  );
}
