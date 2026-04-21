"use client";

import React, { use } from "react";
import { ArrowLeft, BookOpen, Calculator, CheckCircle2, Play, FileText, Calendar, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { fetchCourses, fetchCourseResources, Course, Resource } from "@/lib/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// --- Types ---
type CourseMeta = {
    id: string;
    title: string;
    description: string;
    level: string;
    credits: number;
    instructor: string;
    schedule: string;
    difficulty: number;
    prerequisites: string[];
    objectives: string[];
    resources: {
        videos: { title: string; href: string }[];
        booksAndNotes: { title: string; href: string }[];
        oldExams: {
            major1: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
            major2: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
            final: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
        };
        other: { title: string; href: string }[];
    };
    exams: {
        major1: Date;
        major2: Date;
        final: Date;
    };
};

// Kept for the exam timer which uses real course dates from the API
type ExamDates = { major1: Date; major2: Date; final: Date };

function parseDates(course: Course): ExamDates {
    return {
        major1: course.major_1_date ? new Date(course.major_1_date) : new Date(),
        major2: course.major_2_date ? new Date(course.major_2_date) : new Date(),
        final: course.final_date ? new Date(course.final_date) : new Date(),
    };
}

type BookNoteEntry =
    | { type: 'single'; title: string; href: string }
    | { type: 'list'; groupTitle: string; items: { title: string; href: string }[] };

function groupResources(resources: Resource[]) {
    const videos: { title: string; href: string }[] = [];
    const booksAndNotes: BookNoteEntry[] = [];
    const oldExams: {
        major1: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
        major2: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
        final: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } };
    } = { major1: {}, major2: {}, final: {} };
    const other: { title: string; href: string }[] = [];
    const listGroups: Record<string, { title: string; href: string }[]> = {};

    resources.forEach(r => {
        const item = { title: r.resource_title, href: r.url };
        const cat = r.category?.toLowerCase();
        const subCat = r.sub_category?.toLowerCase();

        if (subCat === 'videos' || cat === 'lecture') {
            videos.push(item);
        } else if (subCat === 'books & notes' || cat === 'material') {
            if (r.unit) {
                if (!listGroups[r.unit]) listGroups[r.unit] = [];
                listGroups[r.unit].push(item);
            } else {
                booksAndNotes.push({ type: 'single', ...item });
            }
        } else if (cat === 'exam') {
            let examType = 'major1';
            const subCatLower = r.sub_category?.toLowerCase() ?? '';
            if (subCatLower.includes('major 2') || subCatLower.includes('major2')) examType = 'major2';
            else if (subCatLower.includes('final')) examType = 'final';

            const semester = r.semester || 'Unknown Semester';
            const chapter = r.chapter || 'General';

            if (!oldExams[examType as keyof typeof oldExams][semester]) {
                oldExams[examType as keyof typeof oldExams][semester] = {};
            }
            if (!oldExams[examType as keyof typeof oldExams][semester][chapter]) {
                oldExams[examType as keyof typeof oldExams][semester][chapter] = [];
            }
            oldExams[examType as keyof typeof oldExams][semester][chapter].push(item);
        } else {
            other.push(item);
        }
    });

    Object.entries(listGroups).forEach(([groupTitle, items]) => {
        booksAndNotes.push({ type: 'list', groupTitle, items });
    });

    return { videos, booksAndNotes, oldExams, other };
}



// --- Components ---

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-white/70", className)}>
            {children}
        </span>
    );
}

