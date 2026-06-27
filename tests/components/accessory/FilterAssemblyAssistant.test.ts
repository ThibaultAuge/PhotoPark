import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { FilterAssemblyAssistant } from "../../../src/components/accessory/FilterAssemblyAssistant";
import type { Accessory, AccessoryLensReference } from "../../../src/lib/accessory/types";

const lenses: AccessoryLensReference[] = [
  { id: "lens-1", label: "Canon RF 35mm F1.8", filterDiameterMm: 52, isOwned: true, isFavorite: false, isNextPurchase: false, retired: false },
];

const accessories: Accessory[] = [
  {
    id: "ring-1",
    brandId: "brand-1",
    brand: "Kase",
    typeId: "type-1",
    type: "Bague",
    typeCategory: "filter",
    name: "Base ring",
    label: "Kase Base ring",
    capacityLiters: null,
    capacityBodies: null,
    capacityLenses: null,
    fitsLaptop: false,
    fitsTripod: false,
    widthMm: null,
    heightMm: null,
    depthMm: null,
    weightG: null,
    priceEur: null,
    carryStyleNotes: null,
    capacityNotes: null,
    storageLocation: "bag",
    mountedOnLensId: null,
    mountedOnAccessoryId: null,
    rearMountType: "threaded",
    rearDiameterMm: 52,
    frontMountType: "magnetic",
    frontDiameterMm: 77,
    filterRole: "adapter",
    filterStrength: null,
    supportsMagneticHood: false,
    isFavorite: false,
    isNextPurchase: false,
    isOwned: true,
    retired: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("FilterAssemblyAssistant", () => {
  /**
   * Verifies that the assistant renders compatibility sections and suggestions
   */
  test("renders the current stack and available assemblies", () => {
    const html = renderToStaticMarkup(createElement(FilterAssemblyAssistant, { accessories, lenses }));

    expect(html).toContain("Assistant de montage");
    expect(html).toContain("Pile montée");
    expect(html).toContain("Montage immédiat");
    expect(html).toContain("Montage avec déplacement");
    expect(html).toContain("Kase Base ring");
    expect(html).toContain("Aucune pièce montée.");
  });

  /**
   * Verifies that the assistant shows an empty state when no lens is available
   */
  test("renders an empty state when no lenses are provided", () => {
    const html = renderToStaticMarkup(createElement(FilterAssemblyAssistant, { accessories: [], lenses: [] }));

    expect(html).toContain("Aucun objectif éligible");
  });

  /**
   * Verifies that a retired lens is excluded from the dropdown
   */
  test("excludes retired lenses from the dropdown", () => {
    const retiredLens: AccessoryLensReference = {
      id: "lens-retired",
      label: "Canon FD 50mm f/1.4",
      filterDiameterMm: 52,
      isOwned: true,
      isFavorite: false,
      isNextPurchase: false,
      retired: true,
    };

    const html = renderToStaticMarkup(createElement(FilterAssemblyAssistant, {
      accessories: [],
      lenses: [...lenses, retiredLens],
    }));

    expect(html).not.toContain("Canon FD 50mm");
    expect(html).toContain("Canon RF 35mm");
  });

  /**
   * Verifies that a lens with all status flags false is excluded
   */
  test("excludes lenses that are not owned, favorite, or next purchase", () => {
    const irrelevantLens: AccessoryLensReference = {
      id: "lens-irrelevant",
      label: "Sony FE 50mm f/1.8",
      filterDiameterMm: 49,
      isOwned: false,
      isFavorite: false,
      isNextPurchase: false,
      retired: false,
    };

    const html = renderToStaticMarkup(createElement(FilterAssemblyAssistant, {
      accessories: [],
      lenses: [...lenses, irrelevantLens],
    }));

    expect(html).not.toContain("Sony FE 50mm");
  });

  /**
   * Verifies that a lens with isNextPurchase (but not owned) is included
   */
  test("includes next-purchase lenses even when not owned", () => {
    const wishlistLens: AccessoryLensReference = {
      id: "lens-wish",
      label: "Nikon Z 24-70mm f/2.8",
      filterDiameterMm: 82,
      isOwned: false,
      isFavorite: false,
      isNextPurchase: true,
      retired: false,
    };

    const html = renderToStaticMarkup(createElement(FilterAssemblyAssistant, {
      accessories: [],
      lenses: [...lenses, wishlistLens],
    }));

    expect(html).toContain("Nikon Z 24-70mm");
  });
});
