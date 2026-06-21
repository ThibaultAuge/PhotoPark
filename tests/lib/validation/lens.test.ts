import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { lensSchema, parseLensFormData } from "../../../src/lib/validation/lens";

function validLensValues() {
  return {
    brandId: "11111111-1111-4111-8111-111111111111",
    mountId: "22222222-2222-4222-8222-222222222221",
    optionIds: ["33333333-3333-4333-8333-333333333331"],
    focalMinMm: "24",
    focalMaxMm: "70",
    maxApertureAtMinFocal: "2.8",
    maxApertureAtMaxFocal: "4",
    minAperture: "22",
    filterDiameterMm: "82",
    priceEur: "1200",
    minFocusDistanceM: "0.38",
    angleAtMinFocalDeg: "84",
    angleAtMaxFocalDeg: "34",
    apertureBlades: "9",
    groupsCount: "14",
    elementsCount: "18",
    weightG: "695",
    isFavorite: true,
    isNextPurchase: false,
    isOwned: true
  };
}

function validFormData() {
  const formData = new FormData();
  formData.set("brandId", "11111111-1111-4111-8111-111111111111");
  formData.set("mountId", "22222222-2222-4222-8222-222222222221");
  formData.append("optionIds", "33333333-3333-4333-8333-333333333331");
  formData.set("focalMinMm", "24");
  formData.set("focalMaxMm", "70");
  formData.set("maxApertureAtMinFocal", "2.8");
  formData.set("maxApertureAtMaxFocal", "4");
  formData.set("minAperture", "22");
  formData.set("filterDiameterMm", "82");
  formData.set("priceEur", "1200");
  formData.set("minFocusDistanceM", "0.38");
  formData.set("angleAtMinFocalDeg", "84");
  formData.set("angleAtMaxFocalDeg", "34");
  formData.set("apertureBlades", "9");
  formData.set("groupsCount", "14");
  formData.set("elementsCount", "18");
  formData.set("weightG", "695");
  formData.set("isFavorite", "on");
  formData.set("isOwned", "on");
  return formData;
}

