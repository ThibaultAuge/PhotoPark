export type SensorType = "FULL_FRAME" | "APS_C";

export type Lens = {
  id: string;
  brandId: string;
  brand: string;
  mountId: string;
  mount: string;
  sensorType: SensorType;
  options: LensOption[];
  focalMinMm: number;
  focalMaxMm: number;
  apscFocalMinEquivalentMm: number;
  apscFocalMaxEquivalentMm: number;
  maxApertureAtMinFocal: number;
  maxApertureAtMaxFocal: number;
  minAperture: number | null;
  label: string;
  filterDiameterMm: number | null;
  priceEur: number | null;
  minFocusDistanceM: number | null;
  angleAtMinFocalDeg: number | null;
  angleAtMaxFocalDeg: number | null;
  apertureBlades: number | null;
  groupsCount: number | null;
  elementsCount: number | null;
  weightG: number | null;
  isFavorite: boolean;
  isNextPurchase: boolean;
  isOwned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LensInput = Omit<
  Lens,
  "id" | "brand" | "mount" | "sensorType" | "options" | "label" | "apscFocalMinEquivalentMm" | "apscFocalMaxEquivalentMm" | "createdAt" | "updatedAt"
> & { optionIds: string[] };

export type LensBrand = { id: string; name: string };
export type LensMount = { id: string; name: string; sensorType: SensorType };
export type LensOption = { id: string; code: string; description: string };

export type LensReferenceData = {
  brands: LensBrand[];
  mounts: LensMount[];
  options: LensOption[];
};

export type LensFilters = {
  query: string;
  mount: string;
  brand: string;
  option: string;
  sensorType: "" | SensorType;
  status: "" | "favorite" | "next" | "owned";
  focalMin: string;
  focalMax: string;
  maxAperture: string;
};
