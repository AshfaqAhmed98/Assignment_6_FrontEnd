"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Send } from "lucide-react";
import {
  apiBaseUrl,
  getResponseMessage,
  readResponseBody,
} from "@/lib/dashboard-api";

const topics = [
  "Booking support",
  "Equipment listing",
  "Account help",
  "Other",
] as const;

type ContactFormValues = {
  name: string;
  email: string;
  topic: (typeof topics)[number] | "";
  message: string;
};

const initialForm: ContactFormValues = {
  name: "",
  email: "",
  topic: "",
  message: "",
};

function isContactTopic(value: string): value is (typeof topics)[number] {
  return topics.some((topic) => topic === value);
}

function isMessageResponse(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function ContactForm() {
  const [form, setForm] = useState<ContactFormValues>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Could not send your message."),
        );
      }
      if (!isMessageResponse(payload)) {
        throw new Error("The contact service returned an invalid response.");
      }

      setSuccess(payload.message);
      setForm(initialForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not send your message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateForm<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void submitMessage(event)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#122035] dark:text-white">
            Your name
          </span>
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#122035] outline-none transition placeholder:text-slate-400 focus:border-[#087e78] focus:bg-white focus:ring-4 focus:ring-[#75d6c3]/15 dark:border-[#304663] dark:bg-[#0b1424] dark:text-white dark:focus:border-[#75d6c3] dark:focus:bg-[#101d31]"
            maxLength={80}
            minLength={2}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="Alex Morgan"
            required
            value={form.name}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#122035] dark:text-white">
            Email address
          </span>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#122035] outline-none transition placeholder:text-slate-400 focus:border-[#087e78] focus:bg-white focus:ring-4 focus:ring-[#75d6c3]/15 dark:border-[#304663] dark:bg-[#0b1424] dark:text-white dark:focus:border-[#75d6c3] dark:focus:bg-[#101d31]"
            maxLength={254}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={form.email}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[#122035] dark:text-white">
          What can we help with?
        </span>
        <select
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#122035] outline-none transition focus:border-[#087e78] focus:bg-white focus:ring-4 focus:ring-[#75d6c3]/15 dark:border-[#304663] dark:bg-[#0b1424] dark:text-white dark:focus:border-[#75d6c3] dark:focus:bg-[#101d31]"
          onChange={(event) => {
            const value = event.target.value;
            if (value === "" || isContactTopic(value)) {
              updateForm("topic", value);
            }
          }}
          required
          value={form.topic}
        >
          <option disabled value="">
            Choose a topic
          </option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[#122035] dark:text-white">
          Your message
        </span>
        <textarea
          className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#122035] outline-none transition placeholder:text-slate-400 focus:border-[#087e78] focus:bg-white focus:ring-4 focus:ring-[#75d6c3]/15 dark:border-[#304663] dark:bg-[#0b1424] dark:text-white dark:focus:border-[#75d6c3] dark:focus:bg-[#101d31]"
          maxLength={2000}
          minLength={10}
          onChange={(event) => updateForm("message", event.target.value)}
          placeholder="Tell us a little about what you need help with."
          required
          value={form.message}
        />
        <span className="mt-1 block text-right text-xs text-slate-400">
          {form.message.length}/2000
        </span>
      </label>

      {error && (
        <p
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-[#382126] dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-[#19312d] dark:text-emerald-100"
          role="status"
        >
          {success}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
          Please don’t include passwords or payment-card details in your
          message.
        </p>
        <button
          className="gearrent-primary-action group w-full sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              Sending
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            </>
          ) : (
            <>
              Send message
              <Send
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {isSubmitting ? "Sending your message." : ""}
      </p>
    </form>
  );
}
