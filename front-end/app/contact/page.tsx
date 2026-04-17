"use client";

import React, { useState, useEffect } from "react";
import { Mail, MapPin, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { fetchOtherStats, OtherStat } from "@/lib/api";

export default function ContactPage() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [stats, setStats] = useState<OtherStat | null>(null);

    useEffect(() => {
        fetchOtherStats().then(setStats);
    }, []);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("submitting");
        const form = e.target as HTMLFormElement;
        const data = Object.fromEntries(new FormData(form));
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error();
            setStatus("success");
            form.reset();
            setTimeout(() => setStatus("idle"), 4000);
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 4000);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-24 px-6 bg-gray-50 dark:bg-deep-space relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-mono uppercase tracking-widest">Connect with us</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-tight mb-6">
                        Get In <span className="text-neon-blue">Touch</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                        Have a question, an idea, or want to collaborate? Reach out to the EEC team and we&apos;ll get back to you as soon as possible.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">
                    
                    {/* Left: Contact Info */}
                    <div className="flex flex-col gap-8 order-2 lg:order-1">
                        <div className="p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 glass-panel">
                            <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-8 dark:text-white">Contact Information</h2>
                            
                            <div className="flex flex-col gap-6">
                                {stats?.club_email && stats.club_email !== "empty" && (
                                    <a href={`mailto:${stats.club_email}`} className="group flex flex-col sm:flex-row p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-4">
                                        <div className="w-12 h-12 rounded-full bg-neon-blue/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <Mail className="w-5 h-5 text-neon-blue" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white/80 uppercase tracking-widest mb-1">Email Us</span>
                                            <span className="text-lg text-gray-600 dark:text-white/60 group-hover:text-neon-blue transition-colors font-mono">{stats.club_email}</span>
                                        </div>
                                    </a>
                                )}

                                {stats?.club_location && stats.club_location !== "empty" && (
                                    <div className="group flex flex-col sm:flex-row p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <MapPin className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white/80 uppercase tracking-widest mb-1">Visit Us</span>
                                            <span className="text-lg text-gray-600 dark:text-white/60 group-hover:text-purple-400 transition-colors font-mono">{stats.club_location}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="my-8 border-black/10 dark:border-white/10" />

                            <div className="flex flex-col gap-4">
                                <span className="text-sm font-bold text-gray-900 dark:text-white/80 uppercase tracking-widest">Social Media</span>
                                <div className="flex gap-4">
                                    {/* Hardcoded official accounts */}
                                    <a href="https://www.linkedin.com/company/eec-kfupm/posts/?feedView=all" target="_blank" rel="noreferrer" className="p-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-[#0077b5] hover:text-white dark:hover:bg-[#0077b5] text-gray-600 dark:text-white/60 transition-all hover:scale-110">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                                    </a>
                                    <a href="https://x.com/EEC_KFUPM" target="_blank" rel="noreferrer" className="p-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-600 dark:text-white/60 transition-all hover:scale-110">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                    </a>
                                    {stats?.club_insta && stats.club_insta !== "empty" && (
                                        <a href={stats.club_insta.startsWith("http") ? stats.club_insta : `https://instagram.com/${stats.club_insta.replace("@", "")}`} target="_blank" rel="noreferrer" className="p-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white dark:hover:text-white text-gray-600 dark:text-white/60 transition-all hover:scale-110 border-0">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact Form */}
                    <div className="order-1 lg:order-2">
                        <div className="p-8 rounded-3xl bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                            
                            {/* Form Header */}
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-2 dark:text-white">Send a Message</h3>
                                <div className="w-12 h-1 bg-neon-blue rounded-full" />
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Your Name <span className="text-neon-blue">*</span></label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Email Address <span className="text-neon-blue">*</span></label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="subject" className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="message" className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Message <span className="text-neon-blue">*</span></label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows={5}
                                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all resize-none"
                                        placeholder="Hello..."
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={status === "submitting" || status === "success"}
                                    className="relative flex justify-center items-center gap-2 w-full py-4 mt-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold uppercase tracking-widest hover:bg-neon-blue dark:hover:bg-neon-blue hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {status === "submitting" ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : status === "success" ? (
                                            "Message Sent!"
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
