"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Compass, Ruler } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Start with your project",
    description:
      "Browse equipment by category and find options that fit the work you have planned.",
    icon: Compass,
    surface:
      "bg-[linear-gradient(145deg,#185c65_0%,#117b76_48%,#102b4d_100%)]",
    accent: "bg-[#75d6c3]/15 text-[#a7f3e5] ring-[#75d6c3]/35",
    glow: "bg-[#75d6c3]/35",
  },
  {
    number: "02",
    title: "Compare the details",
    description:
      "Check daily rates, locations, and descriptions to understand what each listing offers.",
    icon: ClipboardList,
    surface:
      "bg-[linear-gradient(145deg,#765116_0%,#9a681b_48%,#342a36_100%)]",
    accent: "bg-[#ffc45b]/15 text-[#ffe3a3] ring-[#ffc45b]/35",
    glow: "bg-[#ffc45b]/30",
  },
  {
    number: "03",
    title: "Plan the right fit",
    description:
      "Use the listing details to plan how long you need the equipment and what to confirm before your project.",
    icon: Ruler,
    surface:
      "bg-[linear-gradient(145deg,#8a3d28_0%,#b84c2c_48%,#382344_100%)]",
    accent: "bg-[#ffad8b]/15 text-[#ffd0bd] ring-[#ffad8b]/35",
    glow: "bg-[#fb9060]/30",
  },
];

type Step = (typeof steps)[number];

function StepCard({
  step,
  index,
  reduceMotion,
}: {
  step: Step;
  index: number;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: false, amount: 0.2 });
  const hidden = {
    opacity: 0,
    scale: 0.68,
    z: -360,
    y: 22,
    rotateX: -14,
    rotateY: index === 0 ? -10 : index === 2 ? 10 : 0,
  };
  const visible = {
    opacity: 1,
    scale: 1,
    z: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  };
  const delay = isInView ? index * 0.12 : 0;

  return (
    <div
      className="min-w-0"
      ref={cardRef}
      style={{ perspective: 700 }}
    >
      <motion.article
        animate={reduceMotion ? visible : isInView ? visible : hidden}
        className="how-step-card relative flex min-h-[280px] flex-col overflow-hidden rounded-[1.65rem] bg-[#0b172a] p-[2px] shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:min-h-[300px]"
        initial={reduceMotion ? false : hidden}
        style={{ transformStyle: "preserve-3d" }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 0.28, delay },
                scale: {
                  type: "spring",
                  stiffness: 105,
                  damping: 15,
                  mass: 0.75,
                  delay,
                },
                z: {
                  type: "spring",
                  stiffness: 105,
                  damping: 15,
                  mass: 0.75,
                  delay,
                },
                y: {
                  type: "spring",
                  stiffness: 105,
                  damping: 15,
                  mass: 0.75,
                  delay,
                },
                rotateX: {
                  type: "spring",
                  stiffness: 105,
                  damping: 15,
                  mass: 0.75,
                  delay,
                },
                rotateY: {
                  type: "spring",
                  stiffness: 105,
                  damping: 15,
                  mass: 0.75,
                  delay,
                },
              }
        }
      >
        <div
              className={`how-step-card__surface relative z-10 flex min-h-[276px] flex-col overflow-hidden rounded-[1.5rem] p-6 text-white sm:min-h-[296px] sm:p-7 ${step.surface}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[1.65rem]"
          >
            <div
              className={`absolute -right-10 -top-10 size-40 rounded-full ${step.glow} blur-3xl`}
            />
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-2 font-mono text-[8rem] font-black leading-none tracking-tighter text-white/[0.07]"
          >
            {step.number}
          </span>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <span
              className={`inline-flex size-14 items-center justify-center rounded-2xl ring-1 backdrop-blur ${step.accent}`}
            >
              <step.icon aria-hidden="true" className="size-6" />
            </span>
            <span
              className="rounded-full border border-white/20 bg-black/10 px-3 py-1 font-mono text-xs font-bold tracking-[0.16em] text-white/75"
            >
              STEP {step.number}
            </span>
          </div>

          <div
            className="relative z-10 mt-auto pt-9"
          >
            <h3 className="max-w-[16rem] text-xl font-extrabold leading-tight sm:text-2xl">
              {step.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
              {step.description}
            </p>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export function HowItWorks() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="how-it-works-title"
      className="relative isolate overflow-hidden bg-[#08162d] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#75d6c3]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-[#75d6c3]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-[#e96a32]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#75d6c3]">
            How GearRent works
          </p>
          <h2
            className="gearrent-section-heading mt-3 text-white"
            id="how-it-works-title"
          >
            From project idea to{" "}
            <span className="bg-gradient-to-r from-[#75d6c3] via-[#ffc45b] to-[#fb9060] bg-clip-text text-transparent">
              the right gear.
            </span>
          </h2>
          <p className="gearrent-section-description mx-auto max-w-xl text-slate-300">
            Explore equipment, compare your options, and get ready for the work
            ahead.
          </p>
        </motion.div>

        <div
          className="relative"
          style={{ perspective: 1300, transformStyle: "preserve-3d" }}
        >
          <div
            className="relative z-10 grid gap-5 md:grid-cols-3"
            style={{ transformStyle: "preserve-3d" }}
          >
            {steps.map((step, index) => (
              <StepCard
                index={index}
                key={step.number}
                reduceMotion={reduceMotion}
                step={step}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          transition={{
            duration: reduceMotion ? 0 : 0.4,
            delay: reduceMotion ? 0 : 0.15,
          }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
        >
          <Link
            className="gearrent-primary-action group"
            href="/equipment"
          >
            Explore equipment
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
