import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { LensCompareTable } from "../../../src/components/lens/LensCompareTable";
import type { Lens, OptionGroup, OptionGroupMember } from "../../../src/lib/lens/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const L_ID = "33333333-3333-4333-8333-333333333331";
const IS_ID = "33333333-3333-4333-8333-333333333332";
const USM_ID = "33333333-3333-4333-8333-333333333333";
const STM_ID = "33333333-3333-4333-8333-333333333334";
const BRAND_ID = "11111111-1111-4111-8111-111111111111";

const baseLens: Lens = {
  id: "11111111-1111-4111-8111-111111111111",
  brandId: BRAND_ID,
  brand: "Canon",
  mountId: "mount-rf",
  mount: "RF",
  sensorType: "FULL_FRAME",
  focalMinMm: 24,
  focalMaxMm: 70,
  apscFocalMinEquivalentMm: 36,
  apscFocalMaxEquivalentMm: 105,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 4,
  minApertureAtMinFocal: null,
  minApertureAtMaxFocal: null,
  label: "Canon RF 24-70 f/2.8-4 L IS USM",
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
  options: [
    { id: IS_ID, code: "IS", description: "Stabilisé", brandId: BRAND_ID },
    { id: USM_ID, code: "USM", description: "Ultrasonique", brandId: BRAND_ID }
  ]
};

const lensWithOptionL: Lens = {
  ...baseLens,
  id: "22222222-2222-4222-8222-222222222222",
  brand: "Canon",
  mount: "RF",
  focalMinMm: 50,
  focalMaxMm: 50,
  apscFocalMinEquivalentMm: 75,
  apscFocalMaxEquivalentMm: 75,
  maxApertureAtMinFocal: 1.8,
  maxApertureAtMaxFocal: 1.8,
  label: "Canon RF 50 f/1.8",
  priceEur: 299,
  weightG: 160,
  isFavorite: false,
  isOwned: false,
  options: [
    { id: L_ID, code: "L", description: "Série professionnelle", brandId: BRAND_ID }
  ]
};

const lensWithSTM: Lens = {
  ...baseLens,
  id: "33333333-3333-4333-8333-333333333333",
  brand: "Canon",
  mount: "RF",
  focalMinMm: 35,
  focalMaxMm: 35,
  apscFocalMinEquivalentMm: 53,
  apscFocalMaxEquivalentMm: 53,
  maxApertureAtMinFocal: 1.8,
  maxApertureAtMaxFocal: 1.8,
  label: "Canon RF 35 f/1.8 STM",
  priceEur: 499,
  weightG: 305,
  isFavorite: false,
  isOwned: true,
  options: [
    { id: STM_ID, code: "STM", description: "Pas-à-pas", brandId: BRAND_ID }
  ]
};

// ---------------------------------------------------------------------------
// Option groups
// ---------------------------------------------------------------------------

const optionGroups: OptionGroup[] = [
  { id: "g-stab", slug: "stabilization", name: "Stabilisation", type: "flag" },
  { id: "g-motor", slug: "motor", name: "Motorisation", type: "value" },
  { id: "g-series", slug: "series", name: "Série", type: "value" }
];

const optionGroupMembers: OptionGroupMember[] = [
  { optionId: IS_ID, groupId: "g-stab" },   // IS -> Stabilisation
  { optionId: USM_ID, groupId: "g-motor" }, // USM -> Motorisation
  { optionId: STM_ID, groupId: "g-motor" }, // STM -> Motorisation
  { optionId: L_ID, groupId: "g-series" }   // L -> Série
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTable(lenses: Lens[], groups?: OptionGroup[], members?: OptionGroupMember[]) {
  return renderToStaticMarkup(
    createElement(LensCompareTable, {
      lenses,
      optionGroups: groups,
      optionGroupMembers: members
    })
  );
}

function findElements(
  node: ReactNode,
  predicate: (props: Record<string, unknown>, type: unknown) => boolean,
  results: Array<{ type: unknown; props: Record<string, unknown> }> = [],
): Array<{ type: unknown; props: Record<string, unknown> }> {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") {
    return results;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      findElements(child, predicate, results);
    }
    return results;
  }

  const element = node as { type: unknown; props: Record<string, unknown> };

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

