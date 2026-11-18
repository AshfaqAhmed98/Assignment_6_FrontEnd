"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/equipment-rental-banner.jpg",
    imageAlt: "Construction workers using equipment at a building site",
    eyebrow: "GearRent equipment rentals",
    heading: "Get the right gear",
    accent: "for what comes next.",
    description:
      "Find and rent equipment for home projects, building work, and outdoor plans—all in one place.",
    collection: "Project essentials",
    collectionDescription: "A good plan starts with the right gear.",
    categories: ["Tools", "Outdoor", "Home"],
    controlLabel: "Gear",
  },
  {
    image: "/images/construction-team-banner.jpg",
    imageAlt: "A construction crew working on a building foundation",
    eyebrow: "Equipment for the job ahead",
    heading: "Bring your next big build",
    accent: "to life.",
    description:
      "Find the equipment you need to tackle your next construction project with confidence.",
    collection: "Built for big ideas",
    collectionDescription: "Get ready for the heavy lifting.",
    categories: ["Lifting", "Power", "Build"],
    controlLabel: "Build",
  },
  {
    image: "/images/tools-rental-banner.jpg",
    imageAlt: "A collection of tools for home improvement projects",
    eyebrow: "Tools for every project",
    heading: "Make every project",
    accent: "a little easier.",
    description:
      "From quick repairs to weekend plans, rent the tools you need for the work ahead.",
    collection: "The weekend toolkit",
    collectionDescription: "Take on the to-do list, one tool at a time.",
    categories: ["Repair", "Create", "Finish"],
    controlLabel: "Tools",
  },
] as const;

const controlButtonClassName =
  "inline-flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type TypewriterTextProps = {
  text: string;
  startIndex: number;
  prefersReducedMotion: boolean;
  onComplete?: () => void;
};

function TypewriterText({
  text,
  startIndex,
  prefersReducedMotion,
  onComplete,
}: TypewriterTextProps) {
  const words = text.split(" ");

  return words.map((word, wordIndex) => {
    const wordStartIndex =
      startIndex +
      words
        .slice(0, wordIndex)
        .reduce(
          (length, previousWord) => length + previousWord.length + 1,
          0,
        );

    return (
      <span className="inline" key={wordIndex}>
        <span className="inline-block whitespace-nowrap">
          {word.split("").map((character, characterIndex) => {
            const isLastCharacter =
              wordIndex === words.length - 1 &&
              characterIndex === word.length - 1;

            return (
              <motion.span
                animate={{ opacity: 1, width: "auto" }}
                className="inline-block overflow-hidden"
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, width: 0 }
                }
                key={characterIndex}
                onAnimationComplete={
                  isLastCharacter ? onComplete : undefined
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.1,
                  delay: prefersReducedMotion
                    ? 0
                    : (wordStartIndex + characterIndex) * 0.035,
                  ease: "easeOut",
                }}
              >
                {character}
              </motion.span>
            );
          })}
        </span>
        {wordIndex < words.length - 1 && (
          <motion.span
            animate={{ opacity: 1, width: "auto" }}
            className="inline-block overflow-hidden whitespace-pre"
            initial={
              prefersReducedMotion ? false : { opacity: 0, width: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.1,
              delay: prefersReducedMotion ? 0 : (wordStartIndex + word.length) * 0.035,
              ease: "easeOut",
            }}
          >
            {" "}
          </motion.span>
        )}
      </span>
    );
  });
}

function TypingCaret({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.span
      aria-hidden="true"
      animate={{ opacity: prefersReducedMotion ? 1 : [1, 0, 1] }}
      className="ml-1 inline-block h-[0.8em] w-0.5 translate-y-[0.08em] rounded-full bg-[#e96a32] align-baseline"
      transition={{
        duration: 0.85,
        ease: "linear",
        repeat: prefersReducedMotion ? 0 : Infinity,
      }}
    />
  );
}

