import type { LensBrand } from "@/lib/lens/types";

export type AccessoryTypeCategory = "bag" | "filter" | "other";
export type AccessoryOtherProfile =
  | "generic"
  | "battery"
  | "memory_card"
  | "card_reader"
  | "external_storage"
  | "remote_trigger"
  | "cleaning"
  | "color_tool"
  | "lighting"
  | "drone_part"
  | "cable_adapter"
  | "power";
export type AccessoryStorageLocation = "bag" | "reserve";
export type AccessoryMountType = "none" | "threaded" | "magnetic";
export type AccessoryFilterRole = "general" | "filter" | "adapter" | "hood";

export type AccessoryType = {
  id: string;
  name: string;
  category: AccessoryTypeCategory;
  profile: AccessoryOtherProfile | null;
};

export type AccessoryLensReference = {
  id: string;
  label: string;
  filterDiameterMm: number | null;
  isOwned: boolean;
  isFavorite: boolean;
  isNextPurchase: boolean;
  retired: boolean;
};

export type Accessory = {
  id: string;
  brandId: string;
  brand: string;
  typeId: string;
  type: string;
  typeCategory: AccessoryTypeCategory;
  typeProfile: AccessoryOtherProfile | null;
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
  specCapacity: string | null;
  specFormat: string | null;
  specConnection: string | null;
  specCompatibility: string | null;
  specPower: string | null;
  specColorModes: string | null;
  specVariant: string | null;
  storageLocation: AccessoryStorageLocation;
  mountedOnLensId: string | null;
  mountedOnAccessoryId: string | null;
  rearMountType: AccessoryMountType;
  rearDiameterMm: number | null;
  frontMountType: AccessoryMountType;
  frontDiameterMm: number | null;
  filterRole: AccessoryFilterRole;
  filterStrength: string | null;
  supportsMagneticHood: boolean;
  isFavorite: boolean;
  isNextPurchase: boolean;
  isOwned: boolean;
  retired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccessoryInput = Omit<Accessory, "id" | "brand" | "type" | "typeCategory" | "typeProfile" | "label" | "createdAt" | "updatedAt" | "specCapacity" | "specFormat" | "specConnection" | "specCompatibility" | "specPower" | "specColorModes" | "specVariant"> & Partial<Pick<Accessory, "specCapacity" | "specFormat" | "specConnection" | "specCompatibility" | "specPower" | "specColorModes" | "specVariant">>;

export type AccessoryReferenceData = {
  brands: LensBrand[];
  types: AccessoryType[];
  lenses: AccessoryLensReference[];
};

export type AccessoryFilters = {
  query: string;
  brand: string;
  type: string;
  status: "" | "favorite" | "next" | "owned" | "retired";
  laptop: "" | "yes" | "no";
  tripod: "" | "yes" | "no";
  location: "" | "mounted" | AccessoryStorageLocation;
  mountType: "" | Exclude<AccessoryMountType, "none">;
};
