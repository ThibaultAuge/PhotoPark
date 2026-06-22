import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createLensAction, updateLensAction } from "@/app/actions/lens-actions";
import { LensForm } from "../../../src/components/lens/LensForm";
import type { Lens, LensReferenceData } from "../../../src/lib/lens/types";

const reactHookMocks = vi.hoisted(() => ({
  useMemo: undefined as undefined | ((factory: () => unknown) => unknown),
  useState: undefined as undefined | ((initialValue: unknown) => [unknown, (value: unknown) => void])
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const useMemo = (factory: () => unknown, dependencies: unknown[]) => reactHookMocks.useMemo ? reactHookMocks.useMemo(factory) : actual.useMemo(factory, dependencies);
  const useState = (initialValue: unknown) => reactHookMocks.useState ? reactHookMocks.useState(initialValue) : actual.useState(initialValue);

  return {
    ...actual,
    default: { ...actual, useMemo, useState },
    useMemo,
    useState
  };
});

vi.mock("@/app/actions/lens-actions", () => ({
  createLensAction: vi.fn(),
  updateLensAction: vi.fn()
}));

const referenceData: LensReferenceData = {
  brands: [{ id: "11111111-1111-4111-8111-111111111111", name: "Canon" }],
  mounts: [{ id: "22222222-2222-4222-8222-222222222221", name: "RF", sensorType: "FULL_FRAME" }],
  options: [{ id: "33333333-3333-4333-8333-333333333331", code: "IS", description: "Stabilisé" }]
};

const existingLens: Lens = {
  id: "44444444-4444-4444-8444-444444444444",
  brandId: "11111111-1111-4111-8111-111111111111",
  brand: "Canon",
  mountId: "22222222-2222-4222-8222-222222222221",
  mount: "RF",
  sensorType: "FULL_FRAME",
  options: [{ id: "33333333-3333-4333-8333-333333333331", code: "IS", description: "Stabilisé" }],
  focalMinMm: 24,
  focalMaxMm: 70,
  apscFocalMinEquivalentMm: 36,
  apscFocalMaxEquivalentMm: 105,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 2.8,
  minAperture: 22,
  label: "Canon RF 24-70mm f/2.8 IS",
  filterDiameterMm: 82,
  priceEur: 1200,
  minFocusDistanceM: 0.38,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 9,
  groupsCount: 15,
  elementsCount: 21,
  weightG: 900,
  isFavorite: true,
  isNextPurchase: false,
  isOwned: true,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

function renderForm(lens?: Lens) {
  return renderToStaticMarkup(createElement(LensForm, { title: "Objectif", lens, referenceData, onClose: vi.fn() }));
}

function renderFormElement(onClose: () => void, lens?: Lens) {
  reactHookMocks.useMemo = (factory) => factory();
  reactHookMocks.useState = (initialValue) => [initialValue, vi.fn()];

  return LensForm({ title: "Objectif", lens, referenceData, onClose });
}

function findElementByType(node: ReactNode, type: string): { props: Record<string, unknown> } | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByType(child, type);
      if (match) return match;
    }
    return undefined;
  }

  if ("type" in node && node.type === type && "props" in node && typeof node.props === "object" && node.props) {
    return node as { props: Record<string, unknown> };
  }

  if ("props" in node && typeof node.props === "object" && node.props && "children" in node.props) {
    return findElementByType(node.props.children as ReactNode, type);
  }

  return undefined;
}

beforeEach(() => {
  reactHookMocks.useMemo = undefined;
  reactHookMocks.useState = undefined;
  vi.clearAllMocks();
});

describe("LensForm", () => {
  /**
   * Verifies that aperture fields allow decimal comma input in browsers.
   */
  test("renders aperture inputs as text fields", () => {
    const markup = renderForm();

    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="maxApertureAtMinFocal"/);
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="maxApertureAtMaxFocal"/);
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="minAperture"/);
  });

  /**
   * Verifies that max focal aperture is optional in the form.
   */
  test("renders max focal aperture without required validation", () => {
    const markup = renderForm();

    expect(markup).toMatch(/<input[^>]*type="text"[^>]*inputMode="decimal"[^>]*required=""[^>]*name="maxApertureAtMinFocal"/);
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*inputMode="decimal"(?![^>]*required)[^>]*name="maxApertureAtMaxFocal"/);
  });

  /**
   * Verifies that the label import field is available in the form.
   */
  test("renders label import field", () => {
    expect(renderForm()).toMatch(/<input(?=[^>]*type="text")(?=[^>]*maxLength="160")(?=[^>]*placeholder="Canon EF 18-55 F\/3,5-5,6 IS")[^>]*>/);
  });

  /**
   * Verifies that a new form previews the selected brand and mount.
   */
  test("renders generated label preview for new lenses", () => {
    expect(renderForm()).toMatch(/<input(?=[^>]*placeholder="Canon EF 18-55 F\/3,5-5,6 IS")(?=[^>]*value="Canon RF")[^>]*>/);
  });

  /**
   * Verifies that edit forms preserve the stored label and option state.
   */
  test("renders existing lens label and selected options", () => {
    const markup = renderForm(existingLens);

    expect(markup).toMatch(/<input(?=[^>]*placeholder="Canon EF 18-55 F\/3,5-5,6 IS")(?=[^>]*value="Canon RF 24-70mm f\/2\.8 IS")[^>]*>/);
    expect(markup).toMatch(/<input(?=[^>]*name="optionIds")(?=[^>]*value="33333333-3333-4333-8333-333333333331")(?=[^>]*checked="")[^>]*>/);
  });

  /**
   * Verifies that successful lens creation closes the form after save.
   */
  test("closes new lens form after successful creation", async () => {
    const onClose = vi.fn();
    const formData = new FormData();
    let resolveAction!: () => void;
    const actionPromise = new Promise<void>((resolve) => {
      resolveAction = resolve;
    });
    vi.mocked(createLensAction).mockReturnValue(actionPromise);

    const form = findElementByType(renderFormElement(onClose), "form");
    const submit = form?.props.action;

    expect(submit).toEqual(expect.any(Function));
    const submission = (submit as (data: FormData) => Promise<void>)(formData);
    expect(onClose).not.toHaveBeenCalled();

    resolveAction();
    await submission;

    expect(createLensAction).toHaveBeenCalledWith(formData);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that failed lens creation keeps the form open.
   */
  test("keeps new lens form open when creation fails", async () => {
    const onClose = vi.fn();
    const failure = new Error("validation failed");
    vi.mocked(createLensAction).mockRejectedValue(failure);

    const form = findElementByType(renderFormElement(onClose), "form");
    const submit = form?.props.action;

    expect(submit).toEqual(expect.any(Function));
    await expect((submit as (data: FormData) => Promise<void>)(new FormData())).rejects.toThrow("validation failed");
    expect(onClose).not.toHaveBeenCalled();
  });

  /**
   * Verifies that successful lens update closes the form after save.
   */
  test("closes edit lens form after successful update", async () => {
    const onClose = vi.fn();
    const formData = new FormData();
    vi.mocked(updateLensAction).mockResolvedValue(undefined);

    const form = findElementByType(renderFormElement(onClose, existingLens), "form");
    const submit = form?.props.action;

    expect(submit).toEqual(expect.any(Function));
    await (submit as (data: FormData) => Promise<void>)(formData);

    expect(updateLensAction).toHaveBeenCalledWith(existingLens.id, formData);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
