"use client";

import { TiltCard } from "@/components/ui/3DTiltCard";
import Link from "next/link";
import { ArrowRight, Zap, Cpu, Calendar } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { useEffect } from "react";

import { fetchEvents, getPhotoUrl, Event } from "@/lib/api";

function categoryColor(cat: string) {
    if (cat === "Workshop") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (cat === "Hackathon") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (cat === "Career") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
}

export default function Home() {
    const sphereRef = React.useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [sliderEvents, setSliderEvents] = React.useState<Event[]>([]);

    useEffect(() => {
        fetchEvents().then(evts => {
            // Exclude ended events, duplicate for seamless loop
            const active = evts.filter(e => e.status?.toLowerCase() !== "ended");
            setSliderEvents([...active, ...active]); // duplicate for seamless loop
        });
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!sphereRef.current) return;
            const rect = sphereRef.current.getBoundingClientRect();
            const sphereCenterX = rect.left + rect.width / 2;
            const sphereCenterY = rect.top + rect.height / 2;

            // Calculate distance from sphere center
            // Normalize somewhat based on window size to keep rotation reasonable
            const x = (e.clientX - sphereCenterX) / (window.innerWidth / 2);
            const y = (e.clientY - sphereCenterY) / (window.innerHeight / 2);
            
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // Calculate rotation: Looking AT the cursor means rotating towards it
    const rotateX = useTransform(mouseY, [-1, 1], [45, -45]); // Increased range for more dramatic look
    const rotateY = useTransform(mouseX, [-1, 1], [-45, 45]);

  return (
    <div className="flex flex-col gap-32 py-24 px-6 max-w-7xl mx-auto">
      {/* Hero Section - Minimalist & 3D Centric */}
      <section className="min-h-[60vh] flex flex-col lg:flex-row items-center justify-between text-center lg:text-left gap-10 relative perspective-1000">
        
        {/* Text Content */}
        <div className="flex flex-col gap-6 items-center lg:items-start max-w-2xl z-10">
            <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-400 dark:from-white dark:to-white/40 pb-4">
                The Future of <br /> Engineering.
            </h1>

            <p className="text-lg md:text-xl text-gray-500 dark:text-white/50 max-w-lg font-light">
                Advanced resources for the next generation of electrical engineers.
            </p>

            <div className="flex gap-6 mt-4">
                <Link href="/academics">
                    <button className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black border border-transparent hover:border-gray-900 dark:hover:border-white hover:bg-white dark:hover:bg-black hover:text-gray-900 dark:hover:text-white rounded-full font-medium transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer group">
                        Enter Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </Link>
            </div>
        </div>

        {/* Central 3D Element (Abstract AI Core) - "The Eye" */}
        <motion.div
            ref={sphereRef}
            style={{ 
                rotateX, 
                rotateY,
                transformStyle: "preserve-3d"
            }}
            initial={false}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center"
        >
             {/* The Sphere Body */}
             <div 
                className="absolute inset-0 rounded-full"
                style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 20%, rgba(0,0,0,0.8) 100%)",
                    boxShadow: "inset -20px -20px 50px rgba(0,0,0,0.8), inset 20px 20px 50px rgba(255,255,255,0.1), 0 0 50px rgba(6,182,212,0.1)",
                    transform: "translateZ(0px)" 
                }}
             />

             {/* Rotating Rings (Equator) - To show 3D volume */}
             <div className="absolute inset-4 rounded-full border border-black/10 dark:border-white/10 animate-[spin_8s_linear_infinite]" 
                  style={{ transform: "rotateX(70deg) translateZ(0px)" }} />
             <div className="absolute inset-8 rounded-full border border-black/5 dark:border-white/5 animate-[spin_12s_linear_infinite_reverse]" 
                  style={{ transform: "rotateY(70deg) translateZ(0px)" }} />
             
             {/* Inner Glow "Pupil" - Deep inside */}
             <div className="w-48 h-48 rounded-full bg-neon-blue/20 blur-[60px] animate-pulse absolute" 
                  style={{ transform: "translateZ(-40px)" }} />
             
             {/* The "Lens" or "Iris" - Popping out */}
             <div 
                className="absolute w-32 h-32 rounded-full border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                style={{ transform: "translateZ(60px)" }}
             >
                <Zap className="w-16 h-16 text-gray-900 dark:text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
             </div>
        </motion.div>
      </section>

      {/* Events Autoslider */}
      <section className="w-full relative overflow-hidden flex flex-col gap-6">
         <div className="flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] text-gray-800 dark:text-white/80">
                Upcoming Events
            </h2>
            <Link href="/events" className="text-sm text-neon-blue hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
            </Link>
         </div>

         <div className="relative w-full overflow-hidden flex items-center">
            {/* Shadows for edge fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 dark:from-deep-space to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 dark:from-deep-space to-transparent z-10 pointer-events-none" />
                        <motion.div 
                className="flex gap-6 w-max"
                initial={false}
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
            >
                {sliderEvents.map((evt, idx) => {
                    const imgUrl = getPhotoUrl(evt.image);
                    const isLive = evt.status?.toLowerCase() === "active";
                    const clr = categoryColor(evt.category);
                    const dateLabel = evt.start_date ? new Date(evt.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

                    return (
                        <a 
                            key={idx} 
                            href={evt.registration_link || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-shrink-0 w-80 h-48 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-neon-blue/50 transition-colors group relative overflow-hidden backdrop-blur-sm cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] block"
                        >
                            {imgUrl && (
                                <img
                                    src={imgUrl}
                                    alt={evt.event_title}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 mix-blend-overlay dark:opacity-40"
                                />
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/60 to-transparent" />
                            
                            {/* Content Overlaid */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10 w-full h-full">
                                <div className="flex justify-between items-start w-full">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm backdrop-blur-sm ${clr}`}>
                                        {evt.category}
                                    </span>
                                    {isLive && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-neon-blue/10 rounded-full border border-neon-blue/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                                            <span className="text-[10px] font-mono text-neon-blue uppercase tracking-widest">Live</span>
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-1.5 w-full">
                                    <h3 className="font-bold text-lg text-white group-hover:text-neon-blue transition-colors truncate">
                                        {evt.event_title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-300 dark:text-white/70">
                                        <Calendar className="w-4 h-4 text-neon-blue" />
                                        <span className="font-mono">{dateLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </motion.div>
         </div>
      </section>

      {/* Quick Access - 3D Tilt Cards */}
      
    </div>
  );
}
