"use client";

import React, { useEffect, useState } from "react";
import { User, Linkedin, Mail, Target, Zap, Globe, LucideIcon } from "lucide-react";
import { TiltCard } from "@/components/ui/3DTiltCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { fetchMembers, fetchOtherStats, getPhotoUrl, Member, OtherStat } from "@/lib/api";

function TeamCard({ member, index }: { member: Member; index: number }) {
    const imgUrl = getPhotoUrl(member.image);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
        >
            <TiltCard className="h-full group">
                <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-black/10 dark:from-white/10 to-transparent border border-black/10 dark:border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
                        {imgUrl ? (
                            <img src={imgUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-gray-400 dark:text-white/50 group-hover:text-neon-blue transition-colors" />
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-neon-blue transition-colors">
                            {member.name}
                        </h3>
                        <p className="text-sm font-mono text-neon-blue/80 uppercase tracking-widest mt-1 mb-3">
                            {member.role}
                        </p>
                        <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed max-w-[250px] mx-auto">
                            {member.bio}
                        </p>
                    </div>

                    <div className="flex gap-4 mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        {member.linkedin && (
                            <a href={member.linkedin} className="hover:text-neon-blue transition-colors"><Linkedin className="w-5 h-5"/></a>
                        )}
                        {member.email && (
                            <a href={`mailto:${member.email}`} className="hover:text-neon-blue transition-colors"><Mail className="w-5 h-5"/></a>
                        )}
                        {member.twitter && (
                            <a href={member.twitter.startsWith("http") ? member.twitter : `https://x.com/${member.twitter.replace("@", "")}`} className="hover:text-neon-blue transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                        )}
                    </div>
                </div>
            </TiltCard>
        </motion.div>
    );
}

function StatCard({ icon: Icon, value, label, delay }: { icon: LucideIcon; value: string; label: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-black/5 dark:bg-white/5 transition-colors"
        >
            <Icon className="w-8 h-8 text-gray-400 dark:text-white/20 group-hover:text-neon-blue transition-colors mb-2" />
            <span className="text-4xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">{value}</span>
            <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/40">{label}</span>
        </motion.div>
    );
}

export default function AboutPage() {
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [stats, setStats] = useState<OtherStat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetchMembers(),
            fetchOtherStats()
        ])
        .then(([membersData, statsData]) => {
            setAllMembers(membersData);
            setStats(statsData);
        })
        .finally(() => setLoading(false));
    }, []);

    // Group members by term
    const membersByTerm: Record<number, Member[]> = {};
    allMembers.forEach(m => {
        if (!membersByTerm[m.term]) membersByTerm[m.term] = [];
        membersByTerm[m.term].push(m);
    });

    // Determine current term (fallback to 252 if stats not loaded)
    const currentTerm = stats?.current_term || 252;

    const currentTermMembers = membersByTerm[currentTerm] ?? [];
    const pastTerms = Object.entries(membersByTerm)
        .map(([term, members]) => ({ term: Number(term), members }))
        .filter(({ term }) => term !== currentTerm)
        .sort((a, b) => b.term - a.term); // descending

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-deep-space pb-32 pt-24 px-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-24">

                {/* Hero / Mission */}
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1 flex flex-col gap-6">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-tight leading-none">
                            The <span className="text-neon-blue">Collective</span> <br className="hidden md:block" /> Mindset.
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-white/60 leading-relaxed font-light max-w-xl">
                            We are a community of innovators, builders, and dreamers. The Electrical Engineering Club (EEC) bridges the gap between theoretical academia and hands-on industrial reality.
                        </p>
                        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><Zap className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Innovation</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Globe className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Community</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Target className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Excellence</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                        <StatCard icon={User} value={stats?.active_members?.toString() || "500+"} label="Active Members" delay={0.1} />
                        <StatCard icon={Zap} value={stats?.workshops_per_year?.toString() || "24"} label="Workshops/Year" delay={0.2} />
                        <StatCard icon={Target} value={`${stats?.commitment_percentage || 100}%`} label="Commitment" delay={0.3} />
                        <StatCard icon={Globe} value={stats?.industry_partners?.toString() || "15"} label="Industry Partners" delay={0.4} />
                    </div>
                </div>

                {/* Current Board */}
                <div className="flex flex-col gap-12">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-4">
                            Term <span className="text-neon-blue">{currentTerm}</span>
                        </h2>
                        <div className="w-24 h-1 bg-neon-blue mx-auto rounded-full" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {currentTermMembers.slice(0, 8).map((member, i) => (
                                    <TeamCard key={i} member={member} index={i} />
                                ))}
                            </div>
                            {currentTermMembers.length > 8 && (
                                <div className="mt-4 flex justify-center">
                                    <Link href={`/about/term/${currentTerm}`} className="px-6 py-2 rounded-full border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/70 hover:text-neon-blue dark:hover:text-neon-blue hover:border-neon-blue transition-colors font-semibold text-sm">
                                        Show All / Full Roster
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Past Terms */}
                {!loading && pastTerms.length > 0 && (
                    <div className="flex flex-col gap-16 w-full pb-24">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-4">Past Term Members</h2>
                            <div className="w-24 h-1 bg-neon-blue mx-auto rounded-full mb-8" />
                            <p className="text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
                                Honoring the collective minds that have contributed to our growth across all past terms.
                            </p>
                        </div>

                        {pastTerms.map(({ term, members }) => (
                            <div key={term} className="flex flex-col w-full mb-12">
                                <div className="flex justify-between items-center mb-8 pl-4 pr-4 lg:px-0 z-10 border-b border-black/10 dark:border-white/10 pb-4">
                                    <h3 className="text-2xl font-bold font-mono text-gray-800 dark:text-white/80">
                                        Term <span className="text-neon-blue">{term}</span>
                                    </h3>
                                    <Link href={`/about/term/${term}`} className="text-sm font-semibold text-gray-500 hover:text-neon-blue dark:text-white/40 dark:hover:text-neon-blue transition-colors flex items-center gap-1">
                                        View Full Roster →
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
                                    {members.slice(0, 5).map((member, idx) => {
                                        const imgUrl = getPhotoUrl(member.image);
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/5 hover:border-neon-blue/40 dark:hover:border-neon-blue/40 transition-all flex flex-col items-center text-center gap-4 py-6 group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 hover:-translate-y-1 shadow-sm hover:shadow-md"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black/10 dark:from-white/10 to-transparent flex shrink-0 items-center justify-center border border-black/5 dark:border-white/5 group-hover:bg-neon-blue/10 transition-colors shadow-inner overflow-hidden">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-7 h-7 text-gray-400 dark:text-white/40 group-hover:text-neon-blue transition-colors" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-neon-blue transition-colors text-base">{member.name}</h4>
                                                    <span className="text-xs font-mono text-gray-500 dark:text-white/40 mt-1 uppercase tracking-wider">{member.role}</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
