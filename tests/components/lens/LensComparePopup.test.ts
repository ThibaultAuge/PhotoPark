import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Lens } from "../../../src/lib/lens/types";

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
  retired: false,
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

const lens4: Lens = {
  ...lens1,
  id: "44444444-4444-4444-8444-444444444444",
  brand: "Nikon",
  mount: "F",
  sensorType: "FULL_FRAME",
  focalMinMm: 50,
  focalMaxMm: 50,
  apscFocalMinEquivalentMm: 75,
  apscFocalMaxEquivalentMm: 75,
  maxApertureAtMinFocal: 1.8,
  maxApertureAtMaxFocal: 1.8,
  label: "Nikon F 50 f/1.8",
  isOwned: false,
};

const lens5: Lens = {
  ...lens1,
  id: "55555555-5555-4555-8555-555555555555",
  brand: "Sony",
  mount: "E",
  sensorType: "FULL_FRAME",
  focalMinMm: 16,
  focalMaxMm: 35,
  apscFocalMinEquivalentMm: 24,
  apscFocalMaxEquivalentMm: 53,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 2.8,
  label: "Sony E 16-35 f/2.8",
  isOwned: true,
};

// ---------------------------------------------------------------------------
// Mock react hooks (useState) for controlled test state
// ---------------------------------------------------------------------------

const reactHookMocks = vi.hoisted(() => ({
  useState: undefined as
    | undefined
    | ((initialValue: unknown) => [unknown, (value: unknown) => void]),
  useRef: undefined as
    | undefined
    | ((initialValue: unknown) => { current: unknown }),
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
    useRef: (initialValue: unknown) =>
      reactHookMocks.useRef
        ? reactHookMocks.useRef(initialValue)
        : { current: initialValue ?? null },
    useEffect: (_cb: () => void | (() => void), _deps: unknown[]) => {
      // no-op in tests — we don't need side effects to run
    },
  };
});

// ---------------------------------------------------------------------------
// Mock LensCompareTable — we only care that it receives the correct lenses
// ---------------------------------------------------------------------------

const LensCompareTableMock = vi.hoisted(() =>
  vi.fn(() => createElement("div", { "data-testid": "compare-table" })),
);

vi.mock("@/components/lens/LensCompareTable", () => ({
  LensCompareTable: LensCompareTableMock,
}));

// ---------------------------------------------------------------------------
// Import the component under test
// ---------------------------------------------------------------------------

