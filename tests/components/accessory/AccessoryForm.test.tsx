import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createAccessoryAction, deleteAccessoryAction, updateAccessoryAction } from "@/app/actions/accessory-actions";
import { AccessoryForm } from "../../../src/components/accessory/AccessoryForm";
import type { Accessory, AccessoryReferenceData } from "../../../src/lib/accessory/types";

const reactHookMocks = vi.hoisted(() => ({
  useMemo: undefined as undefined | ((factory: () => unknown) => unknown),
  useRef: undefined as undefined | ((initialValue: unknown) => { current: unknown }),
  useState: undefined as undefined | ((initialValue: unknown) => [unknown, (value: unknown) => void]),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const useMemo = (factory: () => unknown, dependencies: unknown[]) =>
    reactHookMocks.useMemo ? reactHookMocks.useMemo(factory) : actual.useMemo(factory, dependencies);
  const useRef = (initialValue: unknown) =>
    reactHookMocks.useRef ? reactHookMocks.useRef(initialValue) : actual.useRef(initialValue);
  const useState = (initialValue: unknown) =>
    reactHookMocks.useState ? reactHookMocks.useState(initialValue) : actual.useState(initialValue);

  return {
    ...actual,
    default: { ...actual, useMemo, useRef, useState },
    useMemo,
    useRef,
    useState,
  };
});

vi.mock("@/app/actions/accessory-actions", () => ({
  createAccessoryAction: vi.fn(),
  updateAccessoryAction: vi.fn(),
  deleteAccessoryAction: vi.fn(),
}));

const referenceData: AccessoryReferenceData = {
  brands: [{ id: "brand-1", name: "Peak Design" }],
  types: [
    { id: "type-bag", name: "Sac à dos", category: "bag" },
    { id: "type-filter", name: "Filtre", category: "filter" },
  ],
  lenses: [{ id: "lens-1", label: "Canon RF 24-70mm f/2.8", filterDiameterMm: 82, isOwned: true, isFavorite: false, isNextPurchase: false, retired: false }],
};

const existingAccessory: Accessory = {
  id: "accessory-1",
  brandId: "brand-1",
  brand: "Peak Design",
  typeId: "type-bag",
  type: "Sac à dos",
  typeCategory: "bag",
  name: "Everyday Backpack",
  label: "Peak Design Everyday Backpack",
  capacityLiters: 20,
  capacityBodies: 1,
  capacityLenses: 3,
  fitsLaptop: true,
  fitsTripod: false,
  widthMm: 300,
  heightMm: 460,
  depthMm: 220,
  weightG: 1660,
  priceEur: 279,
  carryStyleNotes: null,
  capacityNotes: null,
  storageLocation: "bag",
  mountedOnLensId: null,
  mountedOnAccessoryId: null,
  rearMountType: "none",
  rearDiameterMm: null,
  frontMountType: "none",
  frontDiameterMm: null,
  filterRole: "general",
  filterStrength: null,
  supportsMagneticHood: false,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

const existingFilterAccessory: Accessory = {
  id: "accessory-filter-1",
  brandId: "brand-1",
  brand: "Peak Design",
  typeId: "type-filter",
  type: "Filtre",
  typeCategory: "filter",
  name: "Bague magnétique 77 mm avec pare-soleil",
  label: "Peak Design Bague magnétique 77 mm avec pare-soleil",
  capacityLiters: null,
  capacityBodies: null,
  capacityLenses: null,
  fitsLaptop: false,
  fitsTripod: false,
  widthMm: null,
  heightMm: null,
  depthMm: null,
  weightG: null,
  priceEur: null,
  carryStyleNotes: null,
  capacityNotes: null,
  storageLocation: "bag",
  mountedOnLensId: null,
  mountedOnAccessoryId: null,
  rearMountType: "threaded",
  rearDiameterMm: 77,
  frontMountType: "magnetic",
  frontDiameterMm: 77,
  filterRole: "adapter",
  filterStrength: null,
  supportsMagneticHood: true,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

const stackableFilterAccessory: Accessory = {
  ...existingFilterAccessory,
  id: "accessory-filter-2",
  typeId: "type-filter",
  type: "Filtre",
  name: "Filtre CPL 77 mm",
  label: "Peak Design Filtre CPL 77 mm",
  rearMountType: "magnetic",
  rearDiameterMm: 77,
  frontMountType: "magnetic",
  frontDiameterMm: 77,
  filterRole: "filter",
  filterStrength: "CPL",
  supportsMagneticHood: false,
};

function findElement(node: ReactNode, predicate: (element: { type: unknown; props: Record<string, unknown> }) => boolean): { type: unknown; props: Record<string, unknown> } | undefined {
  if (!node || typeof node !== "object") return undefined;

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return undefined;
  }

  if ("type" in node && "props" in node && typeof node.props === "object" && node.props) {
    const element = node as { type: unknown; props: Record<string, unknown> };
    if (predicate(element)) return element;
    return findElement(element.props.children as ReactNode, predicate);
  }

  return undefined;
}

function renderFormElement({
  onClose = vi.fn(),
  accessory,
  formCurrent = { tagName: "FORM" },
  typeCategory = "bag",
  accessoryList = [existingAccessory],
  refs = referenceData,
}: {
  onClose?: () => void;
  accessory?: Accessory;
  formCurrent?: unknown;
  typeCategory?: "bag" | "filter";
  accessoryList?: Accessory[];
  refs?: AccessoryReferenceData;
}) {
  const stateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
  let stateIndex = 0;

  reactHookMocks.useMemo = (factory) => factory();
  reactHookMocks.useRef = () => ({ current: formCurrent });
  reactHookMocks.useState = (initialValue) => [initialValue, stateSetters[stateIndex++] ?? vi.fn()];

  return {
    node: AccessoryForm({
      title: accessory ? "Modifier" : "Créer",
      referenceData: refs,
      accessories: accessoryList,
      typeCategory,
      accessory,
      onClose,
    }),
    stateSetters,
  };
}

beforeEach(() => {
  reactHookMocks.useMemo = undefined;
  reactHookMocks.useRef = undefined;
  reactHookMocks.useState = undefined;
  vi.clearAllMocks();
});

describe("AccessoryForm", () => {
  /**
   * Verifies that form submission uses onSubmit with FormData(formRef.current)
   * and closes the modal after a successful create.
   */
  test("submits create requests through onSubmit using the current form ref", async () => {
    const originalFormData = globalThis.FormData;
    const formDataCalls: unknown[] = [];

    class FakeFormData {
      source: unknown;

      constructor(source?: unknown) {
        this.source = source;
        formDataCalls.push(source);
      }
    }

    globalThis.FormData = FakeFormData as unknown as typeof FormData;

    try {
      const onClose = vi.fn();
      const formCurrent = { id: "form-element" };
      vi.mocked(createAccessoryAction).mockResolvedValue(undefined);

      const { node } = renderFormElement({ onClose, formCurrent });
      const form = findElement(node, (element) => element.type === "form");
      const submit = form?.props.onSubmit;

      expect(form?.props.action).toBeUndefined();
      expect(submit).toEqual(expect.any(Function));

      const preventDefault = vi.fn();
      await (submit as (event: { preventDefault: () => void; currentTarget: unknown }) => Promise<void>)({ preventDefault, currentTarget: formCurrent });

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(formDataCalls).toEqual([formCurrent]);
      expect(createAccessoryAction).toHaveBeenCalledWith(expect.objectContaining({ source: formCurrent }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.FormData = originalFormData;
    }
  });

  /**
   * Verifies that failed submission keeps the form open and formats Zod
   * issue arrays into readable text.
   */
  test("formats serialized validation errors on failed submit", async () => {
    const originalFormData = globalThis.FormData;
    globalThis.FormData = class {
      constructor(_source?: unknown) {}
    } as unknown as typeof FormData;

    try {
      const onClose = vi.fn();
      const failure = new Error(
        JSON.stringify([
          { path: ["name"], message: "Le nom est requis" },
          { path: ["typeId"], message: "Le type est requis" },
        ]),
      );
      vi.mocked(createAccessoryAction).mockRejectedValue(failure);

      const { node, stateSetters } = renderFormElement({ onClose });
      const form = findElement(node, (element) => element.type === "form");
      const submit = form?.props.onSubmit;

      await (submit as (event: { preventDefault: () => void; currentTarget: unknown }) => Promise<void>)({ preventDefault: vi.fn(), currentTarget: { id: "form-element" } });

      expect(onClose).not.toHaveBeenCalled();
      expect(stateSetters[0]).toHaveBeenNthCalledWith(1, null);
      expect(stateSetters[0]).toHaveBeenNthCalledWith(2, "Le nom est requis · Le type est requis");
    } finally {
      globalThis.FormData = originalFormData;
    }
  });

  /**
   * Verifies that the delete button uses its explicit handler and closes the
   * modal after a successful delete.
   */
  test("deletes an existing accessory through the delete button handler", async () => {
    const onClose = vi.fn();
    vi.mocked(deleteAccessoryAction).mockResolvedValue(undefined);

    const { node } = renderFormElement({ onClose, accessory: existingAccessory });
    const deleteButton = findElement(
      node,
      (element) =>
        element.type === "button" &&
        element.props.type === "button" &&
        element.props.className === "danger-button",
    );

    expect(deleteButton?.props.onClick).toEqual(expect.any(Function));

    await (deleteButton?.props.onClick as () => Promise<void>)();

    expect(deleteAccessoryAction).toHaveBeenCalledWith(existingAccessory.id);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(updateAccessoryAction).not.toHaveBeenCalled();
  });

  /**
   * Verifies that filter-category adapter items show calculated type and name
   * from their interfaces and derived role.
   */
  test("renders derived filter type and name for magnetic adapters", () => {
    const filterReferenceData: AccessoryReferenceData = {
      ...referenceData,
      types: [
        { id: "type-filter", name: "Filtre", category: "filter" },
        { id: "type-magnetic-step", name: "Bague de réduction magnétique", category: "filter" },
        { id: "type-magnetic", name: "Bague magnétique", category: "filter" },
      ],
    };

    const { node } = renderFormElement({
      accessory: existingFilterAccessory,
      typeCategory: "filter",
      accessoryList: [existingFilterAccessory],
      refs: filterReferenceData,
    });

    const hiddenType = findElement(node, (element) => element.type === "input" && element.props.name === "typeId");
    const hiddenName = findElement(node, (element) => element.type === "input" && element.props.name === "name");
    const calculatedType = findElement(node, (element) => element.type === "input" && element.props.value === "Bague magnétique");
    const calculatedName = findElement(node, (element) => element.type === "input" && element.props.value === "Bague magnétique 77 mm avec pare-soleil");

    expect(hiddenType?.props.value).toBe("type-magnetic");
    expect(hiddenName?.props.value).toBe("Bague magnétique 77 mm avec pare-soleil");
    expect(calculatedType?.props.readOnly).toBe(true);
    expect(calculatedName?.props.readOnly).toBe(true);
  });

  /**
   * Verifies that filter-role items hide explicit front interface controls.
   */
  test("hides front interface controls for filter role", () => {
    const { node } = renderFormElement({
      accessory: stackableFilterAccessory,
      typeCategory: "filter",
      accessoryList: [stackableFilterAccessory],
    });

    const frontMountSelect = findElement(node, (element) => element.type === "select" && element.props.name === "frontMountType");
    const frontDiameterInput = findElement(node, (element) => element.type === "input" && element.props.name === "frontDiameterMm" && element.props.type !== "hidden");
    const frontHiddenMount = findElement(node, (element) => element.type === "input" && element.props.name === "frontMountType" && element.props.type === "hidden");

    expect(frontMountSelect).toBeUndefined();
    expect(frontDiameterInput).toBeUndefined();
    expect(frontHiddenMount?.props.value).toBe("magnetic");
  });

  /**
   * Verifies that unsupported adapter interfaces keep filter submission
   * disabled and do not call the create action.
   */
  test("blocks submit when derived filter presentation is invalid", async () => {
    const invalidFilterAccessory: Accessory = {
      ...existingFilterAccessory,
      rearMountType: "magnetic",
      rearDiameterMm: 77,
      frontMountType: "threaded",
      frontDiameterMm: 77,
      supportsMagneticHood: false,
      name: "Bague impossible",
      label: "Peak Design Bague impossible",
    };

    const { node, stateSetters } = renderFormElement({
      accessory: invalidFilterAccessory,
      typeCategory: "filter",
      accessoryList: [invalidFilterAccessory],
    });
    const form = findElement(node, (element) => element.type === "form");
    const submitButton = findElement(node, (element) => element.type === "button" && element.props.className === "primary-button");

    expect(submitButton?.props.disabled).toBe(true);

    await (form?.props.onSubmit as (event: { preventDefault: () => void; currentTarget: unknown }) => Promise<void>)({
      preventDefault: vi.fn(),
      currentTarget: { id: "form-element" },
    });

    expect(createAccessoryAction).not.toHaveBeenCalled();
    expect(stateSetters[0]).toHaveBeenCalledWith(
      "Combinaison non prise en charge. Utilise uniquement vis→vis (diamètres différents), vis→magnétique ou magnétique→magnétique.",
    );
  });

  /**
   * Verifies that uncontrolled Field renders defaultValue and does not set a value prop
   */
  test("renders uncontrolled Field with defaultValue only", () => {
    const { node } = renderFormElement({
      accessory: existingAccessory,
      typeCategory: "bag",
      accessoryList: [existingAccessory],
    });

    const nameInput = findElement(
      node,
      (element) => element.type === "input" && element.props.name === "name",
    );

    expect(nameInput?.props.defaultValue).toBe("Everyday Backpack");
    expect(nameInput?.props.value).toBeUndefined();
    expect(nameInput?.props.onChange).toBeUndefined();
  });

  /**
   * Verifies that controlled Field renders value and onChange but no defaultValue prop
   */
  test("renders controlled Field with value and onChange only", () => {
    const { node } = renderFormElement({
      accessory: existingFilterAccessory,
      typeCategory: "filter",
      accessoryList: [existingFilterAccessory],
    });

    const rearDiameterInput = findElement(
      node,
      (element) => element.type === "input" && element.props.name === "rearDiameterMm",
    );

    expect(rearDiameterInput?.props.value).toBe("77");
    expect(rearDiameterInput?.props.onChange).toEqual(expect.any(Function));
    expect(rearDiameterInput?.props.defaultValue).toBeUndefined();
  });
});
