import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { LensStatusTags } from "../../../src/components/lens/LensStatusTags";
import type { Lens } from "../../../src/lib/lens/types";

const baseLens: Lens = {
  id: "44444444-4444-4444-8444-444444444444",
  brandId: "11111111-1111-4111-8111-111111111111",
  brand: "Canon",
  mountId: "22222222-2222-4222-8222-222222222221",
  mount: "RF",
  sensorType: "FULL_FRAME",
  options: [],
  focalMinMm: 24,
  focalMaxMm: 70,
  apscFocalMinEquivalentMm: 36,
  apscFocalMaxEquivalentMm: 105,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 4,
  minApertureAtMinFocal: null,
  minApertureAtMaxFocal: null,
  label: "Canon RF 24-70 f/2.8-4",
  filterDiameterMm: 82,
  priceEur: 1200,
  minFocusDistanceM: 0.38,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 9,
  opticalFormula: null,
  weightG: 900,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: false,
  retired: false,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
};

function renderTags(lens: Lens) {
  return renderToStaticMarkup(createElement(LensStatusTags, { lens }));
}

describe("LensStatusTags", () => {
  /**
   * Verifies that when lens.retired is true, the component renders
   * a span with class "tag retired" containing the text "Retiré".
   */
  test("renders Retiré badge when lens is retired", () => {
    const html = renderTags({ ...baseLens, retired: true });

    expect(html).toContain('class="tag retired"');
    expect(html).toContain("Retiré");
  });

  /**
   * Verifies that when lens.retired is false, the component does
   * NOT render the "Retiré" badge.
   */
  test("does not render Retiré badge when lens is not retired", () => {
    const html = renderTags({ ...baseLens, retired: false });

    expect(html).not.toContain("tag retired");
    expect(html).not.toContain("Retiré");
  });

  /**
   * Verifies that when a lens is owned, retired, favorite, and a
   * next purchase, all four badges are rendered correctly.
   */
  test("renders all status badges together", () => {
    const lens: Lens = {
      ...baseLens,
      isOwned: true,
      retired: true,
      isFavorite: true,
      isNextPurchase: true,
    };
    const html = renderTags(lens);

    expect(html).toContain('class="tag owned"');
    expect(html).toContain("Possédé");
    expect(html).toContain('class="tag retired"');
    expect(html).toContain("Retiré");
    expect(html).toContain('class="tag favorite"');
    expect(html).toContain("Favori");
    expect(html).toContain('class="tag next"');
    expect(html).toContain("Prochain achat");
  });
});
