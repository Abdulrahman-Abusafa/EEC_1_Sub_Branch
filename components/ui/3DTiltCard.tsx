"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

const ROTATION_RANGE = 20;
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;

export function TiltCard({ children, className, innerClassName }: { children: React.ReactNode; className?: string; innerClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x);
  const ySpring = useSpring(y);

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
    const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

    const rX = (mouseY / height - HALF_ROTATION_RANGE); // Removed * -1 to fix inverted look
    const rY = (mouseX / width - HALF_ROTATION_RANGE) * -1; // Added * -1 to fix inverted look

    x.set(rX);
    y.set(rY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform,
      }}
      className={cn(
        "relative group/card rounded-xl",
        className
      )}
    >
      <div
        style={{
          transform: "translateZ(50px)",
        }}
        className="absolute inset-4 rounded-xl shadow-2xl bg-gradient-to-br from-black/10 dark:from-white/10 to-transparent group-hover/card:shadow-purple-500/20 transition-shadow duration-500 pointer-events-none"
      />
      <div className={cn("relative h-full w-full rounded-xl bg-gradient-to-br from-black/5 dark:from-white/5 to-white/[0.02] border border-black/10 dark:border-white/10 p-6 backdrop-blur-md overflow-hidden", innerClassName)}>
         {/* Glossy sheen */}
         <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {children}
      </div>
    </motion.div>
  );
}
