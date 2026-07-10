import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { AccessoryFiltersBar } from "../../../src/components/accessory/AccessoryFiltersBar";
import type { AccessoryFilters, AccessoryReferenceData } from "../../../src/lib/accessory/types";

const referenceData: AccessoryReferenceData = {
  brands: [{ id: "brand-a", name: "Peak Design" }],
  types: [
    { id: "type-a", name: "Sac à dos", category: "bag" },
    { id: "type-b", name: "Bague magnétique", category: "filter" },
  ],
  lenses: [],
};

const filters: AccessoryFilters = {
  query: "",
  brand: "",
  type: "",
  status: "",
  laptop: "",
  tripod: "",
  location: "",
  mountType: "",
  compatibleLensId: "",
  onlyCompatible: false,
};

function findElements(
  node: ReactNode,
  predicate: (props: Record<string, unknown>, type: unknown) => boolean,
  results: Array<{ type: unknown; props: Record<string, unknown> }> = [],
): Array<{ type: unknown; props: Record<string, unknown> }> {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") return results;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, results);
    return results;
  }

  const element = node as { type: unknown; props: Record<string, unknown> };
  if ((typeof element.type === "string" || typeof element.type === "function") && predicate(element.props, element.type)) {
    results.push({ type: element.type, props: element.props });
  }
  if (typeof element.type === "function") {
    findElements((element.type as (props: Record<string, unknown>) => ReactNode)(element.props), predicate, results);
    return results;
  }
  if (element.props && "children" in element.props) {
    findElements(element.props.children as ReactNode, predicate, results);
  }
  return results;
}

describe("AccessoryFiltersBar", () => {
  /**
   * Verifies that the accessory filters bar no longer renders capacity or weight controls
   */
  test("renders current filters and omits removed capacity and weight labels", () => {
    const html = renderToStaticMarkup(createElement(AccessoryFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
      typeCategory: "bag",
    }));

    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Filtres");
    expect(html).toContain("Recherche");
    expect(html).toContain("Marque");
    expect(html).toContain("Type");
    expect(html).toContain("Statut");
    expect(html).toContain("Laptop");
    expect(html).toContain("Trépied");
    expect(html).toContain("Effacer les filtres");
    expect(html).not.toContain("Capacité");
    expect(html).not.toContain("Poids");
  });

  /**
   * Verifies that filter mode renders filter-specific controls and type options
   */
  test("renders filter-specific fields for filter accessories", () => {
    const html = renderToStaticMarkup(createElement(AccessoryFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
      typeCategory: "filter",
    }));

    expect(html).toContain("Localisation");
    expect(html).toContain("Liaison");
    expect(html).toContain("Bague magnétique");
    expect(html).not.toContain("Laptop");
    expect(html).not.toContain("Trépied");
    expect(html).not.toContain("Sac à dos");
  });

  /**
   * Verifies that the search placeholder changes between bag and filter modes
   */
  test("renders mode-specific search placeholders", () => {
    const bagHtml = renderToStaticMarkup(createElement(AccessoryFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
      typeCategory: "bag",
    }));

    const filterHtml = renderToStaticMarkup(createElement(AccessoryFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
      typeCategory: "filter",
    }));

    expect(bagHtml).toContain('placeholder="Marque, nom, notes..."');
    expect(filterHtml).toContain('placeholder="Marque, nom, force, notes..."');
  });

  /**
   * Verifies that the status select updates filters with the chosen status
   */
  test("status select onChange updates filters.status", () => {
    const setFilters = vi.fn();
    const tree = AccessoryFiltersBar({
      filters,
      setFilters,
      referenceData,
      onReset: vi.fn(),
      typeCategory: "bag",
    });

    const statusSelect = findElements(tree, (props, type) => type === "select" && props.value === filters.status)[2];

    expect(statusSelect).toBeDefined();
    (statusSelect.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "retired" } });

    expect(setFilters).toHaveBeenCalledWith({ ...filters, status: "retired" });
  });

  /**
   * Verifies that the accessory filters clear action calls the provided reset handler
   */
  test("clear filters button calls onReset", () => {
    const onReset = vi.fn();
    const tree = AccessoryFiltersBar({
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset,
      typeCategory: "bag",
    });

    const resetButton = findElements(
      tree,
      (props, type) => type === "button" && props.type === "button" && props.children === "Effacer les filtres",
    )[0];

    expect(resetButton).toBeDefined();
    (resetButton.props.onClick as () => void)();

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that the accessory filters bar renders the shared clear filters action
   */
  test("renders clear filters button", () => {
    const html = renderToStaticMarkup(createElement(AccessoryFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
      typeCategory: "bag",
    }));

    expect(html).toContain("Effacer les filtres");
  });
});
