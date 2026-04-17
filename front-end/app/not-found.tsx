"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Zap } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 text-center flex flex-col items-center gap-8 max-w-lg">

                {/* Top badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue"
                >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono uppercase tracking-widest">Error 404</span>
                </motion.div>

                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="flex flex-col gap-4"
                >
                    <h1 className="text-6xl md:text-8xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white tracking-tight">
                        Page<br />
                        <span className="text-neon-blue">Not Found</span>
                    </h1>
                    <p className="text-gray-500 dark:text-white/40 text-base font-light leading-relaxed">
                        This page doesn&apos;t exist or was moved.<br />Head back and explore the rest.
                    </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="w-24 h-px bg-neon-blue/30"
                />

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="flex items-center justify-center"
                >
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="group relative flex items-center gap-3 px-8 py-3.5 rounded-full font-medium text-base overflow-hidden cursor-pointer
                                       bg-white/5 dark:bg-white/5 border border-black/20 dark:border-white/10 text-black dark:text-white
                                       hover:border-neon-blue/60 dark:hover:border-neon-blue/60 transition-colors duration-300"
                        >
                            {/* Glow fill on hover */}
                            <span className="absolute inset-0 bg-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                            <Home className="relative w-4 h-4 shrink-0 text-neon-blue" />
                            <span className="relative tracking-wide">Go Home</span>
                        </motion.button>
                    </Link>
                </motion.div>

            </div>
        </div>
    );
}
