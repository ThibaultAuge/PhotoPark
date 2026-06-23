import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LensChart } from "../../../src/components/lens/LensChart";
import type { Lens } from "../../../src/lib/lens/types";
import { buildStableLensColorMap } from "../../../src/lib/lens/chart-colors";

// ---------------------------------------------------------------------------
// Mock React hooks for function-call behaviour tests
// ---------------------------------------------------------------------------

const reactHookMocks = vi.hoisted(() => ({
  useRef: undefined as
    | undefined
    | ((initialValue: unknown) => { current: unknown }),
  useEffect: undefined as
    | undefined
    | ((fn: () => void, deps: unknown[]) => void),
  useLayoutEffect: undefined as
    | undefined
    | ((fn: () => void, deps: unknown[]) => void),
  useCallback: undefined as
    | undefined
    | ((fn: () => unknown, deps: unknown[]) => unknown),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: { ...actual },
    useRef: (initialValue: unknown) =>
      reactHookMocks.useRef
        ? reactHookMocks.useRef(initialValue)
        : actual.useRef(initialValue),
    useEffect: (fn: () => void, deps: unknown[]) =>
      reactHookMocks.useEffect
        ? reactHookMocks.useEffect(fn, deps)
        : actual.useEffect(fn, deps),
    useLayoutEffect: (fn: () => void, deps: unknown[]) =>
      reactHookMocks.useLayoutEffect
        ? reactHookMocks.useLayoutEffect(fn, deps)
        : actual.useLayoutEffect(fn, deps),
    useCallback: (fn: () => unknown, deps: unknown[]) =>
      reactHookMocks.useCallback
        ? reactHookMocks.useCallback(fn, deps)
        : actual.useCallback(fn, deps),
  };
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseLens: Lens = {
  id: "44444444-4444-4444-8444-444444444444",
  brandId: "11111111-1111-4111-8111-111111111111",
  brand: "Sigma",
  mountId: "22222222-2222-4222-8222-222222222221",
  mount: "E",
  sensorType: "FULL_FRAME",
  options: [],
  focalMinMm: 24,
  focalMaxMm: 70,
  apscFocalMinEquivalentMm: 36,
  apscFocalMaxEquivalentMm: 105,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 4,
  minApertureAtMinFocal: null,
  minApertureAtMaxFocal: null,
  label: "Sigma E 24-70 f/2.8-4",
  filterDiameterMm: 82,
  priceEur: null,
  minFocusDistanceM: 0.18,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 11,
  opticalFormula: null,
  weightG: null,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: false,
  retired: false,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
};

const primeLens: Lens = {
  ...baseLens,
  id: "55555555-5555-4555-8555-555555555555",
  brand: "Fujifilm",
  mount: "X",
  sensorType: "APS_C",
  focalMinMm: 35,
  focalMaxMm: 35,
  apscFocalMinEquivalentMm: 53,
  apscFocalMaxEquivalentMm: 53,
  maxApertureAtMinFocal: 1.4,
  maxApertureAtMaxFocal: 1.4,
  label: "Fujifilm X 35 f/1.4",
  priceEur: 499,
  weightG: 187,
  isFavorite: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderChart(lenses: Lens[], selectedIds: string[] = []) {
  return renderToStaticMarkup(
    createElement(LensChart, {
      lenses,
      selectedIds,
      onToggleSelected: vi.fn(),
      lensColors: buildStableLensColorMap(lenses),
    }),
  );
}

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

function renderChartTree(lenses: Lens[], selectedIds: string[] = []) {
  reactHookMocks.useRef = () => ({ current: null });
  reactHookMocks.useEffect = () => {};
  reactHookMocks.useLayoutEffect = () => {};
  reactHookMocks.useCallback = (fn) => fn as () => unknown;

  const onToggleSelected = vi.fn();
  const tree = LensChart({
    lenses,
    selectedIds,
    onToggleSelected,
    lensColors: buildStableLensColorMap(lenses),
  });
  return { tree, onToggleSelected };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LensChart", () => {
  beforeEach(() => {
    reactHookMocks.useRef = undefined;
    reactHookMocks.useEffect = undefined;
    reactHookMocks.useLayoutEffect = undefined;
    reactHookMocks.useCallback = undefined;
    vi.clearAllMocks();
  });

  // ----- Render: structure & content -----------------------------------

  test("renders SVG with axes and structural elements", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toContain("<svg");
    expect(markup).toContain('class="chart-svg"');
    expect(markup).toContain("Focale (mm)");
    expect(markup).toContain("Ouverture f/");
    expect(markup).toMatch(/Molette.*: zoom/);
  });

  test("renders empty state text when no lenses", () => {
    const markup = renderChart([]);

    expect(markup).toContain("Aucun objectif à afficher");
    expect(markup.match(/class="chart-item"/g)).toBeNull();
  });

  test("renders reset zoom button", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toContain("Réinitialiser");
    expect(markup).toMatch(
      /<button[^>]*class="ghost-button"[^>]*>R\u00e9initialiser<\/button>/,
    );
  });

  test("renders reset zoom button even when empty", () => {
    const markup = renderChart([]);
    expect(markup).toContain("Réinitialiser");
  });

  test("renders axis lines and tick labels within data range", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toContain(">24<");
    expect(markup).toContain(">35<");
    expect(markup).toContain(">50<");
    expect(markup).toContain(">70<");
    expect(markup).not.toContain(">300<");

    expect(markup).toContain("f/2.8");
    expect(markup).toContain("f/4");
    expect(markup).toContain("f/5.6");
    expect(markup).toContain("f/8");
    expect(markup).toContain("f/1.4");
    expect(markup).toContain("f/2");
    expect(markup).not.toContain("f/11");
  });

  // ----- Data-dependent rendering ---------------------------------------

  test("selected lenses keep their assigned colour", () => {
    const markup = renderChart([baseLens], [baseLens.id]);

    expect(markup).toContain('stroke="#2563eb"');
    expect(markup).toContain('fill="#2563eb"');
    expect(markup).toContain('stroke-width="5"');
  });

  test("renders label text in the markup", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toContain("Sigma E 24-70 f/2.8-4");
    expect(markup).toContain('class="chart-label"');
  });

  test("renders two triangles for zoom lens", () => {
    const { tree } = renderChartTree([baseLens]);

    const polygons = findElements(
      tree,
      (_props, type) => type === "polygon",
    );

    expect(polygons).toHaveLength(2);
  });

  test("renders one circle for prime lens", () => {
    const { tree } = renderChartTree([primeLens]);

    const circles = findElements(
      tree,
      (props, type) => type === "circle",
    );

    expect(circles).toHaveLength(1);
  });

  /** Verifies that selected prime markers keep their color and gain a white outline */
  test("selected prime marker gets a white outline", () => {
    const { tree } = renderChartTree([primeLens], [primeLens.id]);

    const circles = findElements(
      tree,
      (_props, type) => type === "circle",
    );

    expect(circles).toHaveLength(1);
    expect(circles[0].props.stroke).toBe("#ffffff");
    expect(circles[0].props.fill).toBe("#2563eb");
  });

  /** Verifies that selected zoom markers keep their color and gain white outlines */
  test("selected zoom markers get white outlines", () => {
    const { tree } = renderChartTree([baseLens], [baseLens.id]);

    const polygons = findElements(
      tree,
      (_props, type) => type === "polygon",
    );

    expect(polygons).toHaveLength(2);
    expect(polygons[0].props.stroke).toBe("#ffffff");
    expect(polygons[1].props.stroke).toBe("#ffffff");
    expect(polygons[0].props.fill).toBe("#2563eb");
    expect(polygons[1].props.fill).toBe("#2563eb");
  });

  /** Verifies that chart labels use the same assigned color as their lens line */
  test("chart labels use the assigned lens color", () => {
    const { tree } = renderChartTree([baseLens, primeLens]);

    const labels = findElements(
      tree,
      (props, type) => type === "text" && props.className === "chart-label",
    );

    expect(labels).toHaveLength(2);
    expect(labels[0].props.fill).toBe("#2563eb");
    expect(labels[1].props.fill).toBe("#16a34a");
  });

  // ----- Interaction: click handlers ------------------------------------

  test("clicking lens line calls onToggleSelected", () => {
    const { tree, onToggleSelected } = renderChartTree([baseLens]);

    const lines = findElements(
      tree,
      (props, type) =>
        type === "line" && typeof props.onClick === "function",
    );

    expect(lines.length).toBeGreaterThanOrEqual(1);
    (lines[0].props.onClick as () => void)();

    expect(onToggleSelected).toHaveBeenCalledTimes(1);
    expect(onToggleSelected).toHaveBeenCalledWith(baseLens.id);
  });

  test("clicking prime marker calls onToggleSelected", () => {
    const { tree, onToggleSelected } = renderChartTree([primeLens]);

    const circles = findElements(
      tree,
      (props, type) =>
        type === "circle" && typeof props.onClick === "function",
    );

    expect(circles.length).toBeGreaterThanOrEqual(1);
    (circles[0].props.onClick as () => void)();

    expect(onToggleSelected).toHaveBeenCalledTimes(1);
    expect(onToggleSelected).toHaveBeenCalledWith(primeLens.id);
  });

  test("clicking zoom triangle calls onToggleSelected", () => {
    const { tree, onToggleSelected } = renderChartTree([baseLens]);

    const polygons = findElements(
      tree,
      (props, type) =>
        type === "polygon" && typeof props.onClick === "function",
    );

    expect(polygons.length).toBeGreaterThanOrEqual(1);
    (polygons[0].props.onClick as () => void)();

    expect(onToggleSelected).toHaveBeenCalledTimes(1);
    expect(onToggleSelected).toHaveBeenCalledWith(baseLens.id);
  });

  test("clicking chart label calls onToggleSelected once", () => {
    const { tree, onToggleSelected } = renderChartTree([baseLens]);

    const labels = findElements(
      tree,
      (props, type) =>
        type === "text" && props.className === "chart-label" && typeof props.onClick === "function",
    );

    expect(labels).toHaveLength(1);
    (labels[0].props.onClick as () => void)();

    expect(onToggleSelected).toHaveBeenCalledTimes(1);
    expect(onToggleSelected).toHaveBeenCalledWith(baseLens.id);
  });

  test("reset zoom button has an onClick handler", () => {
    const { tree } = renderChartTree([baseLens]);

    const buttons = findElements(
      tree,
      (props, type) => type === "button",
    );

    expect(buttons).toHaveLength(1);
    expect(typeof buttons[0].props.onClick).toBe("function");
  });

  // ----- Accessibility & ARIA -------------------------------------------

  test("includes ARIA attributes on SVG element", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toContain('role="img"');
    expect(markup).toContain("aria-label");
    expect(markup).toContain("interactif");
  });

  // ----- D3 zoom prerequisites ------------------------------------------

  test("SVG and content <g> have refs for D3 zoom targeting", () => {
    const { tree } = renderChartTree([baseLens]);

    const svgs = findElements(tree, (_props, type) => type === "svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0].props.ref).toBeDefined();
    expect(typeof svgs[0].props.ref).toBe("object");

    const groups = findElements(tree, (_props, type) => type === "g");
    const gWithRef = groups.filter((g) => g.props.ref !== undefined);
    expect(gWithRef).toHaveLength(1);
  });

  test("SVG has correct viewBox dimensions", () => {
    const markup = renderChart([baseLens]);
    expect(markup).toContain('viewBox="0 0 820 360"');
  });

  // ----- Edge cases -----------------------------------------------------

  test("renders horizontal line when aperture is constant", () => {
    const constantApertureLens: Lens = {
      ...baseLens,
      id: "66666666-6666-4666-8666-666666666666",
      focalMinMm: 24,
      focalMaxMm: 70,
      maxApertureAtMinFocal: 2.8,
      maxApertureAtMaxFocal: 2.8,
    };

    const { tree: tree2 } = renderChartTree([constantApertureLens]);

    const lines = findElements(
      tree2,
      (props, type) =>
        type === "line" && typeof props.onClick === "function",
    );

    expect(lines).toHaveLength(1);
  });

  test("renders sloped line when apertures differ", () => {
    const { tree } = renderChartTree([baseLens]);

    const lines = findElements(
      tree,
      (props, type) =>
        type === "line" && typeof props.onClick === "function",
    );

    expect(lines).toHaveLength(1);
    const lineProps = lines[0].props;
    expect(lineProps.y1).not.toBe(lineProps.y2);
    expect(lineProps.x1).not.toBe(lineProps.x2);
  });

  test("renders zoom instruction text", () => {
    const markup = renderChart([baseLens]);

    expect(markup).toMatch(/Molette/);
    expect(markup).toMatch(/Glisser/);
    expect(markup).toMatch(/Cliquer/);
  });

  test("empty state uses empty-chart-text CSS class", () => {
    const markup = renderChart([]);

    expect(markup).toMatch(
      /<text[^>]*class="empty-chart-text"[^>]*>/,
    );
    expect(markup).toContain("Aucun objectif à afficher");
  });

  test("handles empty selectedIds gracefully", () => {
    const markup = renderChart([baseLens], []);

    expect(markup).toContain("#2563eb");
  });
});
