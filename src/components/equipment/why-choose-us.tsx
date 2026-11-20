"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

const benefits = [
  {
    title: "Affordable rental prices",
    description:
      "Compare clear daily rates and find equipment that fits your project budget.",
    icon: CircleDollarSign,
    accent: "text-[#fbbf24] bg-[#fbbf24]/10 ring-[#fbbf24]/20",
  },
  {
    title: "Verified equipment owners",
    description:
      "Review owner and equipment details to make a more informed rental choice.",
    icon: BadgeCheck,
    accent: "text-[#a78bfa] bg-[#a78bfa]/10 ring-[#a78bfa]/20",
  },
  {
    title: "Flexible rental periods",
    description:
      "Choose a rental timeframe that works for your schedule and project needs.",
    icon: CalendarClock,
    accent: "text-[#22d3ee] bg-[#22d3ee]/10 ring-[#22d3ee]/20",
  },
  {
    title: "Secure payments",
    description:
      "A secure payment experience helps make arranging your equipment rental simpler.",
    icon: ShieldCheck,
    accent: "text-[#4ade80] bg-[#4ade80]/10 ring-[#4ade80]/20",
  },
];

export function WhyChooseUs() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="why-choose-us-title"
      className="relative isolate overflow-hidden bg-[#f5f7fa] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 size-96 rounded-full bg-[#b9c9dc]/25 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <motion.div
          className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#08162d_0%,#102b4d_70%,#1b3658_100%)] p-7 shadow-[0_24px_60px_rgba(8,22,45,0.2)] sm:p-10 lg:min-h-[490px] lg:p-12"
          initial={{ opacity: 0, x: reduceMotion ? 0 : -36 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.35 }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-20 -z-10 size-80 rounded-full bg-[#e96a32]/20 blur-3xl"
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-[#ffd277]">
            <Sparkles aria-hidden="true" className="size-3.5" />
            The GearRent difference
          </div>
          <h2
            className="gearrent-section-heading mt-8 max-w-md text-white"
            id="why-choose-us-title"
          >
            Make room for <span className="text-[#ffd277]">what matters.</span>
          </h2>
          <p className="gearrent-section-description max-w-md text-slate-300">
            Get the equipment you need without the long-term commitment. Find
            options, compare details, and plan a rental around your project.
          </p>
          <Link
            className="gearrent-primary-action group mt-8"
            href="/equipment"
          >
            Explore equipment
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -right-10 size-52 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-8 -right-2 size-32 rounded-full border border-white/10"
          />
        </motion.div>

        <div className="divide-y divide-slate-200">
          {benefits.map(({ title, description, icon: Icon, accent }, index) => (
            <motion.article
              className="group flex gap-4 py-5 first:pt-0 last:pb-0 sm:gap-5 sm:py-6"
              initial={{ opacity: 0, x: reduceMotion ? 0 : 28 }}
              key={title}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.45,
                      delay: index * 0.08,
                      ease: "easeOut",
                    }
              }
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
            >
              <span
                className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-105 sm:size-14 ${accent}`}
              >
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div className="pt-0.5">
                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
