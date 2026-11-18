"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  CalendarDays,
  Camera,
  Hammer,
  Monitor,
  Sprout,
  Truck,
} from "lucide-react";

const equipmentCategories = [
  {
    name: "Construction Equipment",
    description: "Tools and machinery for building projects.",
    icon: Hammer,
    accent: {
      glow: "from-[#f59e0b]/45 via-[#fbbf24]/20",
      icon: "from-[#fde68a] to-[#f59e0b] text-[#08162d]",
      label: "text-[#fbbf24]",
      border: "hover:border-[#f59e0b]/70",
      underline: "from-[#fde68a] via-[#f59e0b] to-[#d97706]",
    },
  },
  {
    name: "Photography Equipment",
    description: "Cameras and gear for every shoot.",
    icon: Camera,
    accent: {
      glow: "from-[#a78bfa]/45 via-[#c4b5fd]/20",
      icon: "from-[#ddd6fe] to-[#8b5cf6] text-[#08162d]",
      label: "text-[#c4b5fd]",
      border: "hover:border-[#a78bfa]/70",
      underline: "from-[#ddd6fe] via-[#8b5cf6] to-[#6d28d9]",
    },
  },
  {
    name: "Vehicles & Transportation",
    description: "Vehicles and transport for the job.",
    icon: Truck,
    accent: {
      glow: "from-[#22d3ee]/45 via-[#7dd3fc]/20",
      icon: "from-[#a5f3fc] to-[#0ea5e9] text-[#08162d]",
      label: "text-[#67e8f9]",
      border: "hover:border-[#22d3ee]/70",
      underline: "from-[#a5f3fc] via-[#0ea5e9] to-[#0369a1]",
    },
  },
  {
    name: "Agriculture Equipment",
    description: "Equipment for farms and fieldwork.",
    icon: Sprout,
    accent: {
      glow: "from-[#4ade80]/40 via-[#bef264]/20",
      icon: "from-[#bbf7d0] to-[#22c55e] text-[#08162d]",
      label: "text-[#86efac]",
      border: "hover:border-[#4ade80]/70",
      underline: "from-[#bbf7d0] via-[#22c55e] to-[#15803d]",
    },
  },
  {
    name: "Electronics",
    description: "Electronics for work and everyday use.",
    icon: Monitor,
    accent: {
      glow: "from-[#60a5fa]/45 via-[#93c5fd]/20",
      icon: "from-[#bfdbfe] to-[#3b82f6] text-[#08162d]",
      label: "text-[#93c5fd]",
      border: "hover:border-[#60a5fa]/70",
      underline: "from-[#bfdbfe] via-[#3b82f6] to-[#1d4ed8]",
    },
  },
  {
    name: "Event Equipment",
    description: "Essentials for gatherings and events.",
    icon: CalendarDays,
    accent: {
      glow: "from-[#f472b6]/45 via-[#fbcfe8]/20",
      icon: "from-[#fbcfe8] to-[#ec4899] text-[#08162d]",
      label: "text-[#f9a8d4]",
      border: "hover:border-[#f472b6]/70",
      underline: "from-[#fbcfe8] via-[#ec4899] to-[#be185d]",
    },
  },
];

export function EquipmentCategories() {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-36, 36]);
  const reverseParallaxY = useTransform(scrollYProgress, [0, 1], [28, -28]);

  return (
    <section
      aria-labelledby="equipment-categories-title"
      className="relative isolate overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8"
      ref={sectionRef}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-16 z-0 size-[26rem] rounded-full bg-[#ffd277]/25 blur-3xl"
        style={{ y: reduceMotion ? 0 : parallaxY }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-28 z-0 size-80 rounded-full bg-[#e96a32]/[0.06] blur-3xl"
        style={{ y: reduceMotion ? 0 : reverseParallaxY }}
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: reduceMotion ? 0 : -32 }}
          transition={{
            duration: reduceMotion ? 0 : 0.45,
            ease: "easeOut",
          }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e96a32]">
            Browse by category
          </p>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl"
            id="equipment-categories-title"
          >
            Find gear for every project
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-6">
          {equipmentCategories.map(
            ({ name, description, icon: Icon, accent }, index) => (
            <motion.article
              className={`group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-[#1b3658] bg-[linear-gradient(145deg,#08162d_0%,#102b4d_100%)] p-4 shadow-[0_8px_24px_rgba(8,22,45,0.16)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_18px_36px_rgba(8,22,45,0.24)] sm:min-h-[240px] sm:p-5 ${accent.border}`}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
              key={name}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.45,
                      delay: index * 0.07,
                      ease: "easeOut",
                    }
              }
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute -right-8 -top-8 z-0 size-28 rounded-full bg-gradient-to-br ${accent.glow} to-transparent transition-transform duration-500 group-hover:scale-[2.2]`}
              />
              <div className="relative z-10 mb-6">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.icon} shadow-[0_10px_20px_rgba(8,22,45,0.2)] transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105 sm:size-14`}
                >
                  <Icon aria-hidden="true" className="size-6" />
                </span>
              </div>
              <div className="relative z-10">
                <p
                  className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${accent.label}`}
                >
                  Popular category
                </p>
                <h3 className="mt-2 text-base font-bold leading-snug text-white sm:text-lg">
                  {name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-5 right-5 h-1 origin-left scale-x-0 rounded-full bg-gradient-to-r ${accent.underline} transition-transform duration-500 group-hover:scale-x-100`}
              />
            </motion.article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
