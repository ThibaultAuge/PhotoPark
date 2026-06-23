import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock React hooks to make them passthrough in test environment
// ---------------------------------------------------------------------------

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: { ...actual },
    useCallback: (fn: () => unknown) => fn,
  };
});

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import { DualRangeSlider } from "../../../src/components/lens/DualRangeSlider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findElements(
  node: ReactNode,
  predicate: (props: Record<string, unknown>, type: unknown) => boolean,
  results: Array<{ type: unknown; props: Record<string, unknown> }> = [],
): Array<{ type: unknown; props: Record<string, unknown> }> {
  if (
    node == null ||
    typeof node === "boolean" ||
    typeof node === "string" ||
    typeof node === "number"
  ) {
    return results;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      findElements(child, predicate, results);
    }
    return results;
  }

  const element = node as {
    type: unknown;
    props: Record<string, unknown>;
  };

  if (typeof element.type === "string" || typeof element.type === "function") {
    if (predicate(element.props, element.type)) {
      results.push({ type: element.type, props: element.props });
    }
  }

  if (element.props && "children" in element.props) {
    findElements(element.props.children as ReactNode, predicate, results);
  }

  return results;
}

function createSliderElement(props: {
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  onChange?: (range: { low: number; high: number }) => void;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  formatLowValue?: (value: number) => string;
  formatHighValue?: (value: number) => string;
}) {
  const onChange = props.onChange ?? vi.fn();
  return DualRangeSlider({
    min: props.min ?? 0,
    max: props.max ?? 100,
    low: props.low ?? 30,
    high: props.high ?? 70,
    onChange,
    step: props.step ?? 1,
    label: props.label ?? "Test",
    formatValue: props.formatValue ?? ((v: number) => String(v)),
    formatLowValue: props.formatLowValue,
    formatHighValue: props.formatHighValue,
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("DualRangeSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Render: structure & content -----------------------------------

  /**
   * Verifies that the component renders the label text and the formatted
   * low/high values in the header.
   */
  test("renders label and formatted values", () => {
    const markup = renderToStaticMarkup(
      createElement(DualRangeSlider, {
        min: 0,
        max: 200,
        low: 25,
        high: 150,
        onChange: vi.fn(),
        label: "Focale",
        formatValue: (v) => `${v} mm`,
      }),
    );

    expect(markup).toContain("Focale");
    expect(markup).toContain("25 mm — 150 mm");
  });

  /**
   * Verifies that both range inputs are rendered with correct min/max/step.
   */
  test("renders two range inputs with correct attributes", () => {
    const tree = createSliderElement({
      min: 10,
      max: 90,
      step: 5,
      low: 20,
      high: 60,
    });

    const inputs = findElements(
      tree,
      (props, type) => type === "input" && props.type === "range",
    );

    expect(inputs).toHaveLength(2);

    for (const input of inputs) {
      expect(input.props.min).toBe(10);
      expect(input.props.max).toBe(90);
      expect(input.props.step).toBe(5);
    }
  });

  /**
   * Verifies that the low input has the low value and the high input has
   * the high value.
   */
  test("low input value matches low prop, high input value matches high prop", () => {
    const tree = createSliderElement({ low: 15, high: 85 });

    const inputs = findElements(
      tree,
      (props, type) => type === "input" && props.type === "range",
    );

    expect(inputs).toHaveLength(2);

    // The first input (low) has the smaller className suffix "input-low"
    // but we can identify it by value — low should be 15, high should be 85
    const values = inputs.map((i) => i.props.value);
    expect(values).toContain(15);
    expect(values).toContain(85);
  });

  // ----- Highlight track -------------------------------------------------

  /**
   * Verifies that the highlight bar (between the two thumbs) has the
   * correct left offset and width percentage based on low/high values.
   */
  test("highlight bar position and width are correct", () => {
    const tree = createSliderElement({ min: 0, max: 100, low: 20, high: 80 });

    // Find the div with className containing "dual-range-slider-highlight"
    const highlightDivs = findElements(
      tree,
      (props, type) =>
        type === "div" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-highlight"),
    );

    expect(highlightDivs).toHaveLength(1);
    const style = highlightDivs[0].props.style as Record<string, string>;
    expect(style.left).toBe("20%");
    expect(style.width).toBe("60%");
  });

  /**
   * Verifies that when low === high, the highlight bar has zero width.
   */
  test("highlight bar has zero width when low equals high", () => {
    const tree = createSliderElement({ min: 0, max: 100, low: 50, high: 50 });

    const highlightDivs = findElements(
      tree,
      (props, type) =>
        type === "div" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-highlight"),
    );

    expect(highlightDivs).toHaveLength(1);
    const style = highlightDivs[0].props.style as Record<string, string>;
    expect(style.width).toBe("0%");
  });

  // ----- Interaction: low thumb -----------------------------------------

  /**
   * Verifies that changing the low input calls onChange with the new low
   * value, clamped so it does not exceed the current high value.
   */
  test("low thumb change calls onChange with clamped low value", () => {
    const onChange = vi.fn();
    const tree = createSliderElement({
      min: 0,
      max: 100,
      low: 30,
      high: 80,
      onChange,
    });

    const inputs = findElements(
      tree,
      (props, type) =>
        type === "input" &&
        props.type === "range" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-input-low"),
    );

    expect(inputs).toHaveLength(1);

    // Change low to 50 (within bounds, < high)
    (inputs[0].props.onChange as (e: {
      target: { value: string };
    }) => void)({ target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith({ low: 50, high: 80 });
  });

  /**
   * Verifies that dragging the low thumb above the high thumb clamps it
   * to the current high value (Math.min).
   */
  test("low thumb value is clamped to high when exceeding it", () => {
    const onChange = vi.fn();
    const tree = createSliderElement({
      min: 0,
      max: 100,
      low: 30,
      high: 80,
      onChange,
    });

    const inputLow = findElements(
      tree,
      (props, type) =>
        type === "input" &&
        props.type === "range" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-input-low"),
    );

    // Try to set low to 90 (which is > high = 80, should clamp to 80)
    (inputLow[0].props.onChange as (e: {
      target: { value: string };
    }) => void)({ target: { value: "90" } });
    expect(onChange).toHaveBeenCalledWith({ low: 80, high: 80 });
  });

  // ----- Interaction: high thumb ----------------------------------------

  /**
   * Verifies that changing the high input calls onChange with the new high
   * value, clamped so it is not below the current low value.
   */
  test("high thumb change calls onChange with clamped high value", () => {
    const onChange = vi.fn();
    const tree = createSliderElement({
      min: 0,
      max: 100,
      low: 30,
      high: 80,
      onChange,
    });

    const inputHigh = findElements(
      tree,
      (props, type) =>
        type === "input" &&
        props.type === "range" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-input-high"),
    );

    // Change high to 60 (within bounds, > low)
    (inputHigh[0].props.onChange as (e: {
      target: { value: string };
    }) => void)({ target: { value: "60" } });
    expect(onChange).toHaveBeenCalledWith({ low: 30, high: 60 });
  });

  /**
   * Verifies that dragging the high thumb below the low thumb clamps it
   * to the current low value (Math.max).
   */
  test("high thumb value is clamped to low when below it", () => {
    const onChange = vi.fn();
    const tree = createSliderElement({
      min: 0,
      max: 100,
      low: 30,
      high: 80,
      onChange,
    });

    const inputHigh = findElements(
      tree,
      (props, type) =>
        type === "input" &&
        props.type === "range" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-input-high"),
    );

    // Try to set high to 10 (which is < low = 30, should clamp to 30)
    (inputHigh[0].props.onChange as (e: {
      target: { value: string };
    }) => void)({ target: { value: "10" } });
    expect(onChange).toHaveBeenCalledWith({ low: 30, high: 30 });
  });

  // ----- Custom formatValue ---------------------------------------------

  /**
   * Verifies that the formatValue callback is applied to both low and high
   * displayed values.
   */
  test("uses custom formatValue for display", () => {
    const formatValue = (v: number) => `f/${v}`;
    const markup = renderToStaticMarkup(
      createElement(DualRangeSlider, {
        min: 1,
        max: 30,
        low: 2.8,
        high: 5.6,
        onChange: vi.fn(),
        step: 0.1,
        label: "Ouverture",
        formatValue,
      }),
    );

    expect(markup).toContain("f/2.8 — f/5.6");
  });

  /**
   * Verifies that formatLowValue and formatHighValue override the shared
   * formatter for their respective displayed bounds.
   */
  test("uses bound-specific formatter overrides when provided", () => {
    const markup = renderToStaticMarkup(
      createElement(DualRangeSlider, {
        min: 0,
        max: 300,
        low: 300,
        high: 300,
        onChange: vi.fn(),
        label: "Focale",
        formatValue: (v) => `${v} shared`,
        formatLowValue: (v) => `${v} mm`,
        formatHighValue: (v) => `${v}+ mm`,
      }),
    );

    expect(markup).toContain("300 mm — 300+ mm");
    expect(markup).not.toContain("300 shared — 300 shared");
  });

  // ----- Edge cases -----------------------------------------------------

  /**
   * Verifies that the component handles the edge case where min === max
   * (zero range) gracefully without division by zero — the highlight bar
   * position calculations use `|| 1` to guard against this.
   */
  test("handles min === max gracefully (zero range)", () => {
    const tree = createSliderElement({ min: 50, max: 50, low: 50, high: 50 });

    const highlightDivs = findElements(
      tree,
      (props, type) =>
        type === "div" &&
        typeof props.className === "string" &&
        (props.className as string).includes("dual-range-slider-highlight"),
    );

    expect(highlightDivs).toHaveLength(1);
  });

  // ----- ARIA ------------------------------------------------------------

  /**
   * Verifies that both range inputs have descriptive ARIA labels.
   */
  test("inputs have ARIA labels with the provided label", () => {
    const tree = createSliderElement({ label: "Focale min" });

    const inputs = findElements(
      tree,
      (props, type) => type === "input" && props.type === "range",
    );

    expect(inputs).toHaveLength(2);

    const ariaLabels = inputs.map((i) => i.props["aria-label"]);
    expect(ariaLabels).toContain("Focale min — valeur minimale");
    expect(ariaLabels).toContain("Focale min — valeur maximale");
  });
});
