"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

type NavbarProps =
  | { isAuthenticated: true; onLogout: () => void }
  | { isAuthenticated?: false; onLogout?: never };

const navigationItemClassName =
  "flex h-10 items-center rounded px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const mobileNavigationItemClassName =
  "flex h-10 items-center rounded px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950";

function AuthLink({
  href,
  label,
  mobile,
  accent = false,
}: {
  href: string;
  label: string;
  mobile: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      className={`group inline-flex h-10 ${
        mobile ? "w-full" : "w-24"
      } items-center justify-center border px-3 text-sm font-semibold shadow-[0_2px_6px_#00000026] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100 ${
        accent
          ? `rounded-tl-[5px] rounded-tr-[20px] rounded-br-[5px] rounded-bl-[5px] ${
              mobile
                  ? "border-[#c94f1c] text-[#c94f1c] hover:bg-[#ffd277] hover:text-[#08162d] hover:shadow-[0_5px_16px_#ffd27755] focus-visible:bg-[#ffd277] focus-visible:text-[#08162d]"
                  : "border-[#ffd277] text-[#ffd277] hover:bg-[#ffd277] hover:text-[#08162d] hover:shadow-[0_5px_16px_#ffd27755] focus-visible:bg-[#ffd277] focus-visible:text-[#08162d]"
            }`
          : `rounded-tl-[20px] rounded-tr-[5px] rounded-br-[5px] rounded-bl-[5px] ${
              mobile
                  ? "border-[#e96a32] text-[#c94f1c] hover:bg-[#e96a32] hover:text-white hover:shadow-[0_5px_16px_#e96a3255] focus-visible:bg-[#e96a32] focus-visible:text-white"
                  : "border-[#e96a32] text-[#ffd277] hover:bg-[#e96a32] hover:text-white hover:shadow-[0_5px_16px_#e96a3255] focus-visible:bg-[#e96a32] focus-visible:text-white"
            }`
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function NavigationLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`${navigationItemClassName} group relative hover:text-[#ffd277]`}
      href={href}
    >
      <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 bottom-[7px] h-px origin-left rounded-full bg-gradient-to-r from-[#e96a32] via-[#ffd277] to-[#e96a32] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
        }`}
      />
      <span
        aria-hidden="true"
        className="absolute bottom-[4px] left-3 size-1.5 rounded-full bg-[#ffd277] opacity-0 shadow-[0_0_8px_#ffd277] transition-[left,opacity] duration-300 ease-out motion-reduce:transition-none group-hover:left-[calc(100%-0.75rem)] group-hover:opacity-100 group-focus-visible:left-[calc(100%-0.75rem)] group-focus-visible:opacity-100"
      />
    </Link>
  );
}

function AccountActions({
  isAuthenticated,
  onLogout,
  mobile = false,
}: NavbarProps & { mobile?: boolean }) {
  const linkClassName = mobile
    ? mobileNavigationItemClassName
    : navigationItemClassName;

  if (isAuthenticated) {
    return (
      <>
        <Link className={linkClassName} href="/dashboard">
          Dashboard
        </Link>
        <button className={linkClassName} onClick={onLogout} type="button">
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <AuthLink
        href="/login"
        label="Login"
        mobile={mobile}
      />
      <AuthLink
        href="/register"
        label="Register"
        mobile={mobile}
        accent
      />
    </>
  );
}

export function Navbar(props: NavbarProps = {}) {
  return (
    <header className="absolute inset-x-0 top-0 z-50 border-b border-white/15 bg-gradient-to-b from-slate-950/60 via-slate-950/25 to-transparent">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 xl:grid-cols-[1fr_auto_1fr] xl:px-8">
        <Link
          aria-label="GearRent home"
          className="flex shrink-0 items-center"
          href="/"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="h-10 w-auto object-contain sm:h-12"
            height={356}
            priority
            src="/images/gearrent-logo-light.png"
            width={1418}
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-self-center gap-1 xl:flex"
        >
          <NavigationLink active href="/" label="Home" />
          <NavigationLink href="/equipment" label="All Equipment" />
          <NavigationLink href="/about" label="About us" />
          <NavigationLink href="/contact" label="Contact Us" />
          <NavigationLink href="/how-it-works" label="How it works" />
        </nav>

        <div className="hidden items-center justify-self-end gap-1 xl:flex">
          <AccountActions {...props} />
        </div>

        <details className="group relative justify-self-end xl:hidden">
          <summary
            aria-label="Open navigation menu"
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/40 text-white hover:bg-white/10"
          >
            <Menu aria-hidden="true" className="size-5" />
          </summary>
          <div className="absolute right-0 top-full mt-2 grid w-64 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              <Link className={mobileNavigationItemClassName} href="/">
                Home
              </Link>
              <Link className={mobileNavigationItemClassName} href="/equipment">
                All Equipment
              </Link>
              <Link className={mobileNavigationItemClassName} href="/about">
                About us
              </Link>
              <Link className={mobileNavigationItemClassName} href="/contact">
                Contact Us
              </Link>
              <Link
                className={mobileNavigationItemClassName}
                href="/how-it-works"
              >
                How it works
              </Link>
            </nav>
            <div className="grid gap-1 border-t border-slate-200 pt-2">
              <AccountActions {...props} mobile />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
