import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/app/actions/lens-actions", () => ({
  createBrandAction: vi.fn(),
  updateBrandAction: vi.fn(),
  deleteBrandAction: vi.fn(),
}));

import { BrandManager } from "../../../src/components/settings/BrandManager";

describe("BrandManager", () => {
  /**
   * Verifies that create and edit forms expose all supported brand domains
   */
  test("renders domain checkboxes for create and edit forms", () => {
    const html = renderToStaticMarkup(createElement(BrandManager, {
      brands: [{ id: "b1", name: "Peak Design", domains: ["accessories", "bodies"] }],
    }));

    expect(html).toContain("Objectifs");
    expect(html).toContain("Accessoires");
    expect(html).toContain("Boîtiers");
    expect(html).toContain('value="lenses"');
    expect(html).toContain('value="accessories"');
    expect(html).toContain('value="bodies"');
  });

  /**
   * Verifies that the create form defaults to lenses and edit forms reflect domains
   */
  test("renders checked states for create and edit domain checkboxes", () => {
    const html = renderToStaticMarkup(createElement(BrandManager, {
      brands: [{ id: "b1", name: "Peak Design", domains: ["accessories", "bodies"] }],
    }));

    expect(html.match(/<input(?=[^>]*value="lenses")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
    expect(html.match(/<input(?=[^>]*value="accessories")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
    expect(html.match(/<input(?=[^>]*value="bodies")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
  });

  /**
   * Verifies that edit forms check all matching domains for multi-domain brands
   */
  test("renders matching edit checkboxes checked for multi-domain brands", () => {
    const html = renderToStaticMarkup(createElement(BrandManager, {
      brands: [{ id: "b1", name: "Canon", domains: ["lenses", "accessories", "bodies"] }],
    }));

    expect(html.match(/<input(?=[^>]*value="lenses")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(2);
    expect(html.match(/<input(?=[^>]*value="accessories")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
    expect(html.match(/<input(?=[^>]*value="bodies")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
  });
});
