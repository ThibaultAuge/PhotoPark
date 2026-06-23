import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { LensFiltersBar } from "../../../src/components/lens/LensFiltersBar";
import type { LensFilters, LensReferenceData } from "../../../src/lib/lens/types";

const referenceData: LensReferenceData = {
  brands: [{ id: "brand-a", name: "Canon" }],
  mounts: [{ id: "mount-a", name: "RF", sensorType: "FULL_FRAME" }],
  options: [{ id: "opt-a", code: "L", description: "Série L", brandId: "brand-a" }],
  optionGroups: [],
  optionGroupMembers: [],
};

const filters: LensFilters = {
  query: "",
  brand: "",
  mount: "",
  option: "",
  kind: "",
  status: "",
  focalMinLow: 0,
  focalMinHigh: 1000,
  focalMaxLow: 0,
  focalMaxHigh: 1000,
  apertureAtMinLow: 1,
  apertureAtMinHigh: 30,
  apertureAtMaxLow: 1,
  apertureAtMaxHigh: 30,
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
  if (element.props && "children" in element.props) {
    findElements(element.props.children as ReactNode, predicate, results);
  }
  return results;
}

describe("LensFiltersBar", () => {
  test("renders type select options Tous Fixe Zoom", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("Type");
    expect(html).toContain(">Tous<");
    expect(html).toContain(">Fixe<");
    expect(html).toContain(">Zoom<");
  });

  test("binds type select value from filters.kind", () => {
    const tree = LensFiltersBar({
      filters: { ...filters, kind: "zoom" },
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    });

    const selects = findElements(tree, (props, type) => type === "select" && props.value === "zoom");
    expect(selects.length).toBeGreaterThan(0);
  });

  test("type select onChange updates filters.kind", () => {
    const setFilters = vi.fn();
    const tree = LensFiltersBar({
      filters,
      setFilters,
      referenceData,
      onReset: vi.fn(),
    });

    const typeSelect = findElements(
      tree,
      (props, type) => type === "select" && Array.isArray(props.children) && String(props.children).includes("Fixe"),
    )[0];

    expect(typeSelect).toBeDefined();
    (typeSelect.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "prime" } });

    expect(setFilters).toHaveBeenCalledWith({ ...filters, kind: "prime" });
  });
});
