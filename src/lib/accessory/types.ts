import type { LensBrand } from "@/lib/lens/types";

export type AccessoryType = {
  id: string;
  name: string;
};

export type Accessory = {
  id: string;
  brandId: string;
  brand: string;
  typeId: string;
  type: string;
  name: string;
  label: string;
  capacityLiters: number | null;
  capacityBodies: number | null;
  capacityLenses: number | null;
  fitsLaptop: boolean;
  fitsTripod: boolean;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  weightG: number | null;
  priceEur: number | null;
  carryStyleNotes: string | null;
  capacityNotes: string | null;
  isFavorite: boolean;
  isNextPurchase: boolean;
  isOwned: boolean;
  retired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccessoryInput = Omit<Accessory, "id" | "brand" | "type" | "label" | "createdAt" | "updatedAt">;

export type AccessoryReferenceData = {
  brands: LensBrand[];
  types: AccessoryType[];
};

export type AccessoryFilters = {
  query: string;
  brand: string;
  type: string;
  status: "" | "favorite" | "next" | "owned" | "retired";
  laptop: "" | "yes" | "no";
  tripod: "" | "yes" | "no";
};
