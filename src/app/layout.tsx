import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Salomon AI",
  description: "Financial copilot + on-chain token (Mint Club V2 on Base) gated premium insights/actions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/70 backdrop-blur dark:border-zinc-800 dark:bg-black/50">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight">
                Salomon AI
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link className="hover:underline" href="/token">
                  Token
                </Link>
                <Link className="hover:underline" href="/app">
                  App
                </Link>
                <a
                  className="hover:underline"
                  href="https://github.com/openwork-hackathon/team-salomon-ai"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
