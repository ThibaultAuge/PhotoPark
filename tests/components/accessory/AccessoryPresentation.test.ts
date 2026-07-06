import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { AccessoryCard } from "../../../src/components/accessory/AccessoryCard";
import { AccessoryDetailModal } from "../../../src/components/accessory/AccessoryDetailModal";
import { AccessoryTable } from "../../../src/components/accessory/AccessoryTable";
import type { Accessory, AccessoryLensReference } from "../../../src/lib/accessory/types";

const lenses: AccessoryLensReference[] = [
  { id: "lens-1", label: "Canon RF 35mm F1.8", filterDiameterMm: 52, isOwned: true, isFavorite: false, isNextPurchase: false, retired: false },
];
const lensLabels = new Map(lenses.map((lens) => [lens.id, lens.label]));

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
  mountedOnLensId: "lens-1",
};

const childFilterAccessory: Accessory = {
  ...filterAccessory,
  id: "filter-2",
  label: "Kase Bague 77 mm",
  name: "Bague 77 mm",
  mountedOnLensId: null,
  mountedOnAccessoryId: "filter-1",
};

const accessoryMountIndex = new Map([
  [filterAccessory.id, { mountedOnLensId: filterAccessory.mountedOnLensId, mountedOnAccessoryId: filterAccessory.mountedOnAccessoryId }],
  [childFilterAccessory.id, { mountedOnLensId: childFilterAccessory.mountedOnLensId, mountedOnAccessoryId: childFilterAccessory.mountedOnAccessoryId }],
]);

describe("accessory presentation", () => {
  /**
   * Verifies that filter tables keep action-menu scroll wrappers and headers
   */
  test("AccessoryTable renders filter-specific headers", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTable, {
      accessories: [filterAccessory],
      lensLabels,
      accessoryMountIndex,
      showFilterColumns: true,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain('class="card table-card table-card-with-actions"');
    expect(html).toContain('<div class="table-scroll"><table>');
    expect(html).toContain("Interfaces");
    expect(html).toContain("Localisation");
    expect(html).toContain("Rôle");
    expect(html).toContain("Canon RF 35mm F1.8");
    expect(html).not.toContain("Capacité");
    expect(html).not.toContain("Laptop");
    expect(html).not.toContain("Poids");
  });

  /**
   * Verifies that empty filter tables keep the filter-specific headers visible
   */
  test("AccessoryTable keeps filter headers when filter result is empty", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTable, {
      accessories: [],
      lensLabels,
      accessoryMountIndex,
      showFilterColumns: true,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Interfaces");
    expect(html).toContain("Localisation");
    expect(html).toContain("Rôle");
    expect(html).not.toContain("Poids");
  });

  /**
   * Verifies that filter cards show the mounted lens label instead of Monté
   */
  test("AccessoryCard hides weight and shows mounted lens label for filter accessories", () => {
    const html = renderToStaticMarkup(createElement(AccessoryCard, {
      accessory: filterAccessory,
      lensLabels,
      accessoryMountIndex,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Canon RF 35mm F1.8");
    expect(html).not.toContain("<dd>Monté</dd>");
    expect(html).not.toContain("Poids");
  });

  /**
   * Verifies that filter cards resolve mounted lens labels through parents
   */
  test("AccessoryCard resolves mounted lens label through parent accessory chain", () => {
    const html = renderToStaticMarkup(createElement(AccessoryCard, {
      accessory: childFilterAccessory,
      lensLabels,
      accessoryMountIndex,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Canon RF 35mm F1.8");
    expect(html).not.toContain("<dd>Monté</dd>");
  });

  /**
   * Verifies that filter tables resolve mounted lens labels through parents
   */
  test("AccessoryTable resolves mounted lens label through parent accessory chain", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTable, {
      accessories: [childFilterAccessory],
      lensLabels,
      accessoryMountIndex,
      showFilterColumns: true,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Canon RF 35mm F1.8");
    expect(html).not.toContain("<td>Monté</td>");
  });

  /**
   * Verifies that invalid parent chains fall back to the generic mounted label
   */
  test("AccessoryCard falls back to Monté when the parent chain loops", () => {
    const loopingAccessoryMountIndex = new Map([
      ["filter-2", { mountedOnLensId: null, mountedOnAccessoryId: "filter-3" }],
      ["filter-3", { mountedOnLensId: null, mountedOnAccessoryId: "filter-2" }],
    ]);

    const html = renderToStaticMarkup(createElement(AccessoryCard, {
      accessory: childFilterAccessory,
      lensLabels,
      accessoryMountIndex: loopingAccessoryMountIndex,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("<dd>Monté</dd>");
  });

  /**
   * Verifies that bag tables keep the weight column and bag-specific labels
   */
  test("AccessoryTable keeps bag weight column and bag fields", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTable, {
      accessories: [bagAccessory],
      lensLabels,
      accessoryMountIndex,
      showFilterColumns: false,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Capacité");
    expect(html).toContain("Laptop");
    expect(html).toContain("Trépied");
    expect(html).toContain("Poids");
    expect(html).toContain("1 660 g");
    expect(html).not.toContain("Interfaces");
    expect(html).not.toContain("Localisation");
  });

  /**
   * Verifies that bag cards keep the weight field for mobile presentation
   */
  test("AccessoryCard keeps weight for bag accessories", () => {
    const html = renderToStaticMarkup(createElement(AccessoryCard, {
      accessory: bagAccessory,
      lensLabels,
      accessoryMountIndex,
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain("Poids");
    expect(html).toContain("1 660 g");
    expect(html).toContain("Laptop");
    expect(html).toContain("Trépied");
    expect(html).not.toContain("Localisation");
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
