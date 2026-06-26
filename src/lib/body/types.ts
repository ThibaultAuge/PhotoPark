import type { LensBrand, LensMount } from "@/lib/lens/types";

export type BodyType = "mirrorless" | "dslr";
export type BodySensorFormat = "FULL_FRAME" | "APS_C" | "MICRO_FOUR_THIRDS" | "MEDIUM_FORMAT" | "OTHER";

export type Body = {
  id: string;
  brandId: string;
  brand: string;
  mountId: string | null;
  mount: string | null;
  name: string;
  label: string;
  bodyType: BodyType;
  isInterchangeableLens: boolean;
  sensorFormat: BodySensorFormat;
  megapixels: number | null;
  isoMin: number | null;
  isoMax: number | null;
  priceEur: number | null;
  weightG: number | null;
  burstFps: number | null;
  videoSpecs: string | null;
  batteryLifeShots: number | null;
  hasIbis: boolean;
  hasDualCardSlot: boolean;
  isWeatherSealed: boolean;
  hasArticulatedScreen: boolean;
  notes: string | null;
  isFavorite: boolean;
  isNextPurchase: boolean;
  isOwned: boolean;
  retired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BodyInput = Omit<Body, "id" | "brand" | "mount" | "label" | "createdAt" | "updatedAt">;

export type BodyReferenceData = {
  brands: LensBrand[];
  mounts: LensMount[];
};

export type BodyFilters = {
  query: string;
  brand: string;
  mount: string;
  sensorFormat: "" | BodySensorFormat;
  bodyType: "" | BodyType;
  status: "" | "favorite" | "next" | "owned" | "retired";
};
