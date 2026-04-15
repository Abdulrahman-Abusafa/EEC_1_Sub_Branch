"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Calendar, BookOpen, LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide sidebar on the login page
  if (pathname === "/admin/login") return null;

  const handleLogout = async () => {
    // A simple hack: clear the cookie by setting maxAge to 0 via a client script or server action.
    // For simplicity, we just delete the cookie directly if we were to use a server action.
    // However, since it's HttpOnly, we need an API to destroy it. Let's create an inline small fetch or just remove it using a server action later.
    // Let's create a logout API quickly or just remove document.cookie if it wasn't httpOnly.
    // Since it's httpOnly, we'll do a quick fetch to clear it:
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-64 h-screen max-h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col z-40">
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-neon-blue rounded-lg p-2 text-white">
            <ShieldAlert size={24} />
          </div>
          <span className="font-bold text-xl font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-wide">
            Admin
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/admin");
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                isActive
                  ? "bg-neon-blue/10 text-neon-blue dark:text-neon-blue dark:bg-neon-blue/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon size={20} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
