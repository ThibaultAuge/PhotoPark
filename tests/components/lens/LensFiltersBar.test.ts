import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { LensFiltersBar } from "../../../src/components/lens/LensFiltersBar";
import { DualRangeSlider } from "../../../src/components/lens/DualRangeSlider";
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
  focalMinHigh: 300,
  focalMaxLow: 0,
  focalMaxHigh: 300,
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
  if (typeof element.type === "function") {
    findElements((element.type as (props: Record<string, unknown>) => ReactNode)(element.props), predicate, results);
    return results;
  }
  if (element.props && "children" in element.props) {
    findElements(element.props.children as ReactNode, predicate, results);
  }
  return results;
}

describe("LensFiltersBar", () => {
  /**
   * Verifies that the lens filters bar renders all type filter choices
   */
  test("renders type select options Tous Fixe Zoom", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Filtres");
    expect(html).toContain("Type");
    expect(html).toContain(">Tous<");
    expect(html).toContain(">Fixe<");
    expect(html).toContain(">Zoom<");
  });

  /**
   * Verifies that the lens filters panel is collapsed by default
   */
  test("is closed by default and renders clear filters action", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Effacer les filtres");
  });

  /**
   * Verifies that the type select reflects the current lens kind filter
   */
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

  /**
   * Verifies that the focal slider displays the open 300+ upper bound label
   */
  test("renders focal slider values with 300+ upper bound", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("0 mm — 300+ mm");
  });

  /**
   * Verifies that the focal slider keeps the low bound label without plus suffix
   */
  test("renders focal lower bound at 300 without plus suffix", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters: {
        ...filters,
        focalMinLow: 300,
        focalMinHigh: 300,
      },
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("300 mm — 300+ mm");
  });

  /**
   * Verifies that both focal sliders use the shared 300 mm UI maximum
   */
  test("passes 300 as max to both focal sliders", () => {
    const tree = LensFiltersBar({
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    });

    const focalSliders = findElements(
      tree,
      (props, type) =>
        type === DualRangeSlider &&
        (props.label === "Focale min" || props.label === "Focale max"),
    );

    expect(focalSliders).toHaveLength(2);
    expect(focalSliders[0].props.max).toBe(300);
    expect(focalSliders[1].props.max).toBe(300);
  });

  /**
   * Verifies that focal slider values below the open bound omit the plus suffix
   */
  test("renders focal slider values below 300 without plus suffix", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters: {
        ...filters,
        focalMinLow: 40,
        focalMinHigh: 150,
      },
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("40 mm — 150 mm");
    expect(html).not.toContain("150+ mm");
  });

  /**
   * Verifies that changing the type select updates the lens kind filter
   */
  test("type select onChange updates filters.kind", () => {
    const setFilters = vi.fn();
    const tree = LensFiltersBar({
      filters,
      setFilters,
      referenceData,
      onReset: vi.fn(),
    });

    const typeSelect = findElements(tree, (_props, type) => type === "select")[2];

    expect(typeSelect).toBeDefined();
    (typeSelect.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "prime" } });

    expect(setFilters).toHaveBeenCalledWith({ ...filters, kind: "prime" });
  });

  /**
   * Verifies that the lens filters clear action calls the provided reset handler
   */
  test("clear filters button calls onReset", () => {
    const onReset = vi.fn();
    const tree = LensFiltersBar({
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
   * Verifies that the lens filters bar renders the shared clear filters action
   */
  test("renders clear filters button", () => {
    const html = renderToStaticMarkup(createElement(LensFiltersBar, {
      filters,
      setFilters: vi.fn(),
      referenceData,
      onReset: vi.fn(),
    }));

    expect(html).toContain("Effacer les filtres");
  });
});
