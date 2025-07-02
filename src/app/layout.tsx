import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pre-Review - Epistemic Counterintelligence for Research Papers",
  description: "Serious review for serious thinkers. Peer review meets epistemic counterintelligence.",
  icons: {
    icon: "/favicon.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen gradient-bg">
          <header className="header">
            <div className="container">
              <nav className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <Image 
                    src="/logo.webp" 
                    alt="Pre-Review Logo" 
                    width={32} 
                    height={32}
                    className="logo"
                  />
                  <span className="text-xl font-semibold text-foreground">Pre-Review</span>
                </Link>
                
                <div className="flex items-center gap-6">
                  <Link href="/" className="nav-link">
                    Analyzer
                  </Link>
                  <Link href="/theory-lab" className="nav-link">
                    Theory Lab
                  </Link>
                  <Link href="/about" className="nav-link">
                    About
                  </Link>
                  <Link href="/contact" className="nav-link">
                    Contact
                  </Link>
                  <Link href="/" className="btn-primary">
                    Start Review
                  </Link>
                </div>
              </nav>
            </div>
          </header>
          
          <main className="main-content">
            <div className="container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

