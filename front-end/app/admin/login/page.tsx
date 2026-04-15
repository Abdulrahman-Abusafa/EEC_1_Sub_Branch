"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="fixed top-8 right-8 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel bg-white/70 dark:bg-zinc-900/50 dark:border-white/10 shadow-xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Access the EEC management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-neon-blue to-purple-600 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
