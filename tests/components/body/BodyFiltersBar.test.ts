import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { BodyFiltersBar } from "../../../src/components/body/BodyFiltersBar";
import type { BodyFilters, BodyReferenceData } from "../../../src/lib/body/types";

const referenceData: BodyReferenceData = {
  brands: [{ id: "brand-a", name: "Canon" }],
  mounts: [{ id: "mount-a", name: "RF", sensorType: "FULL_FRAME" }],
};

const filters: BodyFilters = {
  query: "",
  brand: "",
  mount: "",
  sensorFormat: "",
  bodyType: "",
  status: "",
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

describe("BodyFiltersBar", () => {
  /**
   * Verifies that the body filters panel renders collapsed by default
   */
  test("renders as collapsible filters closed by default", () => {
    const html = renderToStaticMarkup(createElement(BodyFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Filtres");
    expect(html).toContain("Effacer les filtres");
    expect(html).toContain("Format");
    expect(html).toContain("Type");
  });

  /**
   * Verifies that changing the status select updates the body status filter
   */
  test("status select onChange updates filters.status", () => {
    const setFilters = vi.fn();
    const tree = BodyFiltersBar({
      filters,
      setFilters,
      referenceData,
      onReset: vi.fn(),
    });

    const statusSelect = findElements(tree, (props, type) => type === "select" && props.value === filters.status)[4];

    expect(statusSelect).toBeDefined();
    (statusSelect.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "owned" } });

    expect(setFilters).toHaveBeenCalledWith({ ...filters, status: "owned" });
  });

  /**
   * Verifies that the body filters clear action calls the provided reset handler
   */
  test("clear filters button calls onReset", () => {
    const onReset = vi.fn();
    const tree = BodyFiltersBar({
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset,
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
   * Verifies that the body filters bar renders the shared clear filters action
   */
  test("renders clear filters button", () => {
    const html = renderToStaticMarkup(createElement(BodyFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("Effacer les filtres");
  });
});
