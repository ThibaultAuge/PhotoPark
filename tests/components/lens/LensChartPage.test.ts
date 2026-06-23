import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Lens, LensReferenceData } from "../../../src/lib/lens/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const lens1: Lens = {
  id: "11111111-1111-4111-8111-111111111111",
  brandId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  brand: "Canon",
  mountId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  mount: "RF",
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
  label: "Canon RF 24-70 f/2.8-4",
  filterDiameterMm: 82,
  priceEur: 1200,
  minFocusDistanceM: 0.38,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 9,
  opticalFormula: null,
  weightG: 900,
  isFavorite: true,
  isNextPurchase: false,
  isOwned: true,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
};

const lens2: Lens = {
  ...lens1,
  id: "22222222-2222-4222-8222-222222222222",
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
  isFavorite: false,
  isOwned: false,
};

const lens3: Lens = {
  ...lens1,
  id: "33333333-3333-4333-8333-333333333333",
  brand: "Sigma",
  mount: "E",
  sensorType: "FULL_FRAME",
  focalMinMm: 70,
  focalMaxMm: 200,
  apscFocalMinEquivalentMm: 105,
  apscFocalMaxEquivalentMm: 300,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 2.8,
  label: "Sigma E 70-200 f/2.8",
  isOwned: false,
};

const referenceData: LensReferenceData = {
  brands: [
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Canon" },
    { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", name: "Fujifilm" },
  ],
  mounts: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "RF",
      sensorType: "FULL_FRAME",
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      name: "X",
      sensorType: "APS_C",
    },
  ],
  options: [],
  optionGroups: [],
  optionGroupMembers: [],
};

// ---------------------------------------------------------------------------
// Mock react hooks (useState, useCallback) for controlled test state
// ---------------------------------------------------------------------------

