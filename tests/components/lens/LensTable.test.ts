import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { LensTable } from "../../../src/components/lens/LensTable";
import type { Lens } from "../../../src/lib/lens/types";

vi.mock("@/app/actions/lens-actions", () => ({
  deleteLensAction: vi.fn()
}));

const baseLens: Lens = {
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
  minAperture: 22,
  label: "Sigma E 24-70 f/2.8-4",
  filterDiameterMm: 82,
  priceEur: null,
  minFocusDistanceM: 0.18,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 11,
  groupsCount: 15,
  elementsCount: 19,
  weightG: null,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: false,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

function renderTable(lenses: Lens[], selectedIds: string[] = []) {
  return renderToStaticMarkup(createElement(LensTable, {
    lenses,
    selectedIds,
    onToggleSelected: vi.fn(),
    onEdit: vi.fn()
  }));
}

describe("LensTable", () => {
  /**
   * Verifies that table rows display formatted lens summary values
   */
  test("renders formatted lens values in table rows", () => {
    const markup = renderTable([baseLens, {
      ...baseLens,
      id: "55555555-5555-4555-8555-555555555555",
      brand: "Fujifilm",
      mount: "X",
      sensorType: "APS_C",
      focalMinMm: 35,
      focalMaxMm: 35,
      apscFocalMinEquivalentMm: 35,
      apscFocalMaxEquivalentMm: 35,
      maxApertureAtMinFocal: 1.4,
      maxApertureAtMaxFocal: 1.4,
      label: "Fujifilm X 35 f/1.4",
      priceEur: 499,
      weightG: 187,
      isFavorite: true
    }], [baseLens.id]);

    expect(markup).toContain("Zoom");
    expect(markup).toContain("24-70 mm");
    expect(markup).toContain("eq. APS-C 36-105 mm");
    expect(markup).toContain("f/2.8-4");
    expect(markup).toContain("Plein format");
    expect(markup).toContain("Fixe");
    expect(markup).toContain("35 mm");
    expect(markup).not.toContain("35-35 mm");
    expect(markup).toContain("f/1.4");
    expect(markup).not.toContain("f/1.4-1.4");
    expect(markup).toContain("APS-C");
    expect(markup).toContain("499 €");
    expect(markup).toContain("187 g");
    expect(markup).toMatch(/<input(?=[^>]*type="checkbox")(?=[^>]*checked="")(?=[^>]*aria-label="Comparer Sigma E 24-70 f\/2\.8-4")[^>]*>/);
  });

  /**
   * Verifies that empty tables display the no-results message
   */
  test("renders empty state when no lenses match filters", () => {
    const markup = renderTable([]);

    expect(markup).toContain("Aucun objectif ne correspond aux filtres.");
    expect(markup).not.toContain("Modifier");
    expect(markup).not.toContain("Supprimer");
  });
});
