"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  Check,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Save,
  UserRound,
} from "lucide-react";
import { useDashboard } from "../dashboard-context";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import {
  apiBaseUrl,
  getResponseMessage,
  readResponseBody,
} from "@/lib/dashboard-api";

type ProfileNotice = {
  type: "success" | "error";
  message: string;
};

export default function ProfilePage() {
  const { user, refreshUser } = useDashboard();
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [address, setAddress] = useState(user.address);
  const [image, setImage] = useState(user.image ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<ProfileNotice | null>(null);
  const completedProfileFields = [
    Boolean(name.trim()),
    Boolean(user.email),
    Boolean(image.trim()),
    Boolean(phoneNumber.trim()),
    Boolean(address.trim()),
  ].filter(Boolean).length;
  const profileCompletion = Math.round((completedProfileFields / 5) * 100);

  async function handlePhotoChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({
        type: "error",
        message: "Profile images must be 5 MB or smaller.",
      });
      return;
    }
    if (
      !["image/gif", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      setNotice({
        type: "error",
        message: "Choose a PNG, JPG, WEBP, or GIF image.",
      });
      return;
    }

    setNotice(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`${apiBaseUrl}/api/uploads/profile-photo`, {
        method: "POST",
        body: formData,
      });
      const payload = await readResponseBody(response);
      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Could not upload your profile image."),
        );
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("The image service returned an invalid profile URL.");
      }
      setImage(payload.url);
      setNotice({
        type: "success",
        message: "Image uploaded. Save your profile to apply it.",
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
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName || trimmedName.length > 80) {
      setNotice({
        type: "error",
        message: "Enter a name between 1 and 80 characters.",
      });
      return;
    }
    if (
      trimmedPhone &&
      !/^[+0-9()\-\s]{7,30}$/.test(trimmedPhone)
    ) {
      setNotice({
        type: "error",
        message: "Enter a valid phone number.",
      });
      return;
    }
    if (trimmedAddress.length > 500) {
      setNotice({
        type: "error",
        message: "Address must be 500 characters or fewer.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/update-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          image: image.trim() || null,
          phoneNumber: trimmedPhone,
          address: trimmedAddress,
        }),
      });
      const payload = await readResponseBody(response);
      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Could not update your profile."),
        );
      }

      await refreshUser();
      setNotice({
        type: "success",
        message: "Your profile has been updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not update your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c94f1c]">
          Account details
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#08162d] sm:text-3xl">
          Profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep your contact information and profile image up to date.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_250px]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label
              className="block text-sm font-bold text-slate-700"
              htmlFor="dashboard-profile-name"
            >
              Name
              <input
                autoComplete="name"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
                id="dashboard-profile-name"
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label
              className="block text-sm font-bold text-slate-700"
              htmlFor="dashboard-profile-email"
            >
              Email
              <span className="relative mt-2 block">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 pr-11 font-medium text-slate-500 outline-none"
                  id="dashboard-profile-email"
                  readOnly
                  value={user.email}
                />
              </span>
              <span className="mt-1.5 block text-xs font-medium text-slate-500">
                Email changes require a separate verification flow.
              </span>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label
              className="block text-sm font-bold text-slate-700"
              htmlFor="dashboard-profile-phone"
            >
              Phone Number
              <input
                autoComplete="tel"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
                id="dashboard-profile-phone"
                maxLength={30}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                type="tel"
                value={phoneNumber}
              />
            </label>
            <div className="block text-sm font-bold text-slate-700">
              Account Role
              <div className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 text-slate-600">
                <UserRound aria-hidden="true" className="size-4 text-[#c94f1c]" />
                {user.role}
                <span className="ml-auto text-xs font-semibold text-slate-400">
                  Managed by GearRent
                </span>
              </div>
            </div>
          </div>

          <label
            className="block text-sm font-bold text-slate-700"
            htmlFor="dashboard-profile-address"
          >
            Address
            <textarea
              autoComplete="street-address"
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
              id="dashboard-profile-address"
              maxLength={500}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Your delivery or business address"
              value={address}
            />
            <span className="mt-1.5 block text-right text-xs font-medium text-slate-400">
              {address.length}/500
            </span>
          </label>

          {notice && (
            <p
              className={`rounded-xl border p-3 text-sm font-semibold ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              {notice.message}
            </p>
          )}

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(115deg,#ffd277_0%,#ffb45c_52%,#e96a32_100%)] px-6 text-sm font-extrabold text-[#08162d] shadow-[0_8px_20px_rgba(233,106,50,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(233,106,50,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94f1c] disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving || isUploading}
            type="submit"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {isSaving ? "Saving profile…" : "Save Changes"}
          </button>
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Profile completeness
              </p>
              <span className="text-sm font-black text-[#c94f1c]">
                {profileCompletion}%
              </span>
            </div>
            <div
              aria-label="Profile completeness"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={profileCompletion}
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#75d6c3,#ffd277,#e96a32)] transition-[width] duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {completedProfileFields} of 5 account details added
            </p>
          </div>
          <p className="text-sm font-extrabold text-[#08162d]">Profile Image</p>
          <ImageDropzone
            className="mt-4 p-1"
            disabled={isUploading || isSaving}
            onFileDrop={(file) => void handlePhotoChange(file)}
          >
            <div className="mx-auto flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#08162d] text-[#ffd277] shadow-[0_8px_24px_rgba(8,22,45,0.15)]">
              {image ? (
                <Image
                  alt="Profile preview"
                  className="size-full object-cover"
                  height={112}
                  src={image}
                  unoptimized
                  width={112}
                />
              ) : (
                <UserRound aria-hidden="true" className="size-10" />
              )}
            </div>
            <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e96a32]/30 bg-white px-3 text-center text-xs font-extrabold text-[#c94f1c] transition hover:bg-[#fff8e7] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e96a32]">
              {isUploading ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <ImagePlus aria-hidden="true" className="size-4" />
              )}
              {isUploading ? "Uploading…" : "Upload a new image"}
              <input
                accept="image/gif,image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isUploading || isSaving}
                onChange={(event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  input.value = "";
                  void handlePhotoChange(file);
                }}
                type="file"
              />
            </label>
            <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
              Or drag and drop an image here.
            </p>
          </ImageDropzone>
          <label
            className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500"
            htmlFor="dashboard-profile-image"
          >
            Or paste an image URL
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#08162d] outline-none transition focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
              id="dashboard-profile-image"
              onChange={(event) => setImage(event.target.value)}
              placeholder="https://…"
              type="url"
              value={image}
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Use a direct image link or upload a PNG, JPG, WEBP, or GIF.
          </p>
          {image && (
            <button
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-[#c94f1c]"
              onClick={() => setImage("")}
              type="button"
            >
              <Check aria-hidden="true" className="size-3.5" />
              Remove image
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
