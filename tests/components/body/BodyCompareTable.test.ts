import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { BodyCompareTable } from "../../../src/components/body/BodyCompareTable";
import type { Body } from "../../../src/lib/body/types";

const baseBody: Body = {
  id: "body-1",
  brandId: "brand-1",
  brand: "Canon",
  mountId: "mount-1",
  mount: "Canon RF",
  name: "EOS R6 Mark II",
  label: "Canon EOS R6 Mark II",
  bodyType: "mirrorless",
  isInterchangeableLens: true,
  sensorFormat: "FULL_FRAME",
  megapixels: 24.2,
  isoMin: 100,
  isoMax: 102400,
  priceEur: 2899,
  weightG: 670,
  burstFps: 12,
  videoSpecs: "4K60",
  batteryLifeShots: 580,
  hasIbis: true,
  hasDualCardSlot: true,
  isWeatherSealed: true,
  hasArticulatedScreen: true,
  notes: null,
  isFavorite: true,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const secondBody: Body = {
  ...baseBody,
  id: "body-2",
  brand: "Nikon",
  name: "Z6 III",
  label: "Nikon Z6 III",
  mountId: "mount-2",
  mount: "Nikon Z",
  videoSpecs: "6K RAW",
  burstFps: 20,
  priceEur: 2999,
  hasIbis: true,
};

describe("BodyCompareTable", () => {
  /**
   * Verifies that comparison stays unavailable until at least two bodies exist
   */
  test("shows a helper message below two selected bodies", () => {
    const html = renderToStaticMarkup(createElement(BodyCompareTable, { bodies: [baseBody] }));
    expect(html).toContain("Sélectionnez 2 à 5 boîtiers");
  });

  /**
   * Verifies that the comparison table renders key rows and formatted values
   */
  test("renders comparison rows for two bodies", () => {
    const html = renderToStaticMarkup(createElement(BodyCompareTable, { bodies: [baseBody, secondBody] }));
    expect(html).toContain("Comparaison");
    expect(html).toContain("Canon EOS R6 Mark II");
    expect(html).toContain("Nikon Z6 III");
    expect(html).toContain("Format capteur");
    expect(html).toContain("Mégapixels");
    expect(html).toContain("2 899.00 €");
    expect(html).toContain("670 g");
  });

  /**
   * Verifies that fixed-lens fallback values and differing cells are emphasized
   */
  test("renders fixed-lens fallback and highlights differing values", () => {
    const fixedLensBody: Body = {
      ...baseBody,
      id: "body-3",
      label: "Leica Q3",
      brand: "Leica",
      name: "Q3",
      isInterchangeableLens: false,
      mountId: null,
      mount: null,
      priceEur: 0,
      weightG: 0,
    };

    const html = renderToStaticMarkup(createElement(BodyCompareTable, { bodies: [baseBody, fixedLensBody] }));

    expect(html).toContain("Fixe");
    expect(html).toContain("0.00 €");
    expect(html).toContain("0 g");
    expect(html).toContain("<strong>Canon RF</strong>");
    expect(html).toContain("<strong>Fixe</strong>");
  });
});
