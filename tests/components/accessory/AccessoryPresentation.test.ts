import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { AccessoryDetailModal } from "../../../src/components/accessory/AccessoryDetailModal";
import { AccessoryTable } from "../../../src/components/accessory/AccessoryTable";
import type { Accessory, AccessoryLensReference } from "../../../src/lib/accessory/types";

const lenses: AccessoryLensReference[] = [
  { id: "lens-1", label: "Canon RF 35mm F1.8", filterDiameterMm: 52, isOwned: true, isFavorite: false, isNextPurchase: false, retired: false },
];

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

const filterAccessory: Accessory = {
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
  rearMountType: "threaded",
  rearDiameterMm: 52,
  frontMountType: "magnetic",
  frontDiameterMm: 77,
  filterRole: "filter",
  filterStrength: "CPL",
  supportsMagneticHood: true,
};

describe("accessory presentation", () => {
  /**
   * Verifies that filter tables switch to interface-specific column labels
   */
  test("AccessoryTable renders filter-specific headers", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTable, {
      accessories: [filterAccessory],
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Interfaces");
    expect(html).toContain("Localisation");
    expect(html).toContain("Rôle");
    expect(html).not.toContain("Capacité");
    expect(html).not.toContain("Laptop");
  });

  /**
   * Verifies that filter detail modals render assembly metadata and notes
   */
  test("AccessoryDetailModal renders filter-specific detail fields", () => {
    const html = renderToStaticMarkup(createElement(AccessoryDetailModal, {
      accessory: filterAccessory,
      accessories: [filterAccessory],
      lenses,
      onClose: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Interfaces");
    expect(html).toContain("Localisation");
    expect(html).toContain("Montage actuel");
    expect(html).toContain("Support pare-soleil magnétique");
    expect(html).toContain("Notes");
    expect(html).not.toContain("Transport &amp; confort");
  });
});
