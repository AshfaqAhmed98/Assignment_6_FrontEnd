"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isFeaturedEquipment,
  type FeaturedEquipment as FeaturedEquipmentItem,
} from "@/data/featured-equipment";
import {
  AuthAccessTokenError,
  requestAuthAccessToken,
} from "@/lib/auth-token";

type EquipmentDetailsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; item: FeaturedEquipmentItem };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

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

export default function EquipmentDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<EquipmentDetailsState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();
    const detailsUrl = `/equipment/${encodeURIComponent(id)}`;

    function redirectToLogin() {
      router.replace(`/login?redirect=${encodeURIComponent(detailsUrl)}`);
    }

    async function loadEquipment() {
      try {
        const accessToken = await requestAuthAccessToken(
          apiBaseUrl,
          controller.signal,
        );
        const response = await fetch(
          `${apiBaseUrl}/api/equipment/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
        );
        let payload: unknown;

        try {
          payload = await response.json();
        } catch {
          throw new Error("The equipment API returned an invalid response.");
        }

        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              payload,
              `Could not load equipment (HTTP ${response.status}).`,
            ),
          );
        }

        if (
          typeof payload !== "object" ||
          payload === null ||
          !("item" in payload) ||
          !isFeaturedEquipment(payload.item)
        ) {
          throw new Error("The equipment API returned an invalid item.");
        }

        setState({ status: "success", item: payload.item });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (
          error instanceof AuthAccessTokenError &&
          error.status === 401
        ) {
          redirectToLogin();
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load this equipment.",
        });
      }
    }

    void loadEquipment();
    return () => controller.abort();
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-bold text-slate-600 hover:text-[#e96a32]"
          href="/"
        >
          ← Back to featured equipment
        </Link>

        {state.status === "loading" && (
          <p aria-live="polite" className="py-16 text-center text-slate-600">
            Loading equipment details...
          </p>
        )}

        {state.status === "error" && (
          <div
            aria-live="assertive"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
            role="alert"
          >
            {state.message}
          </div>
        )}

        {state.status === "success" && (
          <article className="mt-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
            <div className="relative min-h-72 md:min-h-[430px]">
              <Image
                alt={state.item.name}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                src={state.item.image}
              />
            </div>
            <div className="p-7 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e96a32]">
                {state.item.category}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold text-slate-950">
                {state.item.name}
              </h1>
              <p className="mt-5 leading-7 text-slate-600">
                {state.item.description}
              </p>
              <p className="mt-7 text-sm text-slate-500">
                <span className="text-3xl font-extrabold text-slate-950">
                  ৳{state.item.dailyRate.toLocaleString()}
                </span>
                <span className="ml-2">per day</span>
              </p>
              <button
                className="mt-8 h-12 rounded-md bg-[#e96a32] px-6 text-sm font-bold text-white transition-colors hover:bg-[#c94f1c]"
                type="button"
              >
                Request rental
              </button>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
