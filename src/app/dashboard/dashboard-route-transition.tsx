"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function DashboardRouteTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        className="relative min-w-0"
        exit={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                x: -12,
                y: -3,
                scale: 0.995,
                filter: "blur(5px)",
              }
        }
        initial={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                x: 18,
                y: 8,
                scale: 0.99,
                filter: "blur(7px)",
              }
        }
        transition={{ duration: reduceMotion ? 0.12 : 0.36, ease: "easeOut" }}
      >
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            animate={{ opacity: 0, scaleX: 1 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-gradient-to-r from-[#e96a32] via-[#ffd277] to-[#75d6c3]"
            initial={{ opacity: 0.9, scaleX: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
          />
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
