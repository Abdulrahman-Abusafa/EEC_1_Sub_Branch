"use client";

import React, { use, useEffect, useState } from "react";
import { ArrowLeft, Linkedin, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/3DTiltCard";
import { fetchMembers, getPhotoUrl, Member } from "@/lib/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

function RosterCard({ member, index }: { member: Member; index: number }) {
    const imgUrl = getPhotoUrl(member.image);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + index * 0.04 }}
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
                        {member.bio && (
                            <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed max-w-[250px] mx-auto">
                                {member.bio}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        {member.linkedin && (
                            <a href={member.linkedin} className="hover:text-neon-blue transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {member.email && (
                            <a href={`mailto:${member.email}`} className="hover:text-neon-blue transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        )}
                        {member.twitter && (
                            <a href={member.twitter.startsWith("http") ? member.twitter : `https://x.com/${member.twitter.replace("@", "")}`}
                                className="hover:text-neon-blue transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                        )}
                    </div>
                </div>
            </TiltCard>
        </motion.div>
    );
}

export default function TermRosterPage({ params }: { params: Promise<{ term: string }> }) {
    const { term } = use(params);
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers()
            .then(all => setMembers(all.filter(m => String(m.term) === term)))
            .finally(() => setLoading(false));
    }, [term]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-deep-space pb-32 pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to About
                    </button>

                    <div className="text-center">
                        <p className="text-sm font-mono text-neon-blue uppercase tracking-widest mb-3">Full Roster</p>
                        <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-tight">
                            Term <span className="text-neon-blue">{term}</span>
                        </h1>
                        {!loading && (
                            <p className="text-gray-500 dark:text-white/50 mt-4 text-lg">
                                {members.length} member{members.length !== 1 ? "s" : ""}
                            </p>
                        )}
                        <div className="w-24 h-1 bg-neon-blue mx-auto rounded-full mt-6" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <DotLottieReact src="/Charging battery.json" loop autoplay className="w-32 h-32" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-24 text-gray-400 dark:text-white/30 font-mono">No members found for term {term}.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {members.map((member, i) => (
                            <RosterCard key={i} member={member} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
