"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <nav className="fixed top-6 inset-x-0 mx-auto z-50 w-[90%] max-w-4xl h-16 md:h-20 glass-panel bg-white/70 dark:bg-white/[0.02] rounded-full px-6 flex items-center justify-between shadow-lg dark:shadow-[0_0_20px_rgba(6,182,212,0.1)]">
        {/* Logo */}
        <Link href="/" className="relative flex items-center h-full w-28 md:w-40 shrink-0 group">
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-8 pointer-events-none h-32 w-48 md:h-48 md:w-72">
            <img 
              src="/logo_white.PNG" 
              alt="EEC Logo" 
              className="absolute inset-0 w-full h-full object-contain transition-all duration-500 invert dark:invert-0 drop-shadow-xl" 
            />
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/academics">Academics</NavLink>
          <NavLink href="/events">Events</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            className="md:hidden p-2 text-gray-800 dark:text-white/80 hover:text-gray-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 dark:bg-deep-space/95 backdrop-blur-3xl px-6 md:hidden flex flex-col items-center justify-center"
          >
            <div className="flex flex-col gap-6 items-center">
              <MobileNavLink
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </MobileNavLink>
              <MobileNavLink
                href="/academics"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Academics
              </MobileNavLink>
              <MobileNavLink
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Events
              </MobileNavLink>
              <MobileNavLink
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </MobileNavLink>
              <MobileNavLink
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </MobileNavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Simple check for active state
  const isActive = pathname === href || (pathname.startsWith(href) && href !== "/");

  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors",
        isActive ? "text-neon-blue" : "text-gray-700 dark:text-white/70 hover:text-gray-900 dark:text-white"
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_8px_var(--color-neon-blue)]"
        />
      )}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
    const pathname = usePathname();
    const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("text-2xl font-bold", isActive ? "text-neon-blue" : "text-gray-800 dark:text-white/80")}
    >
      {children}
    </Link>
  );
}
