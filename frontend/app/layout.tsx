import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Header from "../components/Header";
import { Web3Provider } from "../components/Web3Provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deeproof - The Invisible Fortress",
  description: "Secure, private identity verification infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground pt-16">
        <Web3Provider>
          <Header />
          <main>
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}

