import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Contact GearRent",
  description:
    "Contact GearRent about equipment rentals, listings, bookings, or your account.",
};

const contactEmail = "ashkcm98@gmail.com";
const contactEmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;
const contactPhone = "+880 1866 206500";
const contactPhoneHref = "+8801866206500";
const contactWhatsAppHref = "https://wa.me/8801866206500";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="gearrent-contact-page overflow-hidden bg-[#f7f5f0] text-[#122035] dark:bg-[#080f1e] dark:text-slate-100">
        <section className="relative isolate overflow-hidden bg-[#08162d] px-4 pb-16 pt-36 text-white sm:px-6 sm:pb-20 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(117,214,195,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(117,214,195,0.11)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-[#e96a32]/20 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 bottom-[-18rem] size-[38rem] rounded-full bg-[#75d6c3]/15 blur-[110px]"
          />

          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#ffc45b]/35 bg-[#ffc45b]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffe3a3]">
                <MessageCircle aria-hidden="true" className="size-4" />
                Contact GearRent
              </p>
              <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Tell us what
                <span className="block text-[#75d6c3]">you’re working on.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Questions about a booking, a listing, or getting started? Send
                us a note and we’ll get it to the GearRent team.
              </p>
            </div>

            <Link
              className="group inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3]"
              href="#send-a-message"
            >
              Send a message
              <ArrowDown
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-y-1"
              />
            </Link>
          </div>
        </section>

        <section
          aria-label="Contact details and message form"
          className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
            <aside className="space-y-5">
              <div className="rounded-3xl bg-[#10243b] p-6 text-white shadow-[0_24px_60px_rgba(8,22,45,0.16)] sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#75d6c3]">
                  Reach us directly
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">
                  Pick the way that works for you.
                </h2>
                <div className="mt-7 grid gap-3">
                  <a
                    className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3]"
                    href={contactEmailHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#75d6c3]/15 text-[#a7f3e5]">
                      <Mail aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </span>
                      <span className="mt-1 block break-all text-sm font-bold text-white group-hover:text-[#a7f3e5]">
                        {contactEmail}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-auto mt-1 size-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-1"
                    />
                  </a>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffc45b]/15 text-[#ffe3a3]">
                      <Phone aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Phone / WhatsApp
                      </span>
                      <a
                        className="mt-1 block w-fit text-sm font-bold text-white transition-colors hover:text-[#ffe3a3] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffc45b]"
                        href={`tel:${contactPhoneHref}`}
                      >
                        {contactPhone}
                      </a>
                      <a
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#a7f3e5] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3]"
                        href={contactWhatsAppHref}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Message on WhatsApp
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                      </a>
                    </span>
                  </div>
                </div>
                <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
                  Include the booking or listing name if your question is about
                  a specific rental.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-[#08162d]/10 bg-white p-6 dark:border-white/10 dark:bg-[#101d31] sm:p-8">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 size-32 rounded-full bg-[#ffc45b]/20 blur-2xl"
                />
                <div className="relative flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff1e9] text-[#c94f1c] dark:bg-[#352a22] dark:text-[#ffad8b]">
                    <MapPin aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-extrabold text-[#08162d] dark:text-white">
                      GearRent, Bangladesh
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Browse equipment and connect with owners for projects
                      wherever you work.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div
              className="scroll-mt-24 rounded-3xl border border-[#08162d]/10 bg-white p-6 shadow-[0_24px_70px_rgba(8,22,45,0.08)] dark:border-white/10 dark:bg-[#101d31] sm:p-8 lg:p-10"
              id="send-a-message"
            >
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-white/10">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#087e78] dark:text-[#75d6c3]">
                    We’re listening
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#08162d] dark:text-white">
                    Send a message
                  </h2>
                </div>
                <span className="rounded-full bg-[#e6f8f2] px-3 py-1.5 text-xs font-bold text-[#087e61] dark:bg-[#19312d] dark:text-[#a7f3e5]">
                  Contact form
                </span>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
