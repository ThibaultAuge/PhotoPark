import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { BodyForm } from "../../../src/components/body/BodyForm";
import type { Body, BodyReferenceData } from "../../../src/lib/body/types";

vi.mock("@/app/actions/body-actions", () => ({
  createBodyAction: vi.fn(),
  updateBodyAction: vi.fn(),
  deleteBodyAction: vi.fn(),
}));

const referenceData: BodyReferenceData = {
  brands: [{ id: "brand-1", name: "Canon" }],
  mounts: [{ id: "mount-1", name: "Canon RF", sensorType: "FULL_FRAME" }],
};

const fixedLensBody: Body = {
  id: "body-1",
  brandId: "brand-1",
  brand: "Canon",
  mountId: null,
  mount: null,
  name: "PowerShot V1",
  label: "Canon PowerShot V1",
  bodyType: "compact",
  isInterchangeableLens: false,
  sensorFormat: "CMOS",
  megapixels: 22,
  isoMin: 100,
  isoMax: 12800,
  priceEur: 899,
  weightG: 426,
  burstFps: 30,
  videoSpecs: "4K60",
  batteryLifeShots: 400,
  hasIbis: false,
  hasDualCardSlot: false,
  isWeatherSealed: false,
  hasArticulatedScreen: true,
  notes: null,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: false,
  retired: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("BodyForm", () => {
  /**
   * Verifies that body and sensor selects include compact and CMOS options
   */
  test("renders compact body type and CMOS sensor format options", () => {
    const html = renderToStaticMarkup(createElement(BodyForm, {
      title: "Créer un boîtier",
      referenceData,
      onClose: () => undefined,
    }));

    expect(html).toContain('<option value="compact">Compact</option>');
    expect(html).toContain('<option value="CMOS">CMOS</option>');
  });

  /**
   * Verifies that fixed-lens body editing disables mount selection in the form
   */
  test("disables mount selector when body has fixed lens", () => {
    const html = renderToStaticMarkup(createElement(BodyForm, {
      title: "Modifier le boîtier",
      referenceData,
      body: fixedLensBody,
      onClose: () => undefined,
    }));

    expect(html).toContain('name="mountId"');
    expect(html).toContain("disabled");
    expect(html).toContain('<option value="CMOS" selected="">CMOS</option>');
    expect(html).toContain('<option value="compact" selected="">Compact</option>');
  });
});
