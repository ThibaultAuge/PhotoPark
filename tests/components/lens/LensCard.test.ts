import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { LensCard } from "../../../src/components/lens/LensCard";
import type { Lens } from "../../../src/lib/lens/types";

vi.mock("@/app/actions/lens-actions", () => ({
  deleteLensAction: vi.fn()
}));

const lens: Lens = {
  id: "44444444-4444-4444-8444-444444444444",
  brandId: "11111111-1111-4111-8111-111111111111",
  brand: "Sigma",
  mountId: "22222222-2222-4222-8222-222222222221",
  mount: "E",
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
  label: "Sigma E 24-70 f/2.8-4",
  filterDiameterMm: 82,
  priceEur: 3314,
  minFocusDistanceM: 0.18,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 11,
  opticalFormula: null,
  weightG: 1079,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: false,
  retired: false,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

describe("LensCard", () => {
  test("renders formatted price with right alignment class", () => {
    const html = renderToStaticMarkup(createElement(LensCard, {
      lens,
      selected: false,
      onToggleSelected: vi.fn(),
      onEdit: vi.fn()
    }));

    expect(html).toContain("3 314.00 €");
    expect(html).toContain('class="numeric-value">3 314.00 €');
  });

  test("renders zero price instead of empty dash", () => {
    const html = renderToStaticMarkup(createElement(LensCard, {
      lens: { ...lens, priceEur: 0 },
      selected: false,
      onToggleSelected: vi.fn(),
      onEdit: vi.fn()
    }));

    expect(html).toContain("0.00 €");
  });
});
