import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Accessory, AccessoryReferenceData } from "../../../src/lib/accessory/types";

const bagAccessory: Accessory = {
  id: "bag-1",
  brandId: "brand-1",
  brand: "Peak Design",
  typeId: "type-bag",
  type: "Sac à dos",
  typeCategory: "bag",
  name: "Everyday Backpack",
  label: "Peak Design Everyday Backpack",
  capacityLiters: 20,
  capacityBodies: 2,
  capacityLenses: 4,
  fitsLaptop: true,
  fitsTripod: true,
  widthMm: 300,
  heightMm: 450,
  depthMm: 180,
  weightG: 1660,
  priceEur: 299,
  carryStyleNotes: "Confortable",
  capacityNotes: "2 boîtiers + 4 objectifs",
  storageLocation: "bag",
  mountedOnLensId: null,
  mountedOnAccessoryId: null,
  rearMountType: "none",
  rearDiameterMm: null,
  frontMountType: "none",
  frontDiameterMm: null,
  filterRole: "general",
  filterStrength: null,
  supportsMagneticHood: false,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mountedFilterAccessory: Accessory = {
  ...bagAccessory,
  id: "filter-1",
  brand: "Kase",
  typeId: "type-filter",
  type: "Filtre magnétique",
  typeCategory: "filter",
  name: "CPL",
  label: "Kase CPL",
  capacityLiters: null,
  capacityBodies: null,
  capacityLenses: null,
  fitsLaptop: false,
  fitsTripod: false,
  carryStyleNotes: null,
  capacityNotes: "Circulaire",
  storageLocation: "reserve",
  mountedOnLensId: "lens-1",
  mountedOnAccessoryId: null,
  rearMountType: "threaded",
  rearDiameterMm: 52,
  frontMountType: "magnetic",
  frontDiameterMm: 77,
  filterRole: "filter",
  filterStrength: "CPL",
  supportsMagneticHood: true,
};

const childFilterAccessory: Accessory = {
  ...mountedFilterAccessory,
  id: "filter-2",
  name: "Bague 77 mm",
  label: "Kase Bague 77 mm",
  mountedOnLensId: null,
  mountedOnAccessoryId: "filter-1",
  filterRole: "adapter",
};

const referenceData: AccessoryReferenceData = {
  brands: [],
  types: [],
  lenses: [
    {
      id: "lens-1",
      label: "Canon RF 35mm F1.8",
      filterDiameterMm: 52,
      isOwned: true,
      isFavorite: false,
      isNextPurchase: false,
      retired: false,
    },
  ],
};

const mockContext = vi.hoisted(() => ({
  filters: {
    query: "",
    brand: "",
    type: "",
    status: "",
    laptop: "",
    tripod: "",
    location: "",
    mountType: "",
    compatibleLensId: "",
    onlyCompatible: false,
  },
  setFilters: vi.fn(),
  resetFilters: vi.fn(),
  detailAccessory: null as Accessory | null,
  setDetailAccessory: vi.fn(),
  editingAccessory: null as Accessory | null,
  setEditingAccessory: vi.fn(),
  showCreate: false,
  setShowCreate: vi.fn(),
  initialAccessories: [] as Accessory[],
  filteredAccessories: [] as Accessory[],
  referenceData: { brands: [], types: [], lenses: [] } as AccessoryReferenceData,
}));

vi.mock("@/components/accessory/AccessoryProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/accessory/AccessoryProvider")>("@/components/accessory/AccessoryProvider");
  return {
    ...actual,
    useAccessoryContext: () => mockContext,
  };
});

vi.mock("@/components/accessory/AccessoryFiltersBar", () => ({
  AccessoryFiltersBar: vi.fn(() => null),
}));

vi.mock("@/components/accessory/AccessoryTable", () => ({
  AccessoryTable: vi.fn(() => null),
}));

vi.mock("@/components/accessory/AccessoryCard", () => ({
  AccessoryCard: vi.fn(() => null),
}));

vi.mock("@/components/accessory/AccessoryDetailModal", () => ({
  AccessoryDetailModal: vi.fn(() => null),
}));

vi.mock("@/components/accessory/AccessoryForm", () => ({
  AccessoryForm: vi.fn(() => null),
}));

vi.mock("@/components/accessory/FilterAssemblyAssistant", () => ({
  FilterAssemblyAssistant: vi.fn(() => null),
}));

import { AccessoryCard } from "@/components/accessory/AccessoryCard";
import { AccessoryTable } from "@/components/accessory/AccessoryTable";
import { FilterAssemblyAssistant } from "@/components/accessory/FilterAssemblyAssistant";
import { AccessoryListPage } from "../../../src/components/accessory/AccessoryListPage";

describe("AccessoryListPage", () => {
  beforeEach(() => {
    mockContext.filters = {
      query: "",
      brand: "",
      type: "",
      status: "",
      laptop: "",
      tripod: "",
      location: "",
      mountType: "",
      compatibleLensId: "",
      onlyCompatible: false,
    };
    mockContext.initialAccessories = [bagAccessory, mountedFilterAccessory, childFilterAccessory];
    mockContext.filteredAccessories = [mountedFilterAccessory, childFilterAccessory];
    mockContext.referenceData = referenceData;
    vi.clearAllMocks();
  });

  /**
   * Verifies that filter pages pass lens labels and mount index to list views
   */
  test("passes the scoped accessory mount index to table and card filter views", () => {
    renderToStaticMarkup(createElement(AccessoryListPage, { typeCategory: "filter" }));

    const tableProps = vi.mocked(AccessoryTable).mock.calls[0]?.[0];
    const firstCardProps = vi.mocked(AccessoryCard).mock.calls[0]?.[0];
    const secondCardProps = vi.mocked(AccessoryCard).mock.calls[1]?.[0];

    expect(tableProps.accessories).toEqual([mountedFilterAccessory, childFilterAccessory]);
    expect(tableProps.showFilterColumns).toBe(true);
    expect(tableProps.lensLabels.get("lens-1")).toBe("Canon RF 35mm F1.8");
    expect(tableProps.accessoryMountIndex.get("filter-1")).toEqual({ mountedOnLensId: "lens-1", mountedOnAccessoryId: null });
    expect(tableProps.accessoryMountIndex.get("filter-2")).toEqual({ mountedOnLensId: null, mountedOnAccessoryId: "filter-1" });
    expect(tableProps.accessoryMountIndex.has("bag-1")).toBe(false);
    expect(firstCardProps.accessoryMountIndex).toBe(tableProps.accessoryMountIndex);
    expect(secondCardProps.accessoryMountIndex).toBe(tableProps.accessoryMountIndex);
    expect(firstCardProps.lensLabels).toBe(tableProps.lensLabels);
  });

  /**
   * Verifies that filter pages provide only scoped accessories to assembly UI
   */
  test("passes only filter accessories to the assembly assistant", () => {
    renderToStaticMarkup(createElement(AccessoryListPage, { typeCategory: "filter" }));

    const assistantProps = vi.mocked(FilterAssemblyAssistant).mock.calls[0]?.[0];

    expect(assistantProps.accessories).toEqual([mountedFilterAccessory, childFilterAccessory]);
    expect(assistantProps.lenses).toEqual(referenceData.lenses);
  });
});
