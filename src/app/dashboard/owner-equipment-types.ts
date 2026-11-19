import type { RentalType } from "@/data/featured-equipment";

export type EquipmentCondition = "New" | "Excellent" | "Good" | "Fair";

export type OwnerEquipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  dailyRate: number;
  rentalPrice: number;
  rentalType: RentalType;
  quantity: number;
  image: string;
  description: string;
  condition: string;
  brand: string;
  model: string;
  rentalTerms: string;
  approvalStatus: "pending" | "approved" | "rejected";
  ownerName: string;
};

export const equipmentCategories = [
  "Building",
  "Construction",
  "Landscaping",
  "Agriculture",
  "Events",
  "Outdoor",
  "Photography",
  "Power",
  "Power tools",
  "Material handling",
  "Other",
];

export const equipmentConditions: EquipmentCondition[] = [
  "New",
  "Excellent",
  "Good",
  "Fair",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOwnerEquipment(value: unknown): OwnerEquipment | null {
  if (!isRecord(value)) {
    return null;
  }
  const approvalStatus = value.approvalStatus;
  if (
    approvalStatus !== "pending" &&
    approvalStatus !== "approved" &&
    approvalStatus !== "rejected"
  ) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.category !== "string" ||
    typeof value.location !== "string" ||
    typeof value.dailyRate !== "number" ||
    !Number.isFinite(value.dailyRate) ||
    value.dailyRate <= 0 ||
    typeof value.quantity !== "number" ||
    typeof value.image !== "string" ||
    typeof value.description !== "string"
  ) {
    return null;
  }

  const rentalType = value.rentalType ?? "daily";
  if (
    rentalType !== "daily" &&
    rentalType !== "weekly" &&
    rentalType !== "monthly"
  ) {
    return null;
  }
  const rentalPrice =
    typeof value.rentalPrice === "number" ? value.rentalPrice : value.dailyRate;

  if (
    !Number.isInteger(value.quantity) ||
    value.quantity < 1 ||
    rentalPrice <= 0 ||
    !Number.isFinite(rentalPrice)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    category: value.category,
    location: value.location,
    dailyRate: value.dailyRate,
    rentalPrice,
    rentalType,
    quantity: value.quantity,
    image: value.image,
    description: value.description,
    condition: typeof value.condition === "string" ? value.condition : "",
    brand: typeof value.brand === "string" ? value.brand : "",
    model: typeof value.model === "string" ? value.model : "",
    rentalTerms:
      typeof value.rentalTerms === "string" ? value.rentalTerms : "",
    approvalStatus,
    ownerName: typeof value.ownerName === "string" ? value.ownerName : "",
  };
}
