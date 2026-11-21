export type RentalType = "daily" | "weekly" | "monthly";

export type FeaturedEquipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  dailyRate: number;
  rentalPrice?: number;
  rentalType?: RentalType;
  image: string;
  description: string;
};

const rentalPeriodDays: Record<RentalType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export function getRentalUnitRateMinor(
  equipment: Pick<
    FeaturedEquipment,
    "dailyRate" | "rentalPrice" | "rentalType"
  >,
  rentalType: RentalType,
) {
  if (
    equipment.rentalType === rentalType &&
    typeof equipment.rentalPrice === "number" &&
    equipment.rentalPrice > 0
  ) {
    return Math.round(equipment.rentalPrice * 100);
  }

  return Math.round(equipment.dailyRate * 100) * rentalPeriodDays[rentalType];
}

export function isFeaturedEquipment(value: unknown): value is FeaturedEquipment {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.location === "string" &&
    typeof item.dailyRate === "number" &&
    (!("rentalPrice" in item) ||
      (typeof item.rentalPrice === "number" && item.rentalPrice > 0)) &&
    (!("rentalType" in item) ||
      item.rentalType === "daily" ||
      item.rentalType === "weekly" ||
      item.rentalType === "monthly") &&
    typeof item.image === "string" &&
    typeof item.description === "string"
  );
}
