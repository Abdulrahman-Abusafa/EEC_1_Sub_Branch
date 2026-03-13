"use client";

import React, { useState, useEffect } from "react";
import { TiltCard } from "@/components/ui/3DTiltCard";
import Link from "next/link";
import { Search, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { fetchCourses, Course } from "@/lib/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AcademicsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses().then(setCourses).finally(() => setLoading(false));
  }, []);

  // Derive unique sorted levels from API data
  const levels = [...new Set(courses.map(c => c.level))].sort((a, b) => a - b);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.course_name.toLowerCase().includes(search.toLowerCase()) ||
      course.title.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter ? course.level === levelFilter : true;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="py-12 px-6 max-w-7xl mx-auto flex flex-col gap-12">
      <div className="flex flex-col gap-6 text-center items-center">
        <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)]">
          Academics
        </h1>
        <p className="text-gray-600 dark:text-white/60 max-w-xl">
          Complete repository of courses, past exams, and tutorials.
        </p>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for EE201, Circuits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full py-3 pl-12 pr-6 text-gray-900 dark:text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-gray-500 dark:placeholder:text-white/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                className={`px-6 py-3 rounded-full border transition-all flex items-center gap-2 ${
                  levelFilter === level
                    ? "bg-white text-black border-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10"
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-white/30 font-mono">
          No courses found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, i) => (
            <motion.div
              key={course.course_name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/academics/${encodeURIComponent(course.course_name)}`}>
                <TiltCard className="h-full flex flex-col gap-4 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl group-hover/card:bg-black/10 dark:bg-white/10 transition-colors border border-black/5 dark:border-white/5">
                      <BookOpen className="w-6 h-6 text-gray-800 dark:text-white/80 group-hover/card:text-neon-blue" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-black/10 dark:bg-white/5 text-gray-600 dark:text-white/40 border border-black/10 dark:border-white/5">
                      L{course.level}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] group-hover/card:text-neon-blue transition-colors">
                      {course.course_name}
                    </h2>
                    <p className="text-gray-600 dark:text-white/60 text-lg group-hover/card:text-gray-900 dark:text-white transition-colors">
                      {course.title}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-neon-blue opacity-0 group-hover/card:opacity-100 transition-opacity transform translate-x-[-10px] group-hover/card:translate-x-0">
                    <span className="text-sm font-bold">View Resources</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </div>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
