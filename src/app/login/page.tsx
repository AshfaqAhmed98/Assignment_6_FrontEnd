"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Cog,
  Eye,
  EyeOff,
  Home,
  Info,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { requestAuthAccessToken } from "@/lib/auth-token";

type LoginNotice = {
  type: "success" | "error" | "info";
  message: string;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function getSafeRedirectTarget(value: string | null) {
  if (!value) {
    return "/";
  }

  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin) {
      return "/";
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

function getOAuthCallbackURL(status: "success" | "error") {
  const callbackURL = new URL("/login", window.location.origin);
  const redirectTarget = getSafeRedirectTarget(
    new URLSearchParams(window.location.search).get("redirect"),
  );
  callbackURL.searchParams.set("oauth", status);

  if (redirectTarget !== "/") {
    callbackURL.searchParams.set("redirect", redirectTarget);
  }

  return callbackURL.toString();
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function getOAuthErrorMessage(error: string | null) {
  const normalizedError = error?.trim().toLowerCase();

  if (
    normalizedError === "account_not_linked" ||
    normalizedError === "unable_to_link_account"
  ) {
    return "An account with this email already exists. Sign in with the email and password you used to create it. Google sign-in cannot be linked to this account yet.";
  }

  return "Google sign-in could not be completed. Please try again or sign in with your email and password.";
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The authentication server returned an invalid response.");
  }
}

export default function LoginPage() {
  const router = useRouter();
  const oauthCallbackHandled = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<LoginNotice | null>(null);

  useEffect(() => {
    if (oauthCallbackHandled.current) {
      return;
    }

    const url = new URL(window.location.href);
    const oauthStatus = url.searchParams.get("oauth");
    const redirectTarget = getSafeRedirectTarget(
      url.searchParams.get("redirect"),
    );
    const oauthError =
      url.searchParams.get("error_description") || url.searchParams.get("error");

    if (oauthStatus === "error" || oauthError) {
      oauthCallbackHandled.current = true;
      window.setTimeout(() => {
        setNotice({
          type: "error",
          message: getOAuthErrorMessage(oauthError),
        });
      }, 0);
      url.searchParams.delete("oauth");
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      router.replace(`${url.pathname}${url.search}`);
      return;
    }

    if (oauthStatus !== "success") {
      return;
    }

    oauthCallbackHandled.current = true;
    void (async () => {
      try {
        await requestAuthAccessToken(apiBaseUrl);
        router.replace(redirectTarget);
      } catch (error) {
        setNotice({
          type: "error",
          message: `Google sign-in completed, but an access token could not be issued. ${
            error instanceof Error ? error.message : "Please try again."
          }`,
        });
      }
    })();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });
      const payload = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Could not sign in. Please try again."),
        );
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("user" in payload) ||
        typeof payload.user !== "object" ||
        payload.user === null
      ) {
        throw new Error("The authentication server returned an invalid session.");
      }

      try {
        await requestAuthAccessToken(apiBaseUrl);
      } catch (error) {
        setNotice({
          type: "error",
          message: `You are signed in, but an access token could not be issued. ${
            error instanceof Error ? error.message : "Please try again."
          }`,
        });
        return;
      }

      router.push(
        getSafeRedirectTarget(
          new URLSearchParams(window.location.search).get("redirect"),
        ),
      );
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to the authentication service.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setNotice(null);
    setIsSubmitting(true);

    try {
      const callbackURL = getOAuthCallbackURL("success");
      const errorCallbackURL = getOAuthCallbackURL("error");
      const response = await fetch(`${apiBaseUrl}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          callbackURL,
          newUserCallbackURL: callbackURL,
          errorCallbackURL,
        }),
      });
      const payload = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(
            payload,
            "Google sign-in is unavailable. Check the backend OAuth configuration.",
          ),
        );
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("The authentication server did not return a Google URL.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to Google sign-in.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#122035]">
      {notice && (
        <div
          aria-live={notice.type === "error" ? "assertive" : "polite"}
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${
            notice.type === "success"
              ? "border-emerald-200 bg-white text-emerald-900"
              : notice.type === "info"
                ? "border-sky-200 bg-white text-sky-900"
                : "border-red-200 bg-white text-red-900"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <span className="mt-0.5">
            {notice.type === "success" ? (
              <CircleCheck aria-hidden="true" className="size-5" />
            ) : notice.type === "info" ? (
              <Info aria-hidden="true" className="size-5" />
            ) : (
              <Sparkles aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="flex-1">{notice.message}</span>
          <button
            aria-label="Dismiss message"
            className="font-bold underline underline-offset-2"
            onClick={() => setNotice(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative isolate flex min-h-[330px] flex-col overflow-hidden bg-[#101c2e] px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
          <Image
            alt=""
            aria-hidden="true"
            className="-z-10 object-cover object-center"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 52vw"
            src="/images/equipment-rental-banner.jpg"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a1729]/95 via-[#0a1729]/75 to-[#0a1729]/45"
          />
          <div
            aria-hidden="true"
            className="absolute -left-24 top-1/3 z-0 size-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -left-12 top-[38%] z-0 size-56 rounded-full border border-[#ffd277]/20"
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link aria-label="GearRent home" className="inline-flex" href="/">
              <Image
                alt="GearRent"
                className="h-10 w-auto object-contain sm:h-12"
                height={356}
                priority
                src="/images/gearrent-logo-light.png"
                width={1418}
              />
            </Link>
            <Link
              className="group inline-flex h-10 items-center gap-2 rounded-md border border-[#e96a32] bg-[#e96a32] px-4 text-xs font-bold text-white shadow-[0_6px_18px_#00000026] transition-all duration-300 hover:-translate-y-0.5 hover:bg-transparent hover:text-[#ffd277] hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              href="/"
            >
              <Home
                aria-hidden="true"
                className="size-4 text-current transition-transform duration-300 group-hover:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              />
              Back to home
            </Link>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center py-12 lg:py-16">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffd277]/30 bg-[#ffd277]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#ffe1a3]">
              <Sparkles aria-hidden="true" className="size-3.5" />
              GOOD TO HAVE YOU BACK
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Your next project
              <span className="mt-1 block text-[#ffd277]">
                starts right here.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200 sm:text-base">
              Sign in to pick up where you left off and find the equipment that
              helps get the job done.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["One account", "Trusted rentals", "Ready to get to work"].map(
                (label) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm"
                    key={label}
                  >
                    <Check
                      aria-hidden="true"
                      className="size-3.5 text-[#ffd277]"
                    />
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative z-10 hidden items-center justify-between border-t border-white/15 pt-5 text-xs text-white/65 sm:flex">
            <span>Tools for every kind of ambition.</span>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-3 transition-colors hover:border-[#ffd277]/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277]"
              href="/"
            >
              <span className="grid size-7 place-items-center rounded-full bg-[#ffd277]/15 text-[#ffd277]">
                <Cog aria-hidden="true" className="size-4" />
              </span>
              <span className="text-sm font-extrabold tracking-tight text-white">
                Gear<span className="text-[#ffd277]">Rent</span>
              </span>
            </Link>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -top-32 size-96 rounded-full bg-[#e96a32]/[0.06] blur-3xl"
          />
          <div className="relative w-full max-w-[440px]">
            <div className="mb-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#c94f1c]">
                Welcome back to GearRent
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#122035] sm:text-4xl">
                Sign in to your account
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Enter your details below to continue.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="login-email"
              >
                Email address
                <span className="relative mt-2 block">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm font-medium text-[#122035] shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                    id="login-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <div>
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="login-password"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-medium text-[#122035] shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                    id="login-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-5" />
                    ) : (
                      <Eye aria-hidden="true" className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                  <input
                    checked={rememberMe}
                    className="size-4 rounded border-slate-300 accent-[#e96a32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                    onChange={(event) => setRememberMe(event.target.checked)}
                    type="checkbox"
                  />
                  Remember me
                </label>
                <button
                  className="rounded-sm text-sm font-semibold text-[#c94f1c] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                  onClick={() =>
                    setNotice({
                      type: "info",
                      message:
                        "Password reset is not available yet because email delivery has not been configured.",
                    })
                  }
                  type="button"
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="gearrent-primary-action group w-full"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                OR CONTINUE WITH
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              type="button"
            >
              <span
                aria-hidden="true"
                className="grid size-5 place-items-center rounded-full border border-slate-200 text-sm font-extrabold text-[#4285f4]"
              >
                G
              </span>
              Continue with Google
            </button>

            <p className="mt-7 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                className="font-bold text-[#c94f1c] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                href="/register"
              >
                Create an account
              </Link>
            </p>
            <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Your details stay private and protected.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
