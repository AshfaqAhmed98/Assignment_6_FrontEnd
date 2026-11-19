"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";
import {
  equipmentCategories,
  equipmentConditions,
  parseOwnerEquipment,
} from "../owner-equipment-types";
import type { RentalType } from "@/data/featured-equipment";

type EquipmentFormValues = {
  name: string;
  description: string;
  category: string;
  location: string;
  rentalPrice: string;
  rentalType: RentalType;
  quantity: string;
  condition: string;
  brand: string;
  model: string;
  image: string;
  rentalTerms: string;
};

const initialValues: EquipmentFormValues = {
  name: "",
  description: "",
  category: "",
  location: "",
  rentalPrice: "",
  rentalType: "daily",
  quantity: "1",
  condition: "Good",
  brand: "",
  model: "",
  image: "",
  rentalTerms: "",
};

const fieldClassName =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-[#08162d] outline-none transition placeholder:text-slate-400 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10 disabled:bg-slate-50";

function getPayloadItem(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("item" in payload)
  ) {
    return null;
  }
  return parseOwnerEquipment(payload.item);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not save this equipment.";
}

function isRentalType(value: string): value is RentalType {
  return value === "daily" || value === "weekly" || value === "monthly";
}

export default function OwnerEquipmentForm({
  equipmentId,
}: {
  equipmentId?: string;
}) {
  const { accessToken, user } = useDashboard();
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isLoading, setIsLoading] = useState(Boolean(equipmentId));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const id = equipmentId;
    if (!id) {
      return;
    }

    const controller = new AbortController();
    async function loadEquipment(id: string) {
      setIsLoading(true);
      setLoadError(null);
      try {
        const payload = await dashboardRequest(
          `/api/equipment/mine/${encodeURIComponent(id)}`,
          accessToken,
          { signal: controller.signal },
        );
        const item = getPayloadItem(payload);
        if (!item) {
          throw new Error("The equipment service returned invalid item data.");
        }

        setValues({
          name: item.name,
          description: item.description,
          category: item.category,
          location: item.location,
          rentalPrice: String(item.rentalPrice),
          rentalType: item.rentalType,
          quantity: String(item.quantity),
          condition: item.condition,
          brand: item.brand,
          model: item.model,
          image: item.image,
          rentalTerms: item.rentalTerms,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadEquipment(id);
    return () => controller.abort();
  }, [accessToken, equipmentId]);

  function updateField<Key extends keyof EquipmentFormValues>(
    key: Key,
    value: EquipmentFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Choose an image that is 5 MB or smaller.");
      return;
    }
    if (file.type && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setUploadError("Upload a PNG, JPG, WEBP, or GIF image.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const payload = await dashboardRequest(
        "/api/uploads/equipment-photo",
        accessToken,
        { method: "POST", body },
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("The image service returned an invalid URL.");
      }

      const imageUrl = new URL(payload.url);
      if (imageUrl.protocol !== "https:") {
        throw new Error("The image service returned an insecure URL.");
      }
      updateField("image", imageUrl.toString());
    } catch (error) {
      setUploadError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        rentalPrice: Number(values.rentalPrice),
        quantity: Number(values.quantity),
      };
      const result = await dashboardRequest(
        equipmentId
          ? `/api/equipment/${encodeURIComponent(equipmentId)}`
          : "/api/equipment",
        accessToken,
        {
          method: equipmentId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      if (!getPayloadItem(result)) {
        throw new Error("The equipment service returned invalid item data.");
      }
      router.push("/dashboard/equipment");
      router.refresh();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div
        aria-live="polite"
        className="flex min-h-72 items-center justify-center gap-3 text-sm font-semibold text-slate-500"
        role="status"
      >
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#e96a32]" />
        Loading equipment details…
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800"
        role="alert"
      >
        <p>Could not load this equipment: {loadError}</p>
        <Link
          className="mt-4 inline-flex font-extrabold underline underline-offset-4"
          href="/dashboard/equipment"
        >
          Return to My Equipment
        </Link>
      </div>
    );
  }

  const categories =
    values.category && !equipmentCategories.includes(values.category)
      ? [values.category, ...equipmentCategories]
      : equipmentCategories;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 transition hover:text-[#c94f1c]"
            href="/dashboard/equipment"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            My Equipment
          </Link>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
            Owner workspace
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08162d]">
            {equipmentId ? "Update equipment" : "Add equipment"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add clear details so renters know what your equipment offers and
            how it should be handled.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {equipmentId ? "Changes require review" : "Status: Pending"}
        </span>
      </div>

      {equipmentId && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
          Saving changes sends this listing back to Pending approval until an
          administrator reviews it.
        </p>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-black text-[#08162d]">
                Equipment details
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Equipment name
                  <input
                    autoComplete="off"
                    className={fieldClassName}
                    maxLength={120}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                    value={values.name}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Category
                  <select
                    className={fieldClassName}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                    value={values.category}
                  >
                    <option disabled value="">
                      Choose a category
                    </option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Location
                  <input
                    autoComplete="address-level2"
                    className={fieldClassName}
                    maxLength={120}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    required
                    value={values.location}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Brand
                  <input
                    autoComplete="off"
                    className={fieldClassName}
                    maxLength={80}
                    onChange={(event) => updateField("brand", event.target.value)}
                    placeholder="Optional"
                    value={values.brand}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Model
                  <input
                    autoComplete="off"
                    className={fieldClassName}
                    maxLength={80}
                    onChange={(event) => updateField("model", event.target.value)}
                    placeholder="Optional"
                    value={values.model}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Description
                  <textarea
                    className={`${fieldClassName} min-h-32 resize-y`}
                    maxLength={2000}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    required
                    value={values.description}
                  />
                  <span className="mt-1 block text-right text-[11px] font-medium text-slate-400">
                    {values.description.length}/2000
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-black text-[#08162d]">
                Rental setup
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">
                  Rental price (BDT)
                  <input
                    className={fieldClassName}
                    max="100000000"
                    min="0.01"
                    onChange={(event) =>
                      updateField("rentalPrice", event.target.value)
                    }
                    required
                    step="0.01"
                    type="number"
                    value={values.rentalPrice}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Rental type
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      if (isRentalType(event.target.value)) {
                        updateField("rentalType", event.target.value);
                      }
                    }}
                    value={values.rentalType}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Available quantity
                  <input
                    className={fieldClassName}
                    max="10000"
                    min="1"
                    onChange={(event) =>
                      updateField("quantity", event.target.value)
                    }
                    required
                    step="1"
                    type="number"
                    value={values.quantity}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  Equipment condition
                  <select
                    className={fieldClassName}
                    onChange={(event) =>
                      updateField("condition", event.target.value)
                    }
                    required
                    value={values.condition}
                  >
                    <option disabled value="">
                      Choose condition
                    </option>
                    {equipmentConditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-3 text-xs leading-5 text-slate-500">
                Your price applies to the selected rental type. Daily,
                weekly, and monthly choices remain available to renters; other
                rates are derived proportionally, and partial periods round up.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-black text-[#08162d]">
                Rental terms and conditions
              </h3>
              <textarea
                className={`${fieldClassName} min-h-28 resize-y`}
                maxLength={3000}
                onChange={(event) =>
                  updateField("rentalTerms", event.target.value)
                }
                placeholder="Describe pickup, use, care, and return expectations."
                required
                value={values.rentalTerms}
              />
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-black text-[#08162d]">
                Equipment image
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Upload a clear PNG, JPG, WEBP, or GIF image. It will be hosted
                securely through ImgBB.
              </p>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {values.image ? (
                  <Image
                    alt={`${values.name || "Equipment"} preview`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    src={values.image}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                    <ImagePlus aria-hidden="true" className="size-9" />
                    <span className="text-xs font-bold">Image preview</span>
                  </div>
                )}
              </div>
              <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e96a32]/25 bg-[#fff4ec] px-4 text-sm font-extrabold text-[#b94a20] transition hover:bg-[#ffebdf] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e96a32]">
                {isUploading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Upload aria-hidden="true" className="size-4" />
                )}
                {isUploading
                  ? "Uploading image…"
                  : values.image
                    ? "Replace image"
                    : "Choose image"}
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={isUploading || isSaving}
                  onChange={(event) => void handleImageUpload(event)}
                  type="file"
                />
              </label>
              {uploadError && (
                <p
                  aria-live="polite"
                  className="mt-3 text-xs font-semibold text-red-700"
                  role="alert"
                >
                  {uploadError}
                </p>
              )}
              {!values.image && (
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  Upload an image before submitting your listing.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-black text-[#08162d]">
                Owner information
              </h3>
              <div className="mt-4 rounded-xl bg-[#f7f9fc] p-4">
                <p className="text-sm font-extrabold text-[#08162d]">
                  {user.name}
                </p>
                <p className="mt-1 break-all text-xs font-medium text-slate-500">
                  {user.email}
                </p>
                <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                  <Check aria-hidden="true" className="size-3.5" />
                  Linked to your verified owner account
                </p>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                New listings are submitted as Pending. An administrator must
                approve them before renters can book.
              </p>
            </section>
          </div>
        </div>

        {formError && (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            role="alert"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
            href="/dashboard/equipment"
          >
            Cancel
          </Link>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#08162d] px-6 text-sm font-extrabold text-white transition hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving || isUploading || !values.image}
            type="submit"
          >
            {isSaving && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            )}
            {isSaving
              ? "Saving…"
              : equipmentId
                ? "Save changes"
                : "Submit for approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
