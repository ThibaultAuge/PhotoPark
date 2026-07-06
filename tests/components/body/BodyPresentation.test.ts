import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { BodyCard } from "../../../src/components/body/BodyCard";
import { BodyTable } from "../../../src/components/body/BodyTable";
import type { Body } from "../../../src/lib/body/types";

const body: Body = {
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
  megapixels: 24,
  isoMin: 100,
  isoMax: 51200,
  priceEur: 0,
  weightG: 0,
  burstFps: 15,
  videoSpecs: null,
  batteryLifeShots: null,
  hasIbis: false,
  hasDualCardSlot: false,
  isWeatherSealed: false,
  hasArticulatedScreen: true,
  notes: null,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("body presentation", () => {
  /**
   * Verifies that table rows render action-menu scroll wrappers and labels
   */
  test("BodyTable renders compact actions and fixed-lens fallback", () => {
    const html = renderToStaticMarkup(createElement(BodyTable, {
      bodies: [body],
      selectedIds: [body.id],
      onToggleSelected: vi.fn(),
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain('class="card table-card table-card-with-actions"');
    expect(html).toContain('<div class="table-scroll"><table>');
    expect(html).toContain('class="actions-column">Actions');
    expect(html).toContain('aria-label="Actions pour Canon PowerShot V1"');
    expect(html).toContain("Voir");
    expect(html).toContain("Modifier");
    expect(html).toContain("Fixe");
    expect(html).toContain("0 g");
    expect(html).toContain("0.00 €");
  });

  /**
   * Verifies that cards keep numeric alignment and the shared action menu
   */
  test("BodyCard renders right-aligned price with shared action menu", () => {
    const html = renderToStaticMarkup(createElement(BodyCard, {
      body,
      selected: false,
      onToggleSelected: vi.fn(),
      onShowDetail: vi.fn(),
      onEdit: vi.fn(),
    }));

    expect(html).toContain('class="numeric-value">0.00 €');
    expect(html).toContain('aria-label="Actions pour Canon PowerShot V1"');
    expect(html).toContain("Voir");
    expect(html).toContain("Modifier");
  });
});
