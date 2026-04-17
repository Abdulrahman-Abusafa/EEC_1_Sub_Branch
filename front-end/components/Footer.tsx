"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="w-full border-t border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-lg mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-sm">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="grid items-center justify-center">
                <img 
                  src="/logo_white.PNG" 
                  alt="EEC Logo" 
                  className="h-32 md:h-48 w-auto object-contain col-start-1 row-start-1 transition-all duration-300 invert dark:invert-0" 
                />
              </div>

            </Link>
            <p className="text-gray-600 dark:text-white/60 text-sm">
              Empowering the next generation of electrical engineers with resources, community, and innovation.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-12">
             <div className="flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 dark:text-white font-[family-name:var(--font-orbitron)]">Platform</h3>
                <Link href="/academics" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Academics</Link>
                <Link href="/events" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Events</Link>
             </div>
             <div className="flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 dark:text-white font-[family-name:var(--font-orbitron)]">Club</h3>
                <Link href="/about" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">About Us</Link>
                <Link href="/about" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Team</Link>
                <Link href="/contact" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Contact</Link>
             </div>
          </div>
        </div>

        <div className="h-px w-full bg-black/10 dark:bg-white/10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
                <p className="text-gray-400 dark:text-white/40 text-sm">
                    © {new Date().getFullYear()} Electrical Engineering Club. All rights reserved.
                </p>
                <p className="text-gray-400 dark:text-white/30 text-xs">
                    Developed by <span className="text-neon-blue/70">Mazen Osama</span> &amp; <span className="text-neon-blue/70">Abdelrahman Abu Safa</span>
                </p>
            </div>
            <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/company/eec-kfupm/posts/?feedView=all" target="_blank" rel="noreferrer" className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-neon-blue/20 hover:scale-110 transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://x.com/EEC_KFUPM" target="_blank" rel="noreferrer" className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-neon-blue/20 hover:scale-110 transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
            </div>
        </div>
      </div>
    </footer>
  );
}