describe("LensCompareTable", () => {
  // -----------------------------------------------------------------------
  // Empty / less than 2 lenses
  // -----------------------------------------------------------------------

  /**
   * Verifies that the table shows a placeholder message when fewer than
   * 2 lenses are provided
   */
  test("shows message when fewer than 2 lenses", () => {
    const html = renderTable([]);
    expect(html).toContain("Sélectionnez 2 à 5 objectifs pour comparer toutes leurs caractéristiques.");
  });

  /**
   * Verifies that a single lens also shows the placeholder message
   */
  test("shows message for single lens", () => {
    const html = renderTable([baseLens]);
    expect(html).toContain("Sélectionnez 2 à 5 objectifs pour comparer toutes leurs caractéristiques.");
  });

  // -----------------------------------------------------------------------
  // Table structure
  // -----------------------------------------------------------------------

  /**
   * Verifies that the comparison table renders with two or more lenses,
   * including a "Comparaison" heading and a proper table structure
   */
  test("renders table with 2 lenses", () => {
    const html = renderTable([baseLens, lensWithOptionL]);

    expect(html).toContain("Comparaison");
    expect(html).toContain('<table class="compare-table">');
    // Lens labels appear in table headers
    expect(html).toContain("Canon RF 24-70 f/2.8-4 L IS USM");
    expect(html).toContain("Canon RF 50 f/1.8");
  });

  /**
   * Verifies that the table renders with 3 lenses (all columns present)
   */
  test("renders table with 3 lenses", () => {
    const html = renderTable([baseLens, lensWithOptionL, lensWithSTM]);

    expect(html).toContain("Comparaison");
    expect(html).toContain("Canon RF 35 f/1.8 STM");
  });

  /**
   * Verifies that standard characteristic rows are rendered (Marque, Monture, etc.)
   */
  test("renders standard characteristic rows", () => {
    const html = renderTable([baseLens, lensWithOptionL]);

    expect(html).toContain("Marque");
    expect(html).toContain("Monture");
    expect(html).toContain("Capteur");
    expect(html).toContain("Type");
    expect(html).toContain("Focale");
    expect(html).toContain("Poids");
    expect(html).toContain("Favori");
  });

  // -----------------------------------------------------------------------
  // Flag group type
  // -----------------------------------------------------------------------

  /**
   * Verifies that a flag-type option group row is rendered with the group
   * name when optionGroups and optionGroupMembers are provided
   */
  test("flag group renders group name as row header", () => {
    const groups: OptionGroup[] = [{ id: "g-stab", slug: "stabilization", name: "Stabilisation", type: "flag" }];
    const members: OptionGroupMember[] = [{ optionId: IS_ID, groupId: "g-stab" }];

    const html = renderTable([baseLens, lensWithOptionL], groups, members);

    // The row header should contain the group name
    expect(html).toMatch(/<th>Stabilisation<\/th>/);
  });

  /**
   * Verifies that when all lenses have the matching flag option, the
   * group row still renders with the group name
   */
  test("flag group renders for group where all lenses match", () => {
    const groups: OptionGroup[] = [{ id: "g-stab", slug: "stabilization", name: "Stabilisation", type: "flag" }];
    const members: OptionGroupMember[] = [{ optionId: IS_ID, groupId: "g-stab" }];

    // Both baseLens and a second copy with IS
    const bothHaveIS: Lens = { ...baseLens, id: "another-is-lens" };
    const html = renderTable([baseLens, bothHaveIS], groups, members);

    expect(html).toMatch(/<th>Stabilisation<\/th>/);
  });

  /**
   * Verifies that flag group renders when a lens matches via any option
   * in the group (multiple options in same group)
   */
  test("flag group renders when matching any option in the group", () => {
    const groups: OptionGroup[] = [{ id: "g-motor", slug: "motor", name: "Motorisation", type: "flag" }];
    const members: OptionGroupMember[] = [
      { optionId: USM_ID, groupId: "g-motor" },
      { optionId: STM_ID, groupId: "g-motor" }
    ];

    // lensWithSTM has STM, lensWithOptionL has no motor option
    const html = renderTable([lensWithSTM, lensWithOptionL], groups, members);

    expect(html).toMatch(/<th>Motorisation<\/th>/);
  });

  // -----------------------------------------------------------------------
  // Value group type
  // -----------------------------------------------------------------------

  /**
   * Verifies that a value-type option group renders the group name and
   * the option code for the matching lens
   */
  test("value group renders group name as row header", () => {
    const groups: OptionGroup[] = [{ id: "g-series", slug: "series", name: "Série", type: "value" }];
    const members: OptionGroupMember[] = [{ optionId: L_ID, groupId: "g-series" }];

    const html = renderTable([baseLens, lensWithOptionL], groups, members);

    expect(html).toMatch(/<th>Série<\/th>/);
  });

  /**
   * Verifies that value group renders option code(s) for matching lenses
   */
  test("value group renders option code in cell", () => {
    const groups: OptionGroup[] = [{ id: "g-series", slug: "series", name: "Série", type: "value" }];
    const members: OptionGroupMember[] = [{ optionId: L_ID, groupId: "g-series" }];

    // lensWithOptionL has L, baseLens does not
    const html = renderTable([baseLens, lensWithOptionL], groups, members);

    // The value cell for lensWithOptionL contains the code "L".
    // Since values differ, both cells get <strong> wrapping.
    expect(html).toMatch(/<strong>L<\/strong>/);
  });

  /**
   * Verifies that value group renders multiple codes joined by comma
   */
  test("value group renders multiple codes joined by comma", () => {
    // A lens that has both USM and STM (both in motor group)
    const lensWithBoth: Lens = {
      ...baseLens,
      id: "multi-opt-lens",
      label: "Lens with both motors",
      options: [
        { id: USM_ID, code: "USM", description: "Ultrasonique", brandId: BRAND_ID },
        { id: STM_ID, code: "STM", description: "Pas-à-pas", brandId: BRAND_ID }
      ]
    };
    const lensNoMotor: Lens = {
      ...lensWithOptionL,
      options: [{ id: L_ID, code: "L", description: "Série", brandId: BRAND_ID }]
    };

    const groups: OptionGroup[] = [{ id: "g-motor", slug: "motor", name: "Motorisation", type: "value" }];
    const members: OptionGroupMember[] = [
      { optionId: USM_ID, groupId: "g-motor" },
      { optionId: STM_ID, groupId: "g-motor" }
    ];

    const html = renderTable([lensWithBoth, lensNoMotor], groups, members);

    expect(html).toMatch(/<th>Motorisation<\/th>/);
    // The lens with both should show "USM, STM" (DB sorts by code)
    expect(html).toContain("USM, STM");
  });

  // -----------------------------------------------------------------------
  // Group rows are not rendered when props are missing
  // -----------------------------------------------------------------------

  /**
   * Verifies that no group rows are rendered when optionGroups and
   * optionGroupMembers are not provided
   */
  test("does not render group rows when group props are omitted", () => {
    const html = renderTable([baseLens, lensWithOptionL]);

    expect(html).not.toContain("Stabilisation");
    expect(html).not.toContain("Motorisation");
    expect(html).not.toContain("Série");
  });

  // -----------------------------------------------------------------------
  // Differs highlighting (<strong>)
  // -----------------------------------------------------------------------

  /**
   * Verifies that when values differ between lenses, they are wrapped
   * in <strong> tags
   */
  test("wraps differing values in strong tags", () => {
    const groups: OptionGroup[] = [{ id: "g-stab", slug: "stabilization", name: "Stabilisation", type: "flag" }];
    const members: OptionGroupMember[] = [{ optionId: IS_ID, groupId: "g-stab" }];

    // baseLens has IS -> Oui, lensWithOptionL doesn't -> —
    const html = renderTable([baseLens, lensWithOptionL], groups, members);

    // Values differ, so both should be wrapped in <strong>
    expect(html).toMatch(/<strong>Oui<\/strong>/);
    expect(html).toMatch(/<strong>—<\/strong>/);
  });

  /**
   * Verifies that when all values are identical, they are NOT wrapped
   * in <strong> tags
   */
  test("does not strong-wrap identical values", () => {
    // Two lenses with the same brand (Canon) -> Marque row values are identical
    const html = renderTable([baseLens, lensWithOptionL]);

    // The "Marque" row has same value for both -> should NOT have <strong> around "Canon"
    // Canon appears in headers (th) and possibly in cells. Check specifically for
    // non-strong values between <td> tags
    expect(html).toMatch(/<td>Canon<\/td>/);
  });
});
