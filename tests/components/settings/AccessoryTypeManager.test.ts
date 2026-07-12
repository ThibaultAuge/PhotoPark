import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/app/actions/accessory-actions", () => ({
  createAccessoryTypeAction: vi.fn(),
  updateAccessoryTypeAction: vi.fn(),
  deleteAccessoryTypeAction: vi.fn(),
}));

import { AccessoryTypeManager } from "../../../src/components/settings/AccessoryTypeManager";

describe("AccessoryTypeManager", () => {
  /**
   * Verifies that existing accessory type rows render the shared action menu
   */
  test("renders compact action menu for existing accessory types", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTypeManager, {
      types: [{ id: "type-1", name: "Sac à dos", category: "bag", profile: null }],
    }));

    expect(html).toContain('aria-label="Actions pour Sac à dos"');
    expect(html).toContain("OK");
    expect(html).toContain("Supprimer");
  });

  /**
   * Verifies that accessory type forms expose the other category and profiles
   */
  test("renders other category and profile options", () => {
    const html = renderToStaticMarkup(createElement(AccessoryTypeManager, {
      types: [{ id: "type-2", name: "Batterie", category: "other", profile: "battery" }],
    }));

    expect(html).toContain("Autres accessoires");
    expect(html).toContain("Batterie");
    expect(html).toContain("Chargeur / alimentation");
    expect(html).toContain('value="other" selected');
    expect(html).toContain('value="battery" selected');
  });
});
