"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
import { Users, Calendar, BookOpen, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    courses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [membersRes, eventsRes, coursesRes] = await Promise.all([
          fetch(`${API_BASE}/members`).catch(() => null),
          fetch(`${API_BASE}/events`).catch(() => null),
          fetch(`${API_BASE}/courses`).catch(() => null),
        ]);

        const members = membersRes?.ok ? await membersRes.json() : [];
        const events = eventsRes?.ok ? await eventsRes.json() : [];
        const courses = coursesRes?.ok ? await coursesRes.json() : [];

        setStats({
          members: members.length || 0,
          events: events.length || 0,
          courses: courses.length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to the EEC Admin Portal. Here is a summary of the club's data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Total Members"
          value={loading ? "-" : stats.members}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={loading ? "-" : stats.events}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={loading ? "-" : stats.courses}
          color="from-orange-500 to-red-500"
        />
      </div>

      <div className="mt-12 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="text-neon-blue" />
          <h2 className="text-xl font-bold dark:text-white">Quick Actions</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use the sidebar to manage events, members, and course resources. 
          Make sure your local backend is running on port 4000 for these functions to work.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform cursor-default">
      <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
        <Icon size={32} />
      </div>
      <h3 className="text-3xl font-bold dark:text-white mb-1 font-[family-name:var(--font-orbitron)]">{value}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
