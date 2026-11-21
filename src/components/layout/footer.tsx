"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const exploreLinks = [
  { label: "All Equipment", href: "/equipment" },
  { label: "Why GearRent", href: "/#why-choose-us-title" },
  { label: "Customer Reviews", href: "/#customer-reviews-title" },
  { label: "How It Works", href: "/#how-it-works-title" },
];

type DashboardRole = "Customer" | "Owner" | "Admin";
type FooterAuthState =
  | { status: "checking" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; role: DashboardRole }
  | { status: "error"; message: string };

type FooterLink = { label: string; href: string };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const accountLinksByRole: Record<DashboardRole, FooterLink[]> = {
  Customer: [
    { label: "My Dashboard", href: "/dashboard" },
    { label: "My Rentals", href: "/dashboard/rentals" },
    { label: "Saved Equipment", href: "/dashboard/favorites" },
    { label: "My Profile", href: "/dashboard/profile" },
  ],
  Owner: [
    { label: "My Dashboard", href: "/dashboard" },
    { label: "My Equipment", href: "/dashboard/equipment" },
    { label: "Rental Activity", href: "/dashboard/equipment-rentals" },
    { label: "My Profile", href: "/dashboard/profile" },
  ],
  Admin: [
    { label: "Admin Dashboard", href: "/dashboard" },
    { label: "Manage Users", href: "/dashboard/users" },
    { label: "All Equipment", href: "/dashboard/all-equipment" },
    { label: "All Rentals", href: "/dashboard/all-rentals" },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type SocialIconName =
  | "facebook"
  | "instagram"
  | "github"
  | "location"
  | "phone"
  | "email";

const socialLinks: Array<{
  label: string;
  href: string;
  icon: SocialIconName;
  color: string;
}> = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/ash.k.siam",
    icon: "facebook",
    color: "#75d6c3",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/ash_k_siam/",
    icon: "instagram",
    color: "#ffc45b",
  },
  {
    label: "GitHub",
    href: "https://github.com/AshfaqAhmed98",
    icon: "github",
    color: "#fb9060",
  },
  {
    label: "Location",
    href: "https://maps.app.goo.gl/tZGuBaBnWGEwUcuz6?g_st=an",
    icon: "location",
    color: "#75d6c3",
  },
  {
    label: "Phone",
    href: "/contact",
    icon: "phone",
    color: "#ffc45b",
  },
  {
    label: "Email",
    href: "/contact",
    icon: "email",
    color: "#fb9060",
  },
];

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "facebook") {
    return (
      <svg aria-hidden="true" className="size-[18px]" fill="currentColor" viewBox="0 0 320 512">
        <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg aria-hidden="true" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" fill="currentColor" r="1" stroke="none" />
      </svg>
    );
  }

  if (name === "location") {
    return <MapPin aria-hidden="true" className="size-[18px]" />;
  }

  if (name === "phone") {
    return <Phone aria-hidden="true" className="size-[18px]" />;
  }

  if (name === "email") {
    return <Mail aria-hidden="true" className="size-[18px]" />;
  }

  return (
    <svg aria-hidden="true" className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .7a11.3 11.3 0 0 0-3.57 22c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.54-.29-5.21-1.27-5.21-5.64 0-1.25.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17a10.9 10.9 0 0 1 5.72 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.81 1.17 3.06 0 4.38-2.68 5.35-5.23 5.63.41.36.78 1.06.78 2.14v3.18c0 .3.21.66.79.55A11.3 11.3 0 0 0 12 .7z" />
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const [authState, setAuthState] = useState<FooterAuthState>({
    status: "checking",
  });

  const refreshAuthState = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The authentication server returned an invalid session.");
      }

      if (!response.ok) {
        throw new Error("Could not check your sign-in status.");
      }
      if (payload === null) {
        setAuthState({ status: "unauthenticated" });
        return;
      }
      if (
        !isRecord(payload) ||
        !("session" in payload) ||
        !("user" in payload) ||
        (payload.session !== null && !isRecord(payload.session)) ||
        (payload.user !== null && !isRecord(payload.user))
      ) {
        throw new Error("The authentication server returned an invalid session.");
      }
      if (payload.session === null || payload.user === null) {
        setAuthState({ status: "unauthenticated" });
        return;
      }

      const role = payload.user.role ?? "Customer";
      if (role !== "Customer" && role !== "Owner" && role !== "Admin") {
        throw new Error("The account has an unsupported role.");
      }
      setAuthState({ status: "authenticated", role });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setAuthState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not check your sign-in status.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refreshTimeout = window.setTimeout(
      () => void refreshAuthState(controller.signal),
      0,
    );

    const handleAuthChange = () => {
      void refreshAuthState(controller.signal);
    };
    window.addEventListener("gearrent:auth-changed", handleAuthChange);
    return () => {
      window.clearTimeout(refreshTimeout);
      controller.abort();
      window.removeEventListener("gearrent:auth-changed", handleAuthChange);
    };
  }, [pathname, refreshAuthState]);

  const accountLinks =
    authState.status === "authenticated"
      ? accountLinksByRole[authState.role]
      : authState.status === "unauthenticated"
        ? [
            { label: "Sign In", href: "/login" },
            { label: "Create Account", href: "/register" },
          ]
        : [];

  return (
    <footer className="relative isolate overflow-hidden bg-[#08162d] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-[-12rem] size-[28rem] rounded-full bg-[#75d6c3]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-[-12rem] size-[30rem] rounded-full bg-[#e96a32]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid items-end gap-7 border-b border-white/10 py-12 lg:grid-cols-[1fr_auto]"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#75d6c3]">
              Your next project starts here
            </p>
            <h2 className="gearrent-section-heading mt-3 max-w-2xl text-white">
              Get the gear.
              <span className="block text-[#ffc45b]">Make something great.</span>
            </h2>
          </div>
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
        </motion.div>

        <motion.div
          className="grid gap-10 py-10 md:grid-cols-[1.25fr_0.75fr_0.75fr]"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
        >
          <div>
            <Link aria-label="GearRent home" className="inline-flex" href="/">
              <Image
                alt=""
                aria-hidden="true"
                className="h-11 w-auto object-contain"
                height={356}
                src="/images/gearrent-logo-light.png"
                width={1418}
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Rental planning for construction, creative work, events,
              agriculture, and more.
            </p>
          </div>

          <nav aria-label="Explore GearRent">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#75d6c3]">
              Explore
            </h3>
            <ul className="mt-5 grid gap-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-sm text-slate-300 transition-colors hover:text-[#ffc45b]"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="GearRent account">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffc45b]">
              Account
            </h3>
            <ul className="mt-5 grid gap-3">
              {authState.status === "checking" && (
                <li
                  aria-live="polite"
                  className="text-sm text-slate-300"
                  role="status"
                >
                  Checking sign-in…
                </li>
              )}
              {authState.status === "error" && (
                <li className="text-sm text-rose-200" role="alert">
                  {authState.message}{" "}
                  <button
                    className="underline underline-offset-2"
                    onClick={() => void refreshAuthState()}
                    type="button"
                  >
                    Try again
                  </button>
                </li>
              )}
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-sm text-slate-300 transition-colors hover:text-[#75d6c3]"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </motion.div>

        <div className="flex flex-col gap-5 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © 2026 GearRent. All rights reserved.
          </p>

          <nav aria-label="GearRent social and contact links">
            <ul className="flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <motion.li
                  key={social.label}
                  whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                >
                  <Link
                    aria-label={social.label}
                    className="group relative flex size-11 items-center justify-center"
                    href={social.href}
                    rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                    style={{ color: social.color }}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-[5px] rounded-full border border-current opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:opacity-20"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-[5px] rounded-full border border-current opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-40"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-[5px] rounded-full border border-current opacity-0 transition-all duration-300 group-hover:opacity-70"
                    />
                    <span
                      className="relative z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-[#0d2039] shadow-[inset_0_0_16px_rgba(255,255,255,0.08),0_8px_16px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:translate-x-2 group-hover:-translate-y-2"
                    >
                      <SocialIcon name={social.icon} />
                    </span>
                    <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#08162d] opacity-0 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                      {social.label}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
