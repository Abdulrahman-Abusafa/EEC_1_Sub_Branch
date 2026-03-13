"use client";

import React, { useEffect, useState } from "react";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { TiltCard } from "@/components/ui/3DTiltCard";
import { motion } from "framer-motion";
import { fetchEvents, getPhotoUrl, Event } from "@/lib/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type EventStatus = "current" | "future" | "past";

function classifyEvent(event: Event): EventStatus {
    const status = event.status?.toLowerCase().trim();

    if (status === "auto") {
        const now = new Date();
        const start = event.start_date ? new Date(event.start_date) : null;
        const end   = event.end_date   ? new Date(event.end_date)   : null;
        if (end && now > end) return "past";
        if (start && now >= start) return "current";
        return "future";
    }

    if (status === "active") return "current";
    if (
        status?.startsWith("complete") ||  // "complete", "completed"
        status === "ended" ||
        status === "past"
    ) return "past";
    return "future"; // Upcoming or anything else
}

function formatDateDisplay(dateStr: string) {
    if (!dateStr) return { day: "--", month: "--" };
    const d = new Date(dateStr);
    return {
        day: d.toLocaleDateString("en-US", { day: "2-digit" }),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        full: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
}

function categoryColor(cat: string) {
    if (cat === "Workshop") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (cat === "Hackathon") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (cat === "Career") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
}

function EventCard({ event, index, status }: { event: Event; index: number; status: EventStatus }) {
    const imgUrl = getPhotoUrl(event.image);
    const date = formatDateDisplay(event.start_date);

    const cardBorder =
        status === "current"
            ? "ring-2 ring-neon-blue/60 shadow-[0_0_30px_rgba(6,182,212,0.18)]"
            : status === "future"
            ? "ring-1 ring-indigo-500/30"
            : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <TiltCard
                className={`h-full group ${cardBorder} ${status === "past" ? "opacity-70 grayscale hover:grayscale-0 transition-all duration-500" : ""}`}
                innerClassName="p-0"
            >
                <div className="flex flex-col md:flex-row h-full">
                    {/* Image side */}
                    <div className="w-full md:w-2/5 h-48 md:h-auto relative shrink-0 overflow-hidden bg-black/5 dark:bg-white/5 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10">
                        {imgUrl && (
                            <img
                                src={imgUrl}
                                alt={event.event_title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                            />
                        )}

                        {/* Overlay tint differs by status */}
                        {status === "current" ? (
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-blue-950/80 via-blue-950/30 to-transparent" />
                        ) : status === "future" ? (
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-indigo-950/80 via-indigo-950/30 to-transparent" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0f1c] via-[#0a0f1c]/40 to-transparent mix-blend-multiply opacity-80" />
                        )}

                        {/* LIVE badge pinned to image corner */}
                        {status === "current" && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-blue/20 border border-neon-blue/40 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                                <span className="text-[10px] font-bold font-mono text-neon-blue/90 uppercase tracking-widest">Live Now</span>
                            </div>
                        )}

                        {/* UPCOMING badge for future */}
                        {status === "future" && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 backdrop-blur-sm">
                                <span className="text-[10px] font-bold font-mono text-indigo-300 uppercase tracking-widest">Upcoming</span>
                            </div>
                        )}
                    </div>

                    {/* Content side */}
                    <div className="flex flex-col flex-1 p-6 lg:p-8 justify-between z-10 w-full">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-col">
                                    <span className={`text-3xl font-bold font-[family-name:var(--font-orbitron)] ${status === "current" ? "text-neon-blue" : status === "future" ? "text-indigo-300 dark:text-indigo-300" : "text-gray-900 dark:text-white"}`}>
                                        {date.day}
                                    </span>
                                    <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-white/40 font-mono">
                                        {date.month}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColor(event.category)} shadow-sm backdrop-blur-sm self-start`}>
                                    {event.category}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h3 className={`text-xl md:text-2xl font-bold mb-3 tracking-tight transition-colors ${status === "current" ? "text-blue-50 dark:text-white group-hover:text-neon-blue" : status === "future" ? "text-gray-900 dark:text-white group-hover:text-indigo-300" : "text-gray-900 dark:text-white group-hover:text-neon-blue"}`}>
                                    {event.event_title}
                                </h3>
                                <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {event.description}
                                </p>
                                <div className="flex flex-col gap-3 text-sm text-gray-500 dark:text-white/50 font-medium">
                                    <div className="flex items-center gap-3">
                                        <Clock className={`w-4 h-4 ${status === "current" ? "text-neon-blue" : "text-indigo-400"}`} />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className={`w-4 h-4 ${status === "current" ? "text-neon-blue" : "text-indigo-400"}`} />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-auto pt-4 border-t flex justify-end ${status === "current" ? "border-neon-blue/20" : "border-black/10 dark:border-white/10"}`}>
                            {status === "future" && (
                                <a href={event.registration_link || "#"} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 text-sm font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-300 transition-colors group/btn">
                                    Register Now
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </a>
                            )}
                            {status === "current" && (
                                <a href={event.registration_link || "#"} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 text-sm font-bold text-neon-blue hover:text-neon-blue/80 transition-colors group/btn">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                                    Join Now
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </a>
                            )}
                            {status === "past" && (
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-white/40">
                                    Event Ended
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </TiltCard>
        </motion.div>
    );
}

