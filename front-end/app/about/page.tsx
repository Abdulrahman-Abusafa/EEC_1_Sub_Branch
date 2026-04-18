"use client";

import { useEffect, useState } from "react";
import { User, Mail, Target, Zap, Globe } from "lucide-react";
import { TiltCard } from "@/components/ui/3DTiltCard";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { fetchMembers, getPhotoUrl, Member } from "@/lib/api";

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
                            <a href={member.linkedin} className="hover:text-neon-blue transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        </a>
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

export default function AboutPage() {
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers()
            .then(membersData => {
                setAllMembers(membersData);
                // Default to the first term in the list (as entered by admin)
                const terms = [...new Set(membersData.map(m => String(m.term).trim()))];
                if (terms.length > 0) setSelectedTerm(terms[0]);
            })
            .finally(() => setLoading(false));
    }, []);

    // All unique terms preserving insertion order (admin-defined)
    const terms = [...new Set(allMembers.map(m => String(m.term).trim()))];

    // Members for the selected term
    const visibleMembers = allMembers.filter(m => String(m.term).trim() === selectedTerm);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-deep-space pb-32 pt-24 px-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-24">

                {/* Hero / Mission */}
                <div className="flex flex-col items-center text-center gap-6">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-tight leading-none">
                        The <span className="text-neon-blue">Collective</span> <br /> Mindset.
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-white/60 leading-relaxed font-light max-w-2xl">
                        We are a community of innovators, builders, and dreamers. The Electrical Engineering Club (EEC) bridges the gap between theoretical academia and hands-on industrial reality.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2">
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

                {/* Team Section */}
                <div className="flex flex-col gap-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white mb-4">
                            Meet the <span className="text-neon-blue">Team</span>
                        </h2>
                        <div className="w-24 h-1 bg-neon-blue mx-auto rounded-full" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
                        </div>
                    ) : (
                        <>
                            {/* Term Toggle */}
                            {terms.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {terms.map(term => (
                                        <button
                                            key={term}
                                            onClick={() => setSelectedTerm(term)}
                                            className={`px-6 py-2.5 rounded-full border font-mono text-sm font-semibold transition-all ${
                                                selectedTerm === term
                                                    ? "bg-neon-blue text-white border-neon-blue shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                                                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-neon-blue/50 hover:text-neon-blue"
                                            }`}
                                        >
                                            {term.toLowerCase() === "current" ? "Current Term" : `Term ${term}`}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Members Grid */}
                            <motion.div
                                key={selectedTerm}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                            >
                                {visibleMembers.map((member, i) => (
                                    <TeamCard key={i} member={member} index={i} />
                                ))}
                                {visibleMembers.length === 0 && (
                                    <p className="col-span-full text-center text-gray-400 dark:text-white/30 font-mono py-16">
                                        No members for this term.
                                    </p>
                                )}
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
