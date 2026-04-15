import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EE Club",
  description: "Empowering the next generation of electrical engineers with resources, community, and innovation.",
  openGraph: {
    title: "Electrical Engineering Club (EEC)",
    description: "Empowering the next generation of electrical engineers with resources, community, and innovation.",
    url: "https://eec.com", // Replace with real URL later
    siteName: "EEC",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electrical Engineering Club (EEC)",
    description: "Empowering the next generation of electrical engineers.",
  },
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/logo.svg",
        href: "/logo.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/logo_white.svg",
        href: "/logo_white.svg",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${inter.variable} antialiased bg-gray-50 dark:bg-deep-space text-gray-900 dark:text-white overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <div className="fixed inset-0 z-[-1] pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/5 via-deep-space to-deep-space opacity-40"></div>
          </div>
          <Navbar />
          <main className="pt-24 min-h-screen flex flex-col">
              <div className="flex-grow">
                  {children}
              </div>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