function DifficultyPeppers({ difficulty }: { difficulty: number }) {
    const maxPeppers = 5;
    const fullPeppers = Math.floor(difficulty);
    const hasFraction = difficulty % 1 !== 0;
    const fractionId = React.useId();

    return (
        <div className="flex items-center gap-1 mx-2" title={`Difficulty: ${difficulty} / 5`}>
            {Array.from({ length: maxPeppers }).map((_, i) => {
                const isFractional = i === fullPeppers && hasFraction;
                const fillPercentage = isFractional ? (difficulty % 1) * 100 : 0;
                const gradientId = `pepper-grad-${fractionId}`;

                return (
                    <svg key={i} viewBox="0 0 256 256" className={cn("w-5 h-5", i < fullPeppers ? "text-red-500" : "text-gray-300 dark:text-white/20")}>
                       {isFractional && (
                           <defs>
                               <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                   <stop offset={`${fillPercentage}%`} stopColor="#ef4444" /> {/* text-red-500 */}
                                   <stop offset={`${fillPercentage}%`} stopColor="rgba(255,255,255,0.2)" /> {/* text-gray-300 dark:text-white/20 */}
                               </linearGradient>
                           </defs>
                       )}
                       <path 
                           fill={isFractional ? `url(#${gradientId})` : "currentColor"} 
                           d="M228.62,49.25A12.08,12.08,0,0,0,218.89,44C198.54,44,179,53,165,65.8,143.83,49.43,118.81,41,88.1,44A12,12,0,0,0,77.34,57.19a48.8,48.8,0,0,1,16.27,34.05,108,108,0,0,0-57,118c-.83,3.8-3.32,7.39-4.83,11.37a12,12,0,0,0,15.2,15.2c4-1.51,7.57-4,11.37-4.83,38.19-10.23,73.42-30.82,100.28-57.87C174,136.19,165.71,114.39,150,94.94,161.42,81.33,180.76,68,206.87,68a12,12,0,0,0,12-12A45.39,45.39,0,0,1,228.62,49.25Z" 
                        />
                    </svg>
                );
            })}
        </div>
    );
}