describe("lens validation", () => {
  /**
   * Verifies that valid lens data is parsed and coerced correctly
   */
  test("lensSchema parses valid values with numeric coercion", () => {
    expect(lensSchema.parse(validLensValues())).toMatchObject({
      brandId: "11111111-1111-4111-8111-111111111111",
      mountId: "22222222-2222-4222-8222-222222222221",
      optionIds: ["33333333-3333-4333-8333-333333333331"],
      focalMinMm: 24,
      focalMaxMm: 70,
      minFocusDistanceM: 0.38,
      isFavorite: true,
      isNextPurchase: false,
      isOwned: true
    });
  });

  /**
   * Verifies that decimal comma values are accepted for apertures
   */
  test("lensSchema accepts decimal comma aperture values", () => {
    expect(lensSchema.parse({
      ...validLensValues(),
      maxApertureAtMinFocal: "2,8",
      maxApertureAtMaxFocal: "4,5",
      minAperture: "22,0"
    })).toMatchObject({
      maxApertureAtMinFocal: 2.8,
      maxApertureAtMaxFocal: 4.5,
      minAperture: 22
    });
  });

  /**
   * Verifies that decimal comma values are accepted for numeric fields
   */
  test("lensSchema accepts decimal comma values for all numeric fields", () => {
    expect(lensSchema.parse({
      ...validLensValues(),
      focalMinMm: "24,5",
      focalMaxMm: "70,5",
      filterDiameterMm: "82,5",
      priceEur: "1200,99",
      minFocusDistanceM: "0,38",
      angleAtMinFocalDeg: "84,1",
      angleAtMaxFocalDeg: "34,2",
      apertureBlades: "9,0",
      groupsCount: "14,0",
      elementsCount: "18,0",
      weightG: "695,5"
    })).toMatchObject({
      focalMinMm: 24.5,
      focalMaxMm: 70.5,
      filterDiameterMm: 82.5,
      priceEur: 1200.99,
      minFocusDistanceM: 0.38,
      angleAtMinFocalDeg: 84.1,
      angleAtMaxFocalDeg: 34.2,
      apertureBlades: 9,
      groupsCount: 14,
      elementsCount: 18,
      weightG: 695.5
    });
  });

  /**
   * Verifies that max aperture at max focal defaults to min focal aperture when omitted
   */
  test("lensSchema defaults missing max focal aperture to min focal aperture", () => {
    expect(lensSchema.parse({ ...validLensValues(), maxApertureAtMinFocal: "2,8", maxApertureAtMaxFocal: "" })).toMatchObject({
      maxApertureAtMinFocal: 2.8,
      maxApertureAtMaxFocal: 2.8
    });
  });

  /**
   * Verifies that max focal aperture defaults when the field is absent
   */
  test("lensSchema defaults absent max focal aperture to min focal aperture", () => {
    const values: Partial<ReturnType<typeof validLensValues>> = { ...validLensValues(), maxApertureAtMinFocal: "3,5" };
    delete values.maxApertureAtMaxFocal;

    expect(lensSchema.parse(values)).toMatchObject({
      maxApertureAtMinFocal: 3.5,
      maxApertureAtMaxFocal: 3.5
    });
  });

  /**
   * Verifies that optional numeric fields become null when empty
   */
  test("lensSchema maps empty optional numeric fields to null", () => {
    const parsed = lensSchema.parse({
      ...validLensValues(),
      minAperture: "",
      filterDiameterMm: "",
      priceEur: null,
      weightG: undefined
    });

    expect(parsed).toMatchObject({
      minAperture: null,
      filterDiameterMm: null,
      priceEur: null,
      weightG: null
    });
  });

  /**
   * Verifies that optional count fields become null when empty
   */
  test("lensSchema maps empty optional count fields to null", () => {
    const parsed = lensSchema.parse({
      ...validLensValues(),
      apertureBlades: "",
      groupsCount: null,
      elementsCount: undefined
    });

    expect(parsed).toMatchObject({
      apertureBlades: null,
      groupsCount: null,
      elementsCount: null
    });
  });

  /**
   * Verifies that missing lens option ids default to an empty list
   */
  test("lensSchema defaults missing option ids to empty list", () => {
    const values: Partial<ReturnType<typeof validLensValues>> = { ...validLensValues() };
    delete values.optionIds;

    expect(lensSchema.parse(values).optionIds).toEqual([]);
  });

  /**
   * Verifies that aperture blade counts reject decimal values
   */
  test("lensSchema rejects decimal aperture blade counts", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), apertureBlades: "9.5" })).toThrow(ZodError);
  });

  /**
   * Verifies that optical group counts reject decimal values
   */
  test("lensSchema rejects decimal optical group counts", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), groupsCount: "14.5" })).toThrow(ZodError);
  });

  /**
   * Verifies that optical element counts reject decimal values
   */
  test("lensSchema rejects decimal optical element counts", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), elementsCount: "18.5" })).toThrow(ZodError);
  });

  /**
   * Verifies that required reference ids reject invalid input
   */
  test("lensSchema rejects invalid brand id", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), brandId: "not-a-uuid" })).toThrow(ZodError);
  });

  /**
   * Verifies that required mount ids reject invalid input
   */
  test("lensSchema rejects invalid mount id", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), mountId: "not-a-uuid" })).toThrow(ZodError);
  });

  /**
   * Verifies that option ids reject invalid input
   */
  test("lensSchema rejects invalid option id", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), optionIds: ["not-a-uuid"] })).toThrow(ZodError);
  });

  /**
   * Verifies that focal maximum cannot be below focal minimum
   */
  test("lensSchema rejects focal max below focal min", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), focalMinMm: "70", focalMaxMm: "24" })).toThrow(
      /focale max/
    );
  });

  /**
   * Verifies that minimum aperture cannot be below maximum aperture
   */
  test("lensSchema rejects invalid minimum aperture", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), minAperture: "2" })).toThrow(/ouverture minimale/i);
  });

  /**
   * Verifies that zero is not accepted as a provided minimum aperture
   */
  test("lensSchema rejects zero minimum aperture", () => {
    expect(() => lensSchema.parse({ ...validLensValues(), minAperture: "0" })).toThrow(ZodError);
  });

  /**
   * Verifies that minimum aperture is checked against defaulted max aperture
   */
  test("lensSchema rejects invalid minimum aperture when max focal aperture is empty", () => {
    expect(() => lensSchema.parse({
      ...validLensValues(),
      maxApertureAtMinFocal: "2,8",
      maxApertureAtMaxFocal: "",
      minAperture: "2"
    })).toThrow(/ouverture minimale/i);
  });

  /**
   * Verifies that form data is parsed with checkbox booleans
   */
  test("parseLensFormData parses form values and checkbox states", () => {
    expect(parseLensFormData(validFormData())).toMatchObject({
      brandId: "11111111-1111-4111-8111-111111111111",
      mountId: "22222222-2222-4222-8222-222222222221",
      optionIds: ["33333333-3333-4333-8333-333333333331"],
      isFavorite: true,
      isNextPurchase: false,
      isOwned: true
    });
  });

  /**
   * Verifies that form data accepts commas and defaults missing aperture
   */
  test("parseLensFormData accepts decimal commas and defaults max focal aperture", () => {
    const formData = validFormData();
    formData.set("focalMinMm", "24,5");
    formData.set("focalMaxMm", "70,5");
    formData.set("maxApertureAtMinFocal", "2,8");
    formData.set("maxApertureAtMaxFocal", "");
    formData.set("minFocusDistanceM", "0,38");

    expect(parseLensFormData(formData)).toMatchObject({
      focalMinMm: 24.5,
      focalMaxMm: 70.5,
      maxApertureAtMinFocal: 2.8,
      maxApertureAtMaxFocal: 2.8,
      minFocusDistanceM: 0.38
    });
  });
});