import { LensComparePopup } from "../../../src/components/lens/LensComparePopup";

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

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LensComparePopup", () => {
  beforeEach(() => {
    // Reset hook mocks to defaults (let real React hooks handle it)
    reactHookMocks.useState = undefined;
    LensCompareTableMock.mockClear();
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  /**
   * Verifies that the popup renders nothing (returns null) when the lenses
   * array is empty.
   */
  test("returns null when no lenses are selected", () => {
    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [],
        onClear: vi.fn(),
      }),
    );
    expect(html).toBe("");
  });

  /**
   * Verifies that the popup returns null even when onClear is a bound
   * function (no crash with empty array).
   */
  test("does not crash with empty lenses and bound handler", () => {
    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [],
        onClear: () => {},
      }),
    );
    expect(html).toBe("");
  });

  // -----------------------------------------------------------------------
  // Mini popup rendering
  // -----------------------------------------------------------------------

  /**
   * Verifies that the mini floating popup shows the correct count (X/5)
   * and lens labels joined by " · " when lenses are selected.
   */
  test("renders mini popup with correct count and labels for two lenses", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];
    const onClear = vi.fn();

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1, lens2],
        onClear,
      }),
    );

    expect(html).toContain("<strong>2</strong>/5");
    expect(html).toContain("Canon RF 24-70 f/2.8-4 · Fujifilm X 35 f/1.4");
    expect(html).toContain("Comparer");
    expect(html).toContain("Vider");
  });

  /**
   * Verifies that the popup correctly displays a count of 1 when only
   * one lens is selected (minimum selection boundary).
   */
  test("renders count 1/5 for a single selected lens", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1],
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain("<strong>1</strong>/5");
    expect(html).toContain(lens1.label);
  });

  /**
   * Verifies that the popup displays count 5/5 when five lenses are
   * selected (maximum allowed for comparison).
   */
  test("renders count 5/5 for five selected lenses", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1, lens2, lens3, lens4, lens5],
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain("<strong>5</strong>/5");
    for (const lens of [lens1, lens2, lens3, lens4, lens5]) {
      expect(html).toContain(lens.label);
    }
  });

  /**
   * Verifies that the popup has the correct role attribute
   * for accessibility (role="status" implies aria-live="polite").
   */
  test("uses accessible role attribute", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1],
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain('role="status"');
  });

  // -----------------------------------------------------------------------
  // "Vider" button behaviour
  // -----------------------------------------------------------------------

  /**
   * Verifies that clicking the "Vider" button calls the onClear callback.
   */
  test("clicking Vider button calls onClear", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2], onClear });

    const clearButtons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("compare-popup-clear-btn"),
    );

    expect(clearButtons).toHaveLength(1);
    const onClick = clearButtons[0].props.onClick as () => void;
    onClick();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Modal closed by default
  // -----------------------------------------------------------------------

  /**
   * Verifies that the modal (backdrop, modal card, LensCompareTable) is NOT
   * rendered when isOpen is false (initial state).
   */
  test("does not render modal when popup is closed", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];
    const onClear = vi.fn();

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1, lens2],
        onClear,
      }),
    );

    expect(html).not.toContain("modal-backdrop");
    expect(html).not.toContain("modal-card");
    expect(html).not.toContain("Fermer");
    expect(html).not.toContain("Comparaison");
  });

  // -----------------------------------------------------------------------
  // Modal open behaviour
  // -----------------------------------------------------------------------

  /**
   * Verifies that the full comparison modal is rendered when isOpen is
   * true, including backdrop, modal card, title, and Fermer button.
   */
  test("renders modal with comparison table when isOpen is true", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [true, mockSetIsOpen];
    const onClear = vi.fn();

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1, lens2],
        onClear,
      }),
    );

    expect(html).toContain("modal-backdrop");
    expect(html).toContain("modal-card");
    expect(html).toContain("Comparaison");
    expect(html).toContain("Fermer");
  });

  /**
   * Verifies that LensCompareTable is rendered inside the modal and
   * receives the correct lenses array.
   */
  test("passes lenses to LensCompareTable in modal", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [true, mockSetIsOpen];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2, lens3], onClear });

    // Find LensCompareTable elements
    const tableElements = findElements(
      tree,
      (_props, type) => type === LensCompareTableMock,
    );

    expect(tableElements).toHaveLength(1);
    const tableLenses = tableElements[0].props.lenses as Lens[];
    expect(tableLenses).toHaveLength(3);
    expect(tableLenses.map((l) => l.id)).toEqual([
      lens1.id,
      lens2.id,
      lens3.id,
    ]);
  });

  /**
   * Verifies that clicking the "Fermer" button in the modal header calls
   * setIsOpen(false) to close the modal.
   */
  test("clicking Fermer button calls setIsOpen(false)", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [true, mockSetIsOpen];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2], onClear });

    const fermerButtons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("ghost-button") &&
        props.children === "Fermer",
    );

    expect(fermerButtons).toHaveLength(1);
    const onClick = fermerButtons[0].props.onClick as () => void;
    onClick();
    expect(mockSetIsOpen).toHaveBeenCalledTimes(1);
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  /**
   * Verifies that clicking the backdrop (not the modal card) calls
   * setIsOpen(false) to close the modal.
   */
  test("clicking backdrop closes modal", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [true, mockSetIsOpen];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2], onClear });

    // Find the backdrop div
    const backdrops = findElements(
      tree,
      (props, type) =>
        type === "div" &&
        typeof props.className === "string" &&
        (props.className as string).includes("modal-backdrop"),
    );

    expect(backdrops).toHaveLength(1);
    const onClick = backdrops[0].props.onClick as (
      e: { target: unknown; currentTarget: unknown },
    ) => void;

    // Simulate click on backdrop (target === currentTarget)
    onClick({ target: backdrops[0].props, currentTarget: backdrops[0].props });
    expect(mockSetIsOpen).toHaveBeenCalledTimes(1);
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  /**
   * Verifies that clicking inside the modal card (target !== currentTarget)
   * does NOT close the modal — the event does not propagate to the backdrop.
   */
  test("clicking inside modal card does not close modal", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [true, mockSetIsOpen];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2], onClear });

    // Find the backdrop div
    const backdrops = findElements(
      tree,
      (props, type) =>
        type === "div" &&
        typeof props.className === "string" &&
        (props.className as string).includes("modal-backdrop"),
    );

    expect(backdrops).toHaveLength(1);
    const onClick = backdrops[0].props.onClick as (
      e: { target: unknown; currentTarget: unknown },
    ) => void;

    // Simulate click on child element (target !== currentTarget)
    const childTarget = {};
    onClick({ target: childTarget, currentTarget: backdrops[0].props });
    expect(mockSetIsOpen).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // "Comparer" button behaviour (opens modal)
  // -----------------------------------------------------------------------

  /**
   * Verifies that clicking the "Comparer" button calls setIsOpen(true)
   * to open the comparison modal.
   */
  test("clicking Comparer button opens modal", () => {
    const mockSetIsOpen = vi.fn();
    reactHookMocks.useState = (initialValue: unknown) => [false, mockSetIsOpen];
    const onClear = vi.fn();

    const tree = LensComparePopup({ lenses: [lens1, lens2], onClear });

    const comparerButtons = findElements(
      tree,
      (props, type) =>
        type === "button" &&
        typeof props.className === "string" &&
        (props.className as string).includes("compare-popup-compare-btn") &&
        props.children === "Comparer",
    );

    expect(comparerButtons).toHaveLength(1);
    const onClick = comparerButtons[0].props.onClick as () => void;
    onClick();
    expect(mockSetIsOpen).toHaveBeenCalledTimes(1);
    expect(mockSetIsOpen).toHaveBeenCalledWith(true);
  });

  // -----------------------------------------------------------------------
  // Render stability with different lens counts
  // -----------------------------------------------------------------------

  /**
   * Verifies that the popup handles 3 lenses correctly — the count and
   * labels are all displayed.
   */
  test("renders correctly with three lenses", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1, lens2, lens3],
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain("<strong>3</strong>/5");
    expect(html).toContain(lens1.label);
    expect(html).toContain(lens2.label);
    expect(html).toContain(lens3.label);
  });

  /**
   * Verifies that the popup does not crash when a lens has an empty string
   * label (edge case).
   */
  test("handles lens with empty label without crashing", () => {
    reactHookMocks.useState = (initialValue: unknown) => [false, vi.fn()];
    const emptyLabelLens: Lens = { ...lens1, id: "empty-label", label: "" };

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [emptyLabelLens],
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain("<strong>1</strong>/5");
    // Should not crash — the label is just empty in the join
  });

  /**
   * Verifies that both the mini popup and the modal can coexist in the
   * rendered output (mini popup always visible when lenses > 0, modal
   * conditionally visible).
   */
  test("mini popup is rendered alongside modal when open", () => {
    reactHookMocks.useState = (initialValue: unknown) => [true, vi.fn()];
    const onClear = vi.fn();

    const html = renderToStaticMarkup(
      createElement(LensComparePopup, {
        lenses: [lens1],
        onClear,
      }),
    );

    // Mini popup is present
    expect(html).toContain("<strong>1</strong>/5");
    expect(html).toContain("Vider");
    expect(html).toContain("Comparer");
    // Modal is also present
    expect(html).toContain("modal-backdrop");
    expect(html).toContain("Comparaison");
  });
});