function InfoCard({ icon: Icon, title, value, subValues }: { icon: import("lucide-react").LucideIcon, title: string, value?: string, subValues?: string[] }) {
    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/10 dark:border-white/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-neon-blue" />
                <h3 className="font-bold text-white/90">{title}</h3>
            </div>
            {value && <p className="text-gray-600 dark:text-white/60 ml-8">{value}</p>}
            {subValues && (
                <div className="flex gap-2 ml-8 mt-1">
                    {subValues.map((v, i) => (
                        <Badge key={i} className="bg-black/10 dark:bg-white/10 text-white/90 border-transparent">{v}</Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function OtherResourcesSection({ title, items, icon: Icon }: { title: string, items: { title: string, href: string }[], icon: import("lucide-react").LucideIcon }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <Icon className="w-5 h-5 text-neon-blue" />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white/90">{title}</h3>
                <span className="ml-auto text-xs font-mono text-gray-400 dark:text-white/30">{items.length} items</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item, i) => (
                    <a
                        key={i}
                        href={item.href}
                        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 hover:border-neon-blue/40 hover:bg-black/8 dark:hover:bg-white/[0.07] transition-all text-sm text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white truncate"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/50 group-hover:bg-neon-blue flex-shrink-0 transition-colors" />
                        <span className="truncate">{item.title}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}

function ContentSection({ title, items, icon: Icon }: { title: string, items: { title: string, href: string }[], icon: import("lucide-react").LucideIcon }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/10 dark:border-white/20 transition-colors h-full flex flex-col">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                     <Icon className="w-5 h-5 text-neon-blue" />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white/90">{title}</h3>
            </div>
            <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                    <a key={i} href={item.href} className="group p-4 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/[0.02] dark:hover:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-all flex items-center justify-between">
                        <span className="text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:text-white transition-colors text-sm">{item.title}</span>
                        <Play className="w-3 h-3 text-gray-300 dark:text-white/20 group-hover:text-neon-blue opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                ))}
            </div>
        </div>
    );
}

function VideosSection({ items }: { items: { title: string; href: string }[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/10 dark:border-white/20 transition-colors h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <Play className="w-5 h-5 text-neon-blue" />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white/90">Videos</h3>
            </div>
            <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                    <a key={i} href={item.href} className="group p-4 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/[0.02] dark:hover:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-all flex items-center justify-between">
                        <span className="text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:text-white transition-colors text-sm">{item.title}</span>
                        <Play className="w-3 h-3 text-gray-300 dark:text-white/20 group-hover:text-neon-blue opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                ))}
            </div>
        </div>
    );
}

function BooksAndNotesSection({ items }: { items: BookNoteEntry[] }) {
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
    if (!items || items.length === 0) return null;

    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 transition-colors h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <BookOpen className="w-5 h-5 text-neon-blue" />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white/90">Books & Notes</h3>
            </div>
            <div className="flex flex-col gap-3">
                {items.map((entry, i) => entry.type === 'single' ? (
                    <a key={i} href={entry.href} className="group flex items-center justify-between px-4 py-3 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/[0.02] dark:hover:bg-white/5 border border-black/5 dark:border-white/5 hover:border-neon-blue/30 transition-all">
                        <span className="text-sm text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{entry.title}</span>
                        <FileText className="w-3 h-3 text-gray-300 dark:text-white/20 group-hover:text-neon-blue transition-colors flex-shrink-0" />
                    </a>
                ) : (
                    <div key={i} className="rounded-xl border border-neon-blue/20 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenGroups(prev => ({ ...prev, [i]: !prev[i] }))}
                            className="w-full flex items-center justify-between px-4 py-3 bg-neon-blue/5 hover:bg-neon-blue/10 transition-colors"
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white/90">
                                <BookOpen className="w-4 h-4 text-neon-blue" />
                                {entry.groupTitle}
                                <span className="text-xs font-normal text-gray-400 dark:text-white/30 font-mono">{entry.items.length} files</span>
                            </span>
                            <ChevronDown className={`w-4 h-4 text-neon-blue transition-transform duration-200 ${openGroups[i] ? "rotate-180" : ""}`} />
                        </button>
                        {openGroups[i] && (
                            <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
                                {entry.items.map((item, j) => (
                                    <a key={j} href={item.href} className="group flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <span className="text-sm text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.title}</span>
                                        <FileText className="w-3 h-3 text-gray-300 dark:text-white/20 group-hover:text-neon-blue transition-colors flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function OldExamsSection({ exams }: { exams: { major1: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } }; major2: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } }; final: { [semester: string]: { [chapter: string]: { title: string; href: string }[] } } } }) {
    const hasExams = Object.values(exams).some(examType => Object.keys(examType).length > 0);
    if (!hasExams) return null;

    return (
        <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/10 dark:border-white/20 transition-colors h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <Calculator className="w-5 h-5 text-neon-blue" />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white/90">Old Exams</h3>
            </div>
            <div className="flex flex-col gap-4">
                {Object.entries(exams).map(([examType, semesters]) => {
                    if (Object.keys(semesters).length === 0) return null;
                    const examTitle = examType === 'major1' ? 'Major 1' : examType === 'major2' ? 'Major 2' : 'Final';
                    return (
                        <div key={examType} className="border-l-2 border-neon-blue/20 pl-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">{examTitle}</h4>
                            {Object.entries(semesters).map(([semester, chapters]) => (
                                <div key={semester} className="mb-3">
                                    <h5 className="text-sm font-medium text-gray-700 dark:text-white/70 mb-1">{semester}</h5>
                                    {Object.entries(chapters).map(([chapter, items]) => (
                                        <div key={chapter} className="ml-4 mb-2">
                                            <span className="text-xs text-gray-500 dark:text-white/50">{chapter}</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {items.map((item, i) => (
                                                    <a key={i} href={item.href} className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white">
                                                        {item.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ExamTimer({ exams }: { exams: CourseMeta["exams"] }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [currentExam, setCurrentExam] = useState<{ title: string; date: Date } | null>(null);

    useEffect(() => {
        // Validate that exams have valid dates
        if (!exams || !exams.major1 || !exams.major2 || !exams.final) {
            setCurrentExam(null);
            return;
        }

        const timer = setInterval(() => {
            try {
                const now = new Date();
                
                // Determine which exam is next
                let next = null;
                if (now < exams.major1) next = { title: "Major Exam 1", date: exams.major1 };
                else if (now < exams.major2) next = { title: "Major Exam 2", date: exams.major2 };
                else if (now < exams.final) next = { title: "Final Exam", date: exams.final };

                setCurrentExam(next);

                if (next) {
                    const difference = next.date.getTime() - now.getTime();
                    setTimeLeft({
                        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                        minutes: Math.floor((difference / 1000 / 60) % 60),
                        seconds: Math.floor((difference / 1000) % 60),
                    });
                } else {
                    setTimeLeft(null);
                }
            } catch (e) {
                console.error("Error in ExamTimer:", e);
                setCurrentExam(null);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [exams]);

    if (!currentExam || !timeLeft) {
        return null;
    }

    return (
        <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-black/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 mb-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="flex items-center gap-6 z-10">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <Calendar className="w-8 h-8 text-neon-blue" />
                </div>
                <div>
                     <h3 className="text-sm font-mono text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">Upcoming Assessment</h3>
                     <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">{currentExam.title}</h2>
                </div>
            </div>

            <div className="flex gap-4 md:gap-6 z-10 w-full md:w-auto pb-4 md:pb-0 justify-center md:justify-end border-b md:border-b-0 md:border-l border-black/10 dark:border-white/10 md:pl-8">
               <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-bold font-mono text-gray-900 dark:text-white">{timeLeft.days.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider mt-1">Days</span>
               </div>
               <span className="text-4xl md:text-5xl font-light text-gray-300 dark:text-white/20">:</span>
               <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-bold font-mono text-gray-900 dark:text-white">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider mt-1">Hours</span>
               </div>
               <span className="text-4xl md:text-5xl font-light text-gray-300 dark:text-white/20">:</span>
               <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-bold font-mono text-gray-900 dark:text-white">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider mt-1">Mins</span>
               </div>
               <span className="text-4xl md:text-5xl font-light text-neon-blue/40 animate-pulse">:</span>
               <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-bold font-mono text-neon-blue">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-mono text-neon-blue/60 uppercase tracking-wider mt-1">Secs</span>
               </div>
            </div>
        </div>
    );
}


export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const decodedId = decodeURIComponent(courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<{ videos: {title:string;href:string}[]; booksAndNotes: BookNoteEntry[]; oldExams: {major1:{[k:string]:{[k:string]:{title:string;href:string}[]}}; major2:{[k:string]:{[k:string]:{title:string;href:string}[]}}; final:{[k:string]:{[k:string]:{title:string;href:string}[]}}}; other: {title:string;href:string}[] }>({ videos: [], booksAndNotes: [], oldExams: {major1:{},major2:{},final:{}}, other: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      (async () => {
        try {
          const [courses, rawResources] = await Promise.all([
              fetchCourses(),
              fetchCourseResources(decodedId).catch((e: Error) => {
                console.warn("Failed to fetch course resources:", e.message);
                return [];
              }),
          ]);
          
          const found = courses.find(c => c.course_name === decodedId || c.course_name === decodedId.replace(/ /g, ""));
          if (found) {
            setCourse(found);
            setResources(groupResources(rawResources));
          } else {
            setError(`Course "${decodedId}" not found`);
          }
        } catch (err) {
          console.error("Error loading course:", err);
          setError(`Failed to load course: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
          setLoading(false);
        }
      })();
  }, [decodedId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-deep-space flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-deep-space flex items-center justify-center">
              <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
          </div>
      );
  }

  // Build display data — merge API data with defaults
  const displayId = course?.course_name ?? decodedId;
  const displayTitle = course?.title ?? "Course Resources";
  const displayDesc = course?.description ?? "";
  const displayLevel = course ? `Level ${course.level}` : "";
  const displayCredits = course?.credits ?? 0;
  const displayDifficulty = course?.difficulty ?? 3;
  
  // Parse objectives - handle both actual newlines and escaped newlines
  const displayObjectives = course?.objectives 
    ? typeof course.objectives === 'string' 
      ? course.objectives.split(/\n|\\n/).map(s => s.trim()).filter(Boolean)
      : Array.isArray(course.objectives)
        ? course.objectives
        : []
    : [];
  
  // Parse prerequisites - handle comma-separated or arrays
  const displayPrereqs = course?.prerequisites
    ? typeof course.prerequisites === 'string'
      ? course.prerequisites.split(/,|;/).map(s => s.trim()).filter(Boolean)
      : Array.isArray(course.prerequisites)
        ? course.prerequisites
        : []
    : [];
  
  const displayExams = course ? parseDates(course) : { major1: new Date(), major2: new Date(), final: new Date() };

  // Alias to avoid conflict with outer local
  const data = { id: displayId, title: displayTitle, description: displayDesc, level: displayLevel, credits: displayCredits, difficulty: displayDifficulty, objectives: displayObjectives, prerequisites: displayPrereqs, resources, exams: displayExams };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-deep-space pb-32">
        <div className="max-w-7xl mx-auto px-6 pt-24">
            
            {/* Header */}
            <div className="mb-16">
                 <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Academics
                 </button>

                 <div className="flex flex-wrap gap-3 mb-6 items-center">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{data.level}</Badge>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">{data.credits} Credits</Badge>
                    
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm ml-1">
                        <span className="text-xs font-mono text-gray-600 dark:text-white/60 uppercase tracking-widest">Difficulty:</span>
                        <DifficultyPeppers difficulty={data.difficulty} />
                    </div>

                    {data.prerequisites && data.prerequisites.length > 0 && (
                        <div className="flex items-center gap-2 ml-3">
                             <BookOpen className="w-4 h-4 text-gray-400 dark:text-white/30" />
                             <span className="text-xs font-mono text-gray-400 dark:text-white/40 uppercase tracking-widest">Prereq:</span>
                             {data.prerequisites.map((prereq) => (
                                 <Badge key={prereq} className="bg-black/5 dark:bg-white/5 text-gray-800 dark:text-white/80 border-black/10 dark:border-white/20 hover:bg-black/10 dark:bg-white/10 cursor-pointer transition-colors shadow-sm">{prereq}</Badge>
                             ))}
                        </div>
                    )}
                 </div>

                 <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-4">
                    <span className="text-neon-blue">{data.id}</span> - {data.title}
                 </h1>
                 <p className="text-xl text-gray-600 dark:text-white/60 max-w-3xl leading-relaxed">
                    {data.description}
                 </p>
            </div>

            {/* Exam Timer Row */}
            <ExamTimer exams={data.exams} />

            {/* Learning Objectives */}
            <div className="p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 mb-16">
                <div className="flex items-center gap-3 mb-8">
                    <CheckCircle2 className="w-6 h-6 text-orange-400" />
                    <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">Learning Objectives</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {data.objectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5" />
                            <p className="text-gray-700 dark:text-white/70 leading-relaxed">{obj}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Course Content Grid */}
            <div>
                <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-8">Course Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <VideosSection items={data.resources.videos} />
                    <BooksAndNotesSection items={data.resources.booksAndNotes} />
                    <OldExamsSection exams={data.resources.oldExams} />
                    {data.resources.other && data.resources.other.length > 0 && (
                        <div className="md:col-span-2 lg:col-span-3">
                            <OtherResourcesSection
                                title="Other Resources"
                                items={data.resources.other}
                                icon={BookOpen}
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
}
