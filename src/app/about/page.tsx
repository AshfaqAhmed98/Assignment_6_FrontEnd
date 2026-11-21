import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Compass,
  Handshake,
  PackageCheck,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "About GearRent",
  description:
    "Learn how GearRent connects people who need equipment with owners who have it to rent.",
};

const principles = [
  {
    number: "01",
    title: "Find a better fit",
    description:
      "Explore equipment by category, compare rental rates, and review listing details before you book.",
    icon: Compass,
    tone: "text-[#75d6c3]",
    glow: "bg-[#75d6c3]/15",
  },
  {
    number: "02",
    title: "Rent for the work ahead",
    description:
      "Choose from available daily, weekly, or monthly rates to match the length of your project.",
    icon: CalendarDays,
    tone: "text-[#ffc45b]",
    glow: "bg-[#ffc45b]/15",
  },
  {
    number: "03",
    title: "Put good gear to work",
    description:
      "Equipment owners can list what they have and make it discoverable to people who need it.",
    icon: PackageCheck,
    tone: "text-[#fb9060]",
    glow: "bg-[#fb9060]/15",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="gearrent-about-page overflow-hidden bg-[#f7f5f0] text-[#122035] dark:bg-[#080f1e] dark:text-slate-100">
        <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-[#08162d] px-4 pb-20 pt-32 text-white sm:px-6 lg:min-h-[740px] lg:px-8">
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover object-center opacity-45"
            fill
            priority
            sizes="100vw"
            src="/images/construction-team-banner.jpg"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,22,45,0.98)_0%,rgba(8,22,45,0.88)_48%,rgba(8,22,45,0.34)_100%),linear-gradient(0deg,rgba(8,22,45,0.55),transparent_65%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 top-24 size-[34rem] rounded-full border border-[#75d6c3]/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-40 size-[24rem] rounded-full border border-[#ffc45b]/20"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-end gap-12 lg:grid-cols-[1fr_0.72fr]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#75d6c3]/35 bg-[#75d6c3]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#a7f3e5]">
                <Handshake aria-hidden="true" className="size-4" />
                About GearRent
              </p>
              <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Good work starts
                <span className="block bg-gradient-to-r from-[#75d6c3] via-[#ffc45b] to-[#fb9060] bg-clip-text pb-2 text-transparent">
                  with the right gear.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                GearRent connects people looking for equipment with owners ready
                to rent it out—so a project can move forward without buying
                every tool.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  className="gearrent-primary-action group"
                  href="/equipment"
                >
                  Find equipment
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/25 bg-white/5 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3]"
                  href="/contact"
                >
                  Talk to us
                  <ArrowDown aria-hidden="true" className="size-4 -rotate-45" />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:mb-1 lg:justify-self-end">
              <div className="absolute -inset-3 rotate-3 rounded-[2rem] border border-[#ffc45b]/45" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/20 bg-[#10243b]/90 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#75d6c3]">
                  One platform
                </p>
                <p className="mt-4 text-3xl font-black leading-tight">
                  For the people who need gear
                  <span className="text-[#ffc45b]">—and the people who own it.</span>
                </p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#75d6c3]/15 text-[#a7f3e5]">
                    <Handshake aria-hidden="true" className="size-5" />
                  </span>
                  <p className="text-sm leading-6 text-slate-300">
                    Browse, compare, rent, and list equipment in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <span className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:flex">
            Keep exploring
            <ArrowDown aria-hidden="true" className="size-3.5" />
          </span>
        </section>

        <section className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#087e78] dark:text-[#75d6c3]">
                  Why we built it
                </p>
                <h2 className="gearrent-section-heading mt-4">
                  Access can move a project forward.
                </h2>
              </div>
              <div className="max-w-3xl">
                <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                  Not every project needs a permanent purchase. GearRent gives
                  renters a way to explore available equipment and gives owners
                  a place to share their listings with people who can use them.
                </p>
                <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-400">
                  We keep the essentials close at hand: equipment details,
                  locations, rental rates, booking, and a place for customers
                  to share feedback after a completed rental.
                </p>
              </div>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {principles.map((principle) => (
                <article
                  className="group relative overflow-hidden rounded-2xl border border-[#08162d]/10 bg-white p-6 shadow-[0_16px_40px_rgba(8,22,45,0.06)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#101d31]"
                  key={principle.number}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -right-8 -top-8 size-32 rounded-full ${principle.glow} blur-2xl transition-transform duration-500 group-hover:scale-150`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#08162d] text-white dark:bg-[#172944]">
                        <principle.icon
                          aria-hidden="true"
                          className={`size-5 ${principle.tone}`}
                        />
                      </span>
                      <span className="font-mono text-sm font-bold tracking-widest text-slate-400">
                        {principle.number}
                      </span>
                    </div>
                    <h3 className="mt-8 text-xl font-extrabold text-[#08162d] dark:text-white">
                      {principle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {principle.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#10243b] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-32 size-96 rounded-full bg-[#75d6c3]/10 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffc45b]">
                Your next project
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Let’s find what you need to get moving.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Browse current listings, or get in touch if you have a question
                about using GearRent.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="gearrent-primary-action group"
                href="/equipment"
              >
                Browse equipment
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-md border border-white/20 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3]"
                href="/contact"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
