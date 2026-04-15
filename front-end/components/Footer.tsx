"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Github, Twitter, Linkedin, Mail } from "lucide-react";

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
              <div className="flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="EEC Logo" 
                  className="w-10 h-10 object-contain block dark:hidden" 
                />
                <img 
                  src="/logo_white.svg" 
                  alt="EEC Logo White" 
                  className="w-10 h-10 object-contain hidden dark:block" 
                />
              </div>
              <span className="font-[family-name:var(--font-orbitron)] font-bold tracking-wider text-gray-900 dark:text-white text-xl">
                EEC
              </span>
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
                <Link href="/team" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Team</Link>
                <Link href="/contact" className="text-gray-700 dark:text-white/60 hover:text-neon-blue transition-colors text-sm">Contact</Link>
             </div>
          </div>
        </div>

        <div className="h-px w-full bg-black/10 dark:bg-white/10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 dark:text-white/40 text-sm">
                © {new Date().getFullYear()} Electrical Engineering Club. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
                <SocialLink href="#" icon={Github} />
                <SocialLink href="#" icon={Twitter} />
                <SocialLink href="#" icon={Linkedin} />
                <SocialLink href="#" icon={Mail} />
            </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: import("lucide-react").LucideIcon }) {
    return (
        <a 
            href={href} 
            className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-gray-600 dark:text-white/60 hover:text-gray-900 dark:text-white hover:bg-neon-blue/20 hover:scale-110 transition-all"
        >
            <Icon className="w-5 h-5" />
        </a>
    )
}
