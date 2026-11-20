"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { requestAuthAccessToken } from "@/lib/auth-token";

type PaymentState =
  | { status: "checking" }
  | { status: "paid"; bookingId: string; amountMinor: number }
  | { status: "processing" }
  | { status: "error"; message: string };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Request was cancelled.", "AbortError"));
      return;
    }

    let timeout = 0;
    const handleAbort = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", handleAbort);
      reject(new DOMException("Request was cancelled.", "AbortError"));
    };
    timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function getMessage(payload: unknown, fallback: string) {
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

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<PaymentState>({ status: "checking" });

  useEffect(() => {
    const controller = new AbortController();

    async function verifyPayment() {
      if (!sessionId) {
        setState({
          status: "error",
          message: "The Stripe Checkout session ID is missing.",
        });
        return;
      }

      try {
        const accessToken = await requestAuthAccessToken(
          apiBaseUrl,
          controller.signal,
        );
        const query = new URLSearchParams({ session_id: sessionId });

        for (let attempt = 0; attempt < 20; attempt += 1) {
          const response = await fetch(
            `${apiBaseUrl}/api/payments/checkout-status?${query}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: controller.signal,
            },
          );
          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            throw new Error("The payment service returned an invalid response.");
          }
          if (!response.ok) {
            throw new Error(
              getMessage(payload, "Could not verify the payment status."),
            );
          }
          if (
            typeof payload !== "object" ||
            payload === null ||
            !("status" in payload) ||
            typeof payload.status !== "string"
          ) {
            throw new Error("The payment service returned an invalid status.");
          }

          if (payload.status === "paid") {
            if (
              !("bookingId" in payload) ||
              typeof payload.bookingId !== "string" ||
              !("amountMinor" in payload) ||
              typeof payload.amountMinor !== "number"
            ) {
              throw new Error("The booking service returned an invalid record.");
            }
            setState({
              status: "paid",
              bookingId: payload.bookingId,
              amountMinor: payload.amountMinor,
            });
            return;
          }

          if (payload.status === "expired" || payload.status === "failed") {
            setState({
              status: "error",
              message:
                payload.status === "expired"
                  ? "This checkout session expired before payment was confirmed."
                  : "This checkout could not be completed.",
            });
            return;
          }

          if (payload.status !== "pending") {
            throw new Error("The payment service returned an unknown status.");
          }
          await wait(1500, controller.signal);
        }

        setState({ status: "processing" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not verify the payment status.",
        });
      }
    }

    void verifyPayment();
    return () => controller.abort();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#122035]">
      <div className="relative bg-[#08162d]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-32 sm:px-6 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#75d6c3]">
            GearRent payment
          </p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">
            Checkout status
          </h1>
        </div>
      </div>
      <main className="mx-auto grid min-h-[360px] max-w-5xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <section
          aria-live="polite"
          className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg sm:p-10"
        >
          {state.status === "checking" && (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto size-10 animate-spin text-[#087e78]"
              />
              <h2 className="mt-4 text-xl font-black text-[#08162d]">
                Confirming your payment
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We are waiting for Stripe to confirm the payment securely.
              </p>
            </>
          )}
          {state.status === "paid" && (
            <>
              <CircleCheck
                aria-hidden="true"
                className="mx-auto size-12 text-emerald-600"
              />
              <h2 className="mt-4 text-2xl font-black text-[#08162d]">
                Payment successful
              </h2>
              <p className="mt-2 text-slate-600">
                Your booking is confirmed. Paid amount: ৳
                {(state.amountMinor / 100).toLocaleString()}.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Booking reference: {state.bookingId}
              </p>
            </>
          )}
          {state.status === "processing" && (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto size-10 text-amber-600"
              />
              <h2 className="mt-4 text-xl font-black text-[#08162d]">
                Payment is still processing
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Stripe has not confirmed the booking yet. Please refresh this
                page in a moment before trying to pay again.
              </p>
            </>
          )}
          {state.status === "error" && (
            <>
              <CircleX
                aria-hidden="true"
                className="mx-auto size-12 text-red-600"
              />
              <h2 className="mt-4 text-xl font-black text-[#08162d]">
                Payment not confirmed
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {state.message}
              </p>
              <Link
                className="mt-4 inline-block text-sm font-bold text-[#087e78] underline"
                href={`/login?redirect=${encodeURIComponent(
                  `/payment/success?session_id=${sessionId ?? ""}`,
                )}`}
              >
                Sign in to check again
              </Link>
            </>
          )}
          <button
            className="gearrent-primary-action mt-7"
            onClick={() => router.push("/")}
            type="button"
          >
            Return to GearRent
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f7f5f0]">
          <p aria-live="polite">Loading payment status…</p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
