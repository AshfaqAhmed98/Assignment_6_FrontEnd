export type FeaturedEquipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  dailyRate: number;
  image: string;
  description: string;
};

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
    typeof item.image === "string" &&
    typeof item.description === "string"
  );
}

export const featuredEquipment: FeaturedEquipment[] = [
  {
    id: "professional-drill-kit",
    name: "Professional Drill Kit",
    category: "Power tools",
    location: "Dhaka",
    dailyRate: 850,
    image: "/images/tools-rental-banner.jpg",
    description:
      "A versatile drill and accessory kit for drilling, fastening, and everyday building work.",
  },
  {
    id: "compact-excavator",
    name: "Compact Excavator",
    category: "Construction",
    location: "Chattogram",
    dailyRate: 6800,
    image: "/images/construction-team-banner.jpg",
    description:
      "A compact excavator for trenching, digging, landscaping, and small construction jobs.",
  },
  {
    id: "concrete-mixer",
    name: "Concrete Mixer",
    category: "Building",
    location: "Gazipur",
    dailyRate: 1400,
    image: "/images/equipment-rental-banner.jpg",
    description:
      "A portable concrete mixer suited to foundations, slabs, repairs, and renovation projects.",
  },
  {
    id: "electric-generator",
    name: "Electric Generator",
    category: "Power",
    location: "Dhaka",
    dailyRate: 2200,
    image: "/images/equipment-rental-banner.jpg",
    description:
      "A reliable portable generator for job sites, events, and temporary power requirements.",
  },
  {
    id: "pressure-washer",
    name: "Pressure Washer",
    category: "Outdoor",
    location: "Narayanganj",
    dailyRate: 950,
    image: "/images/tools-rental-banner.jpg",
    description:
      "A high-pressure washer for vehicles, patios, building exteriors, and equipment cleaning.",
  },
  {
    id: "rotary-cutter",
    name: "Rotary Cutter",
    category: "Landscaping",
    location: "Savar",
    dailyRate: 1300,
    image: "/images/construction-team-banner.jpg",
    description:
      "A heavy-duty rotary cutter for clearing overgrowth and maintaining large outdoor areas.",
  },
];
