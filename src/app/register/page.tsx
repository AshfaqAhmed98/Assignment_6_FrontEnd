"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Cog,
  Eye,
  EyeOff,
  FileImage,
  Home,
  Info,
  Link2,
  LockKeyhole,
  Mail,
  Sparkles,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { requestAuthAccessToken } from "@/lib/auth-token";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { ThemeToggle } from "@/components/theme/theme-provider";

type RegistrationNotice = {
  type: "success" | "error" | "info";
  message: string;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function isValidPassword(password: string) {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password)
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [playBackgroundVideo, setPlayBackgroundVideo] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountRole, setAccountRole] = useState<"Customer" | "Owner">(
    "Customer",
  );
  const [photo, setPhoto] = useState("");
  const [photoMode, setPhotoMode] = useState<"url" | "upload">("url");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<RegistrationNotice | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateVideoPreference = () => {
      setPlayBackgroundVideo(!motionPreference.matches);
    };

    updateVideoPreference();
    motionPreference.addEventListener("change", updateVideoPreference);
    return () =>
      motionPreference.removeEventListener("change", updateVideoPreference);
  }, []);

  function selectPhotoFile(file: File | null) {
    const allowedTypes = [
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (file && !allowedTypes.includes(file.type)) {
      setPhotoFile(null);
      setNotice({
        type: "error",
        message: "Choose a PNG, JPG, WEBP, or GIF image.",
      });
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setPhotoFile(null);
      setNotice({
        type: "error",
        message: "Profile images must be 5 MB or smaller.",
      });
      return;
    }

    setPhotoFile(file);
    setPhoto("");
    setNotice(null);
  }

  async function uploadPhoto() {
    if (!photoFile) {
      setNotice({
        type: "error",
        message: "Choose an image before uploading.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("image", photoFile);
      const response = await fetch(`${apiBaseUrl}/api/uploads/profile-photo`, {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Could not upload this image. Please try again.";
        throw new Error(message);
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("The image service returned an invalid response.");
      }

      setPhoto(payload.url);
      setNotice({
        type: "success",
        message: "Profile photo uploaded successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to the image upload service.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (photoMode === "upload" && !photo) {
      setNotice({
        type: "error",
        message: "Upload your profile photo before registering.",
      });
      return;
    }

    if (!isValidPassword(password)) {
      setNotice({
        type: "error",
        message:
          "Use at least 6 characters, including an uppercase and a lowercase letter.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          image: photo.trim(),
          role: accountRole,
        }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The authentication server returned an invalid response.");
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Could not create your account. Please try again.";
        throw new Error(message);
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("user" in payload) ||
        typeof payload.user !== "object" ||
        payload.user === null
      ) {
        throw new Error("The authentication server returned an invalid account.");
      }

      try {
        await requestAuthAccessToken(apiBaseUrl);
      } catch (error) {
        setNotice({
          type: "error",
          message: `Your account was created, but an access token could not be issued. ${
            error instanceof Error ? error.message : "Please sign in again."
          }`,
        });
        return;
      }

      router.push("/");
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

  const passwordChecks = [
    { label: "6+ characters", valid: password.length >= 6 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
  ];

  return (
    <main className="auth-page auth-page--register min-h-screen bg-[#f7f5f0] text-[#122035]">
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
        <section className="relative isolate flex min-h-82.5 flex-col overflow-hidden bg-[#101c2e] px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
          <Image
            alt=""
            aria-hidden="true"
            className="-z-10 object-cover object-center"
            fill
            loading="eager"
            sizes="(max-width: 1023px) 100vw, 52vw"
            src="/images/equipment-rental-banner.jpg"
          />
          {/* Pexels video 5674342 by Site Engine, under the Pexels License. */}
          {playBackgroundVideo && (
            <video
              aria-hidden="true"
              autoPlay
              className="absolute inset-0 -z-10 size-full object-cover object-center"
              loop
              muted
              playsInline
              poster="/images/equipment-rental-banner.jpg"
              preload="metadata"
              tabIndex={-1}
            >
              <source
                src="/videos/register-background.mp4"
                type="video/mp4"
              />
            </video>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-linear-to-br from-[#0a1729]/95 via-[#0a1729]/75 to-[#0a1729]/45"
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
              MAKE ROOM FOR WHAT&apos;S NEXT
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Big plans deserve
              <span className="mt-1 block text-[#ffd277]">
                the right gear.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200 sm:text-base">
              Find the equipment you need, when you need it. Join a community
              that makes getting the job done feel simpler.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Discover equipment", "Rent with confidence", "Get to work"].map(
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

        <section className="auth-form-panel relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -top-32 size-96 rounded-full bg-[#e96a32]/[0.06] blur-3xl"
          />
          <div className="relative w-full max-w-[470px]">
            <div className="mb-5 flex justify-end">
              <ThemeToggle />
            </div>
            <div className="mb-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#c94f1c]">
                Your next chapter starts here
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#122035] sm:text-4xl">
                Create your account
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                One account. A whole lot of ways to get things done.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="register-name"
                >
                  Your name
                  <span className="relative mt-2 block">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoComplete="name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm font-medium text-[#122035] shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                      id="register-name"
                      maxLength={80}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Alex Morgan"
                      required
                      type="text"
                      value={name}
                    />
                  </span>
                </label>

                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="register-email"
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
                      id="register-email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </span>
                </label>
              </div>

              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="register-role"
              >
                Account type
                <select
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-[#122035] shadow-sm outline-none transition hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                  id="register-role"
                  onChange={(event) =>
                    setAccountRole(
                      event.target.value === "Owner" ? "Owner" : "Customer",
                    )
                  }
                  value={accountRole}
                >
                  <option value="Customer">Customer — rent equipment</option>
                  <option value="Owner">Owner — list equipment</option>
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Admin accounts are assigned by the platform administrator.
                </span>
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">
                  Profile photo
                </legend>
                <div
                  aria-label="Profile photo method"
                  className="mt-2 inline-flex rounded-lg bg-slate-100 p-1"
                  role="group"
                >
                  <button
                    aria-pressed={photoMode === "url"}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] ${
                      photoMode === "url"
                        ? "bg-white text-[#122035] shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    onClick={() => {
                      setPhotoMode("url");
                      setPhoto("");
                      setPhotoFile(null);
                      setNotice(null);
                    }}
                    type="button"
                  >
                    <Link2 aria-hidden="true" className="size-3.5" />
                    Image URL
                  </button>
                  <button
                    aria-pressed={photoMode === "upload"}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] ${
                      photoMode === "upload"
                        ? "bg-white text-[#122035] shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    onClick={() => {
                      setPhotoMode("upload");
                      setPhoto("");
                      setPhotoFile(null);
                      setNotice(null);
                    }}
                    type="button"
                  >
                    <UploadCloud aria-hidden="true" className="size-3.5" />
                    Upload image
                  </button>
                </div>

                {photoMode === "url" ? (
                  <label className="mt-3 block" htmlFor="register-photo">
                    <span className="sr-only">Profile photo URL</span>
                    <span className="relative block">
                      <Link2
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                      />
                      <input
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm font-medium text-[#122035] shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                        id="register-photo"
                        onChange={(event) => setPhoto(event.target.value)}
                        placeholder="https://your-photo-link.jpg"
                        required
                        type="url"
                        value={photo}
                      />
                    </span>
                    <span className="mt-1.5 block text-xs font-normal text-slate-500">
                      Paste a direct link to your profile image.
                    </span>
                  </label>
                ) : (
                  <ImageDropzone
                    className="mt-3 p-1"
                    disabled={isUploadingPhoto || isSubmitting}
                    onFileDrop={selectPhotoFile}
                  >
                    <label
                      className="group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center transition-colors hover:border-[#e96a32] hover:bg-orange-50/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e96a32]"
                      htmlFor="register-photo-upload"
                    >
                      <span className="grid size-10 place-items-center rounded-full bg-[#fff1e9] text-[#c94f1c] transition-transform group-hover:scale-105">
                        <UploadCloud aria-hidden="true" className="size-5" />
                      </span>
                      <span className="mt-2 text-sm font-semibold text-slate-700">
                        {photoFile ? "Choose a different image" : "Choose an image"}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        PNG, JPG, WEBP, or GIF · Max 5 MB
                      </span>
                      <span className="mt-1 text-xs font-medium text-[#c94f1c]">
                        Drop a photo here, or click to choose.
                      </span>
                      <input
                        accept="image/gif,image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={isUploadingPhoto || isSubmitting}
                        id="register-photo-upload"
                        onChange={(event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0] ?? null;
                          input.value = "";
                          selectPhotoFile(file);
                        }}
                        type="file"
                      />
                    </label>
                    {photoFile && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        <FileImage
                          aria-hidden="true"
                          className="size-4 shrink-0 text-[#c94f1c]"
                        />
                        <span className="truncate">{photoFile.name}</span>
                      </div>
                    )}
                    {photoFile && !photo && (
                      <button
                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#e96a32] bg-white px-4 text-sm font-bold text-[#c94f1c] transition-colors hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isUploadingPhoto || isSubmitting}
                        onClick={uploadPhoto}
                        type="button"
                      >
                        <UploadCloud aria-hidden="true" className="size-4" />
                        {isUploadingPhoto
                          ? "Uploading image..."
                          : "Upload image"}
                      </button>
                    )}
                    {photo && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Profile photo uploaded and ready.
                      </p>
                    )}
                  </ImageDropzone>
                )}
              </fieldset>

              <div>
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="register-password"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-medium text-[#122035] shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
                    id="register-password"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
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
                <div
                  aria-label="Password requirements"
                  className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
                >
                  {passwordChecks.map((requirement) => (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        requirement.valid ? "text-emerald-700" : "text-slate-500"
                      }`}
                      key={requirement.label}
                    >
                      <span
                        className={`grid size-4 place-items-center rounded-full ${
                          requirement.valid
                            ? "bg-emerald-100"
                            : "bg-slate-100"
                        }`}
                      >
                        <Check aria-hidden="true" className="size-2.5" />
                      </span>
                      {requirement.label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="gearrent-primary-action group mt-3 w-full"
                disabled={isUploadingPhoto || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                className="font-bold text-[#c94f1c] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                href="/login"
              >
                Log in
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