function AnimatedHeadline({
  heading,
  accent,
  prefersReducedMotion,
}: {
  heading: string;
  accent: string;
  prefersReducedMotion: boolean;
}) {
  const [headingComplete, setHeadingComplete] = useState(false);
  const isHeadingComplete = prefersReducedMotion || headingComplete;

  return (
    <>
      <span aria-hidden="true">
        <TypewriterText
          onComplete={() => setHeadingComplete(true)}
          prefersReducedMotion={prefersReducedMotion}
          startIndex={0}
          text={heading}
        />
        {!isHeadingComplete && (
          <TypingCaret prefersReducedMotion={prefersReducedMotion} />
        )}
      </span>
      <span aria-hidden="true" className="mt-2 block text-[#ffc45b]">
        <TypewriterText
          prefersReducedMotion={prefersReducedMotion}
          startIndex={heading.length + 3}
          text={accent}
        />
        {isHeadingComplete && (
          <TypingCaret prefersReducedMotion={prefersReducedMotion} />
        )}
      </span>
    </>
  );
}

export function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] =
    useState(false);
  const prefersReducedMotion = systemPrefersReducedMotion;
  const activeSlide = slides[activeIndex];
  const isPaused = isManuallyPaused || prefersReducedMotion;

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = () =>
      setSystemPrefersReducedMotion(motionPreference.matches);

    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () =>
      motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, isPaused]);

  function showSlide(index: number) {
    setActiveIndex(index);
  }

  return (
    <section
      aria-label="Featured equipment rentals"
      aria-roledescription="carousel"
      className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-slate-950 pt-20 text-white sm:min-h-[740px]"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={activeSlide.image}
          aria-hidden="true"
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-0"
          exit={{ opacity: 0 }}
          initial={{
            opacity: 0,
            scale: prefersReducedMotion ? 1 : 1.06,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.8,
            ease: "easeInOut",
          }}
        >
          <Image
            alt=""
            className="object-cover object-center"
            fill
            loading="eager"
            sizes="100vw"
            src={activeSlide.image}
          />
        </motion.div>
      </AnimatePresence>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-r from-[#08162d]/95 via-[#08162d]/70 to-[#08162d]/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-t from-[#08162d]/55 via-transparent to-[#08162d]/25"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-20 pb-40 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
          <motion.div
            key={activeSlide.heading}
            aria-label={`Slide ${activeIndex + 1} of ${slides.length}`}
            aria-roledescription="slide"
            animate={{ opacity: 1, x: 0 }}
            className="col-start-1 row-start-1 max-w-3xl"
            initial={false}
            role="group"
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              ease: "easeOut",
            }}
          >
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: prefersReducedMotion ? 0 : 0.15,
                }}
              >
                <Sparkles
                  aria-hidden="true"
                  className="size-4 text-[#ffc45b]"
                />
                {activeSlide.eyebrow}
              </motion.p>
              <motion.h1
                aria-label={`${activeSlide.heading} ${activeSlide.accent}`}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: prefersReducedMotion ? 0 : 0.22,
                }}
              >
                <AnimatedHeadline
                  key={activeIndex}
                  accent={activeSlide.accent}
                  heading={activeSlide.heading}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </motion.h1>
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: prefersReducedMotion ? 0 : 0.32,
                }}
              >
                {activeSlide.description}
              </motion.p>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: prefersReducedMotion ? 0 : 0.4,
                }}
              >
                <Link
                  className="inline-flex h-12 items-center gap-3 rounded-md bg-[#e96a32] px-6 text-sm font-bold text-white transition-colors hover:bg-[#d85b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="/equipment"
                >
                  Browse equipment
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  className="inline-flex h-12 items-center rounded-md border border-white/50 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="/how-it-works"
                >
                  How it works
                </Link>
              </motion.div>
          </motion.div>

          <motion.aside
            key={activeSlide.collection}
            aria-label={`${activeSlide.collection} featured collection`}
            animate={{ opacity: 1, y: 0 }}
            className="relative col-start-2 row-start-1 hidden xl:block"
            initial={false}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 0.1,
              ease: "easeOut",
            }}
          >
              <motion.div
                aria-hidden="true"
                animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
                className="absolute left-1/2 top-12 size-[19rem] rounded-full border border-[#ffc45b]/35"
                transition={{
                  duration: 24,
                  ease: "linear",
                  repeat: prefersReducedMotion ? 0 : Infinity,
                }}
              >
                <span className="absolute right-8 top-8 size-2.5 rounded-full bg-[#ffc45b] shadow-[0_0_1.25rem_#ffc45b]" />
              </motion.div>
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/65 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    GearRent / Project kit
                  </span>
                  <Sparkles
                    aria-hidden="true"
                    className="size-5 text-[#ffc45b]"
                  />
                </div>
                <div className="my-7 flex size-16 items-center justify-center rounded-2xl bg-[#e96a32] text-2xl font-black text-white shadow-lg shadow-[#e96a32]/30">
                  0{activeIndex + 1}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffc45b]">
                  The right kit for
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {activeSlide.collection}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {activeSlide.collectionDescription}
                </p>
                <div
                  aria-label="Featured equipment categories"
                  className="mt-6 flex flex-wrap gap-2"
                >
                  {activeSlide.categories.map((category) => (
                    <span
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"
                      key={category}
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="mt-7 h-1 w-16 rounded-full bg-[#ffc45b]"
                />
              </div>
          </motion.aside>
        </div>
      </div>

      <div
        aria-label="Slideshow controls"
        className="absolute inset-x-2 bottom-10 z-30 mx-auto flex max-w-7xl justify-center sm:inset-x-6 sm:bottom-12 sm:justify-end lg:inset-x-8"
        role="group"
      >
        <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-slate-950/45 p-1.5 backdrop-blur-md">
          <button
            aria-label="Previous slide"
            className={`${controlButtonClassName} size-8 sm:size-10`}
            onClick={() =>
              showSlide((activeIndex + slides.length - 1) % slides.length)
            }
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <div
            aria-label="Choose a featured banner slide"
            className="relative grid grid-cols-3 rounded-full border border-white/50 bg-white p-1 shadow-lg shadow-black/20 select-none"
            role="radiogroup"
          >
            {slides.map((slide, index) => {
              const isSelected = index === activeIndex;

              return (
                <label className="group relative flex" key={slide.image}>
                  <input
                    checked={isSelected}
                    className="peer sr-only"
                    name="gearrent-hero-slide"
                    onChange={() => showSlide(index)}
                    type="radio"
                    value={index}
                  />
                  <span
                    className={`peer-focus-visible:rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ffc45b] relative z-10 flex h-9 w-14 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                      isSelected
                        ? "text-white"
                        : "text-slate-700 hover:text-[#c94f1c]"
                    }`}
                  >
                    {slide.controlLabel}
                  </span>
                </label>
              );
            })}
            <motion.span
              aria-hidden="true"
              animate={{ x: activeIndex * 56 }}
              className="absolute bottom-1 left-1 top-1 z-0 w-14 rounded-full bg-[#e96a32] shadow-sm"
              initial={false}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.28,
                ease: "easeOut",
              }}
            />
          </div>
          <button
            aria-label={
              isManuallyPaused ? "Resume slideshow" : "Pause slideshow"
            }
            className={`${controlButtonClassName} size-8 sm:size-10`}
            onClick={() => setIsManuallyPaused((paused) => !paused)}
            type="button"
          >
            {isManuallyPaused ? (
              <Play aria-hidden="true" className="size-4" />
            ) : (
              <Pause aria-hidden="true" className="size-4" />
            )}
          </button>
          <button
            aria-label="Next slide"
            className={`${controlButtonClassName} size-8 sm:size-10`}
            onClick={() => showSlide((activeIndex + 1) % slides.length)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <p
        aria-atomic="true"
        aria-live={isPaused ? "polite" : "off"}
        className="sr-only"
      >
        Slide {activeIndex + 1} of {slides.length}: {activeSlide.heading}{" "}
        {activeSlide.accent}
      </p>

      <a
        className="absolute bottom-3 right-4 z-30 text-xs text-white/70 underline-offset-2 hover:underline"
        href="https://unsplash.com"
        rel="noreferrer"
        target="_blank"
      >
        Photos via Unsplash
      </a>
      </section>
  );
}