const INITIAL_SHOW = 4;

function ShowMoreButton({ shown, total, onToggle }: { shown: boolean; total: number; onToggle: () => void }) {
    if (total <= INITIAL_SHOW) return null;
    return (
        <div className="flex justify-center mt-10">
            <button
                onClick={onToggle}
                className="group flex items-center gap-3 px-8 py-3 rounded-full border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/15 text-neon-blue font-semibold text-sm tracking-wide transition-all duration-300 hover:border-neon-blue/60 hover:shadow-[0_0_20px_rgba(0,200,255,0.15)]"
            >
                {shown ? "Show Less" : `Show More (${total - INITIAL_SHOW} more)`}
                <span className={`transition-transform duration-300 ${shown ? "rotate-180" : ""}`}>↓</span>
            </button>
        </div>
    );
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllCurrent, setShowAllCurrent] = useState(false);
    const [showAllFuture, setShowAllFuture] = useState(false);
    const [showAllPast, setShowAllPast] = useState(false);

    useEffect(() => {
        fetchEvents()
            .then(data => {
                const statuses = [...new Set(data.map(e => e.status))];
                console.log("[Events] raw status values from DB:", statuses);
                setEvents(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const current = events.filter(e => classifyEvent(e) === "current");
    const future  = events.filter(e => classifyEvent(e) === "future");
    const past    = events.filter(e => classifyEvent(e) === "past");

    const visibleCurrent = showAllCurrent ? current : current.slice(0, INITIAL_SHOW);
    const visibleFuture  = showAllFuture  ? future  : future.slice(0, INITIAL_SHOW);
    const visiblePast    = showAllPast    ? past    : past.slice(0, INITIAL_SHOW);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-deep-space pb-32 pt-24 px-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-16">
                <div className="flex flex-col text-center items-center gap-6">
                    <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-white/40 tracking-tight">
                        Future Timeline
                    </h1>
                    <p className="text-gray-600 dark:text-white/60 text-xl max-w-2xl text-center">
                        Join us for cutting-edge workshops, hackathons, and networking events designed to accelerate your engineering journey.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-24">
                        {current.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8 pl-4 border-l-4 border-neon-blue">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-neon-blue">Current Events</h2>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-neon-blue/10 rounded-full border border-neon-blue/30">
                                                <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                                                <span className="text-xs font-mono text-neon-blue/80 uppercase tracking-widest">Live Now</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-500/60 font-mono">These events are happening right now</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {visibleCurrent.map((event, i) => <EventCard key={i} event={event} index={i} status="current" />)}
                                </div>
                                <ShowMoreButton shown={showAllCurrent} total={current.length} onToggle={() => setShowAllCurrent(p => !p)} />
                            </section>
                        )}

                        {future.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8 pl-4 border-l-4 border-indigo-500">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-indigo-400 dark:text-indigo-300">Upcoming Events</h2>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-400/30">
                                                <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest">Soon</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-500/60 font-mono">Mark your calendar for these events</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {visibleFuture.map((event, i) => <EventCard key={i} event={event} index={i} status="future" />)}
                                </div>
                                <ShowMoreButton shown={showAllFuture} total={future.length} onToggle={() => setShowAllFuture(p => !p)} />
                            </section>
                        )}

                        {past.length > 0 && (
                            <section>
                                <div className="mb-8 pl-4 border-l-4 border-gray-400/30">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-400 dark:text-white/40">Past Events</h2>
                                        <p className="text-sm text-gray-400/60 dark:text-white/30 font-mono">A look back at what we&apos;ve done</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {visiblePast.map((event, i) => <EventCard key={i} event={event} index={i} status="past" />)}
                                </div>
                                <ShowMoreButton shown={showAllPast} total={past.length} onToggle={() => setShowAllPast(p => !p)} />
                            </section>
                        )}

                        {!loading && events.length === 0 && (
                            <div className="text-center py-24 text-gray-400 dark:text-white/30 font-mono">No events found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
