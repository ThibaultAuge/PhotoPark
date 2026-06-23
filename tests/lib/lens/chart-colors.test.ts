import { describe, expect, test } from "vitest";

import {
  buildStableLensColorMap,
  CHART_PALETTE,
  getContrastTextColor,
} from "../../../src/lib/lens/chart-colors";

describe("chart-colors", () => {
  /** Verifies that stable chart colors are assigned from the initial lens order */
  test("buildStableLensColorMap uses initial lens order", () => {
    const colors = buildStableLensColorMap([
      { id: "lens-3" },
      { id: "lens-1" },
      { id: "lens-2" },
    ]);

    expect(colors).toEqual({
      "lens-3": CHART_PALETTE[0],
      "lens-1": CHART_PALETTE[1],
      "lens-2": CHART_PALETTE[2],
    });
  });

  /** Verifies that stable chart colors wrap to the palette start when exhausted */
  test("buildStableLensColorMap cycles through the palette", () => {
    const colors = buildStableLensColorMap(
      Array.from({ length: CHART_PALETTE.length + 1 }, (_, index) => ({
        id: `lens-${index}`,
      })),
    );

    expect(colors[`lens-${CHART_PALETTE.length}`]).toBe(CHART_PALETTE[0]);
  });

  /** Verifies that contrast text is dark for bright chart colors */
  test("getContrastTextColor returns dark text for bright colors", () => {
    expect(getContrastTextColor("#fef08a")).toBe("#111827");
  });

  /** Verifies that contrast text is white for dark chart colors */
  test("getContrastTextColor returns white text for dark colors", () => {
    expect(getContrastTextColor("#2563eb")).toBe("#ffffff");
  });

  /** Verifies that contrast text supports three-digit hex colors */
  test("getContrastTextColor supports short hex colors", () => {
    expect(getContrastTextColor("#fff")).toBe("#111827");
  });

  /** Verifies that invalid chart colors fall back to the default dark text */
  test("getContrastTextColor falls back for invalid colors", () => {
    expect(getContrastTextColor("not-a-color")).toBe("#111827");
  });
});
