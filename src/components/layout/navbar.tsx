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

const registerLinkClassName =
  "flex h-10 items-center justify-center rounded bg-[#e96a32] px-4 text-sm font-bold text-white transition-colors hover:bg-[#d85b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
      <Link className={linkClassName} href="/login">
        Login
      </Link>
      <Link className={registerLinkClassName} href="/register">
        Register
      </Link>
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
            className="h-14 w-auto object-contain sm:h-16"
            height={724}
            priority
            src="/images/GearRent%20Navy%20and%20Orange%20Logo.png"
            width={2172}
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-self-center gap-1 xl:flex"
        >
          <Link
            aria-current="page"
            className={navigationItemClassName}
            href="/"
          >
            Home
          </Link>
          <Link className={navigationItemClassName} href="/equipment">
            All Equipment
          </Link>
          <Link className={navigationItemClassName} href="/about">
            About us
          </Link>
          <Link className={navigationItemClassName} href="/contact">
            Contact Us
          </Link>
          <Link className={navigationItemClassName} href="/how-it-works">
            How it works
          </Link>
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