const reactHookMocks = vi.hoisted(() => ({
  useState: undefined as
    | undefined
    | ((initialValue: unknown) => [unknown, (value: unknown) => void]),
  useCallback: undefined as
    | undefined
    | ((fn: () => unknown, deps: unknown[]) => unknown),
  useMemo: undefined as
    | undefined
    | ((fn: () => unknown, deps: unknown[]) => unknown),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: { ...actual },
    useState: (initialValue: unknown) =>
      reactHookMocks.useState
        ? reactHookMocks.useState(initialValue)
        : actual.useState(initialValue),
    useCallback: (fn: () => unknown, deps: unknown[]) =>
      reactHookMocks.useCallback
        ? reactHookMocks.useCallback(fn, deps)
        : actual.useCallback(fn, deps),
    useMemo: <T>(fn: () => T, deps: unknown[]) =>
      reactHookMocks.useMemo
        ? reactHookMocks.useMemo(fn, deps)
        : fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock useLensContext with a mutable context object
// ---------------------------------------------------------------------------

const mockContext = vi.hoisted(() => ({
  filters: {
    query: "",
    brand: "",
    mount: "",
    option: "",
    sensorType: "",
    status: "",
    focalMin: "",
    focalMax: "",
    maxAperture: "",
  },
  setFilters: vi.fn(),
  resetFilters: vi.fn(),
  selectedIds: [] as string[],
  toggleSelected: vi.fn(),
  clearSelection: vi.fn(),
  editingLens: null as Lens | null,
  setEditingLens: vi.fn(),
  showCreate: false,
  setShowCreate: vi.fn(),
  initialLenses: [] as Lens[],
  filteredLenses: [] as Lens[],
  referenceData: null as unknown as LensReferenceData,
}));

vi.mock("@/components/lens/LensProvider", () => ({
  useLensContext: () => mockContext,
}));

// ---------------------------------------------------------------------------
// Mock child components — returning null avoids React rendering issues while
// preserving element identity in the tree for prop assertions
// ---------------------------------------------------------------------------

vi.mock("@/components/lens/LensFiltersBar", () => ({
  LensFiltersBar: function LensFiltersBarMock() {
    return null;
  },
}));

vi.mock("@/components/lens/LensChart", () => ({
  LensChart: function LensChartMock() {
    return null;
  },
}));

vi.mock("@/components/lens/LensComparePopup", () => ({
  LensComparePopup: function LensComparePopupMock() {
    return null;
  },
}));

vi.mock("@/components/lens/LensForm", () => ({
  LensForm: function LensFormMock() {
    return null;
  },
}));

// ---------------------------------------------------------------------------
// Import the component under test and mock component references
// ---------------------------------------------------------------------------

import { LensChartPage } from "../../../src/components/lens/LensChartPage";
import { LensChart } from "@/components/lens/LensChart";
import { LensForm } from "@/components/lens/LensForm";
import { LensComparePopup } from "@/components/lens/LensComparePopup";

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

function renderChartPageHtml(): string {
  return renderToStaticMarkup(createElement(LensChartPage));
}

function renderChartPageTree() {
  return LensChartPage();
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LensChartPage", () => {
  beforeEach(() => {
    // Reset hook mocks to defaults (let real React hooks handle it)
    reactHookMocks.useState = undefined;
    reactHookMocks.useCallback = undefined;
    // Reset context to defaults
    mockContext.initialLenses = [lens1, lens2, lens3];
    mockContext.filteredLenses = [lens1, lens2, lens3];
    mockContext.selectedIds = [];
    mockContext.showCreate = false;
    mockContext.editingLens = null;
    mockContext.referenceData = referenceData;
    vi.clearAllMocks();
  });

  /**
   * Verifies that toolbar displays "0 objectif(s) affiché(s) sur Y" when
   * no lenses are checked, and shows the total count of initial lenses.
   */
  test("renders toolbar with correct initial counts", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const html = renderChartPageHtml();

    expect(html).toContain("0 objectif(s) affiché(s) sur 3");
    expect(html).toContain("Ajouter un objectif");
    expect(html).toContain('class="chart-page-main"');
    expect(html).toContain('class="chart-page-sidebar"');
  });

  /**
   * Verifies that the sidebar renders a lens list header with the count
   * of filtered lenses, and one list item per filtered lens.
   */
  test("renders lens list items for each filtered lens", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const html = renderChartPageHtml();

    expect(html).toContain("Objectifs");
    expect(html).toContain('class="chart-lens-count">');
    expect(html).toContain("Canon RF 24-70 f/2.8-4");
    expect(html).toContain("Fujifilm X 35 f/1.4");
    expect(html).toContain("Sigma E 70-200 f/2.8");

    // Each item has a checkbox (3 total)
    const checkboxes = html.match(/type="checkbox"/g);
    expect(checkboxes).toHaveLength(3);

    // Each item has an empty star (3 total — none selected)
    const hollowStars = html.match(/☆/g);
    expect(hollowStars).toHaveLength(3);
  });

  /**
   * Verifies that lens items whose IDs are in checkedIds receive the
   * CSS class "checked" on their <li> element.
   */
  test("applies .checked class to items in checkedIds", () => {
    reactHookMocks.useState = (initialValue: unknown) => [
      [lens1.id, lens2.id],
      vi.fn(),
    ];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    const items = findElements(
      tree,
      (props, type) =>
        type === "li" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-item"),
    );

    expect(items).toHaveLength(3);
    // First two items (lens1, lens2) are checked
    expect(items[0].props.className).toContain("checked");
    expect(items[1].props.className).toContain("checked");
    // Third item (lens3) is NOT checked
    expect(items[2].props.className).not.toContain("checked");
  });

  /**
   * Verifies that lens items whose IDs are in selectedIds receive the
   * CSS class "selected" on their <li> element.
   */
  test("applies .selected class to items in selectedIds", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.selectedIds = [lens2.id, lens3.id];

    const tree = renderChartPageTree();

    const items = findElements(
      tree,
      (props, type) =>
        type === "li" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-item"),
    );

    expect(items).toHaveLength(3);
    // First item (lens1) is NOT selected
    expect(items[0].props.className).not.toContain("selected");
    // Second and third items (lens2, lens3) are selected
    expect(items[1].props.className).toContain("selected");
    expect(items[2].props.className).toContain("selected");
  });

  /**
   * Verifies that a lens item can be both "checked" (visible on chart)
   * and "selected" (in comparison) independently — lens1 checked only,
   * lens2 selected only, lens3 neither.
   */
  test("checked and selected classes are independent", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[lens1.id], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.selectedIds = [lens2.id];

    const tree = renderChartPageTree();

    const items = findElements(
      tree,
      (props, type) =>
        type === "li" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-item"),
    );

    expect(items).toHaveLength(3);

    // lens1: checked only
    expect(items[0].props.className).toContain("checked");
    expect(items[0].props.className).not.toContain("selected");

    // lens2: selected only
    expect(items[1].props.className).not.toContain("checked");
    expect(items[1].props.className).toContain("selected");

    // lens3: neither
    expect(items[2].props.className).not.toContain("checked");
    expect(items[2].props.className).not.toContain("selected");
  });

  /**
   * Verifies that the checkbox onChange handler calls toggleChecked
   * with the correct lens ID, which controls checkedIds state.
   */
  test("checkbox onChange triggers toggleChecked", () => {
    const mockSetCheckedIds = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [[], mockSetCheckedIds];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    // Find all checkbox inputs inside chart-lens-item list items
    const checkboxes = findElements(
      tree,
      (props, type) => type === "input" && props.type === "checkbox",
    );

    // There should be 3 checkboxes, one per lens
    expect(checkboxes).toHaveLength(3);

    // Simulate clicking each checkbox
    for (const cb of checkboxes) {
      const onChange = cb.props.onChange as () => void;
      onChange();
    }

    // Each click calls setCheckedIds with an updater function
    expect(mockSetCheckedIds).toHaveBeenCalledTimes(3);
  });

  /**
   * Verifies that the star button onClick handler calls toggleSelected
   * from the LensContext with the correct lens ID.
   */
  test("star button onClick calls toggleSelected", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    // Find all compare buttons (star buttons)
    const starButtons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-compare-btn"),
    );

    expect(starButtons).toHaveLength(3);

    // Click each star button
    for (const btn of starButtons) {
      const onClick = btn.props.onClick as () => void;
      onClick();
    }

    expect(mockContext.toggleSelected).toHaveBeenCalledTimes(3);
  });

  /**
   * Verifies that clicking the lens label triggers toggleChecked
   * (same behavior as the checkbox).
   */
  test("label click triggers toggleChecked", () => {
    const mockSetCheckedIds = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [[], mockSetCheckedIds];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    // Find all label spans
    const labels = findElements(
      tree,
      (props, type) =>
        type === "span" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-item-label"),
    );

    expect(labels).toHaveLength(3);

    for (const label of labels) {
      const onClick = label.props.onClick as () => void;
      onClick();
    }

    expect(mockSetCheckedIds).toHaveBeenCalledTimes(3);
  });

  /**
   * Verifies that when filteredLenses is empty, an empty state message
   * is displayed and no lens items are rendered.
   */
  test("shows empty state when no lenses match filters", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.filteredLenses = [];

    const html = renderChartPageHtml();

    expect(html).toContain("Aucun objectif ne correspond aux filtres.");
    expect(html).not.toContain("chart-lens-item");
  });

  /**
   * Verifies that the toolbar count updates when checkedIds changes,
   * showing "X objectif(s) affiché(s) sur Y".
   */
  test("toolbar count updates with checkedIds length", () => {
    reactHookMocks.useState = (initialValue: unknown) => [
      [lens1.id, lens2.id],
      vi.fn(),
    ];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const html = renderChartPageHtml();

    expect(html).toContain("2 objectif(s) affiché(s) sur 3");
  });

  /**
   * Verifies that LensChart receives the checkedLenses array (filtered
   * from initialLenses by checkedIds) and not the full filteredLenses.
   */
  test("LensChart receives checkedLenses prop", () => {
    // Only lens1 and lens3 are checked
    reactHookMocks.useState = (initialValue: unknown) => [
      [lens1.id, lens3.id],
      vi.fn(),
    ];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    // Find the LensChart element by matching its imported mock function identity
    const chartElements = findElements(
      tree,
      (_props, type) => type === LensChart,
    );

    expect(chartElements).toHaveLength(1);
    const lensesProp = chartElements[0].props.lenses as Lens[];
    // checkedLenses should contain only lens1 and lens3
    expect(lensesProp).toHaveLength(2);
    expect(lensesProp.map((l) => l.id)).toEqual([lens1.id, lens3.id]);
    // Ensure lens2 is NOT in checkedLenses
    expect(lensesProp.find((l) => l.id === lens2.id)).toBeUndefined();
  });

  /**
   * Verifies that LensChart also receives selectedIds and onToggleSelected
   * from the context, enabling click-to-deselect on chart elements.
   */
  test("LensChart receives selectedIds and onToggleSelected", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[lens1.id], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.selectedIds = [lens2.id];

    const tree = renderChartPageTree();

    const chartElements = findElements(
      tree,
      (_props, type) => type === LensChart,
    );

    expect(chartElements).toHaveLength(1);
    expect(chartElements[0].props.selectedIds).toEqual([lens2.id]);
    expect(chartElements[0].props.onToggleSelected).toBe(
      mockContext.toggleSelected,
    );
  });

  /**
   * Verifies that LensComparePopup receives the selectedLenses array
   * (filtered from initialLenses by selectedIds) and onClear callback.
   */
  test("compare popup receives selectedLenses and onClear", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.selectedIds = [lens1.id, lens2.id];

    const tree = renderChartPageTree();

    const popupElements = findElements(
      tree,
      (_props, type) => type === LensComparePopup,
    );

    expect(popupElements).toHaveLength(1);
    const popupLenses = popupElements[0].props.lenses as Lens[];
    expect(popupLenses).toHaveLength(2);
    expect(popupLenses.map((l) => l.id)).toEqual([lens1.id, lens2.id]);
    expect(popupElements[0].props.onClear).toBe(mockContext.clearSelection);
  });

  /**
   * Verifies that the LensForm modal appears when showCreate is true,
   * receiving referenceData and onClose from context.
   */
  test("shows LensForm when showCreate is true", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.showCreate = true;

    const tree = renderChartPageTree();

    const formElements = findElements(
      tree,
      (_props, type) => type === LensForm,
    );

    expect(formElements).toHaveLength(1);
    expect(formElements[0].props.title).toBe("Ajouter un objectif");
    expect(formElements[0].props.referenceData).toBe(mockContext.referenceData);
    expect(typeof formElements[0].props.onClose).toBe("function");
  });

  /**
   * Verifies that the edit LensForm modal appears when editingLens is
   * set, receiving the lens data and referenceData.
   */
  test("shows LensForm when editingLens is set", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.editingLens = lens1;

    const tree = renderChartPageTree();

    const formElements = findElements(
      tree,
      (_props, type) => type === LensForm,
    );

    expect(formElements).toHaveLength(1);
    expect(formElements[0].props.title).toBe("Modifier l'objectif");
    expect(formElements[0].props.lens).toBe(lens1);
    expect(formElements[0].props.referenceData).toBe(mockContext.referenceData);
    expect(typeof formElements[0].props.onClose).toBe("function");
  });

  /**
   * Verifies that the star button title attribute changes between
   * "Ajouter à la comparaison" and "Retirer de la comparaison"
   * based on whether the lens is in selectedIds.
   */
  test("star button title changes when lens is selected", () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;
    mockContext.selectedIds = [lens2.id];

    const tree = renderChartPageTree();

    // Find all compare buttons
    const starButtons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("chart-lens-compare-btn"),
    );

    expect(starButtons).toHaveLength(3);

    // First button (lens1, not selected) — hollow star, "Ajouter" title
    expect(starButtons[0].props.title).toBe("Ajouter à la comparaison");
    // Second button (lens2, selected) — filled star, "Retirer" title
    expect(starButtons[1].props.title).toBe("Retirer de la comparaison");
    // Third button (lens3, not selected) — hollow star, "Ajouter" title
    expect(starButtons[2].props.title).toBe("Ajouter à la comparaison");
  });

  /**
   * Verifies that the "Ajouter un objectif" button calls setShowCreate(true)
   * from the LensContext.
   */
  test('"Ajouter un objectif" button triggers setShowCreate(true)', () => {
    reactHookMocks.useState = (initialValue: unknown) => [[], vi.fn()];
    reactHookMocks.useCallback = (fn: () => unknown) => fn;

    const tree = renderChartPageTree();

    const buttons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("primary-button"),
    );

    expect(buttons).toHaveLength(1);
    const onClick = buttons[0].props.onClick as () => void;
    onClick();

    expect(mockContext.setShowCreate).toHaveBeenCalledTimes(1);
    expect(mockContext.setShowCreate).toHaveBeenCalledWith(true);
  });
});
