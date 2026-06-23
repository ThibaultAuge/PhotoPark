import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { LensBrand, LensOption, OptionGroup, OptionGroupMember } from "../../../src/lib/lens/types";

// ---------------------------------------------------------------------------
// Mock actions
// ---------------------------------------------------------------------------

vi.mock("@/app/actions/lens-actions", () => ({
  createOptionGroupAction: vi.fn(),
  updateOptionGroupAction: vi.fn(),
  deleteOptionGroupAction: vi.fn(),
  setOptionGroupMembersAction: vi.fn()
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const canonBrand: LensBrand = { id: "canon-id", name: "Canon" };
const sonyBrand: LensBrand = { id: "sony-id", name: "Sony" };

const canonOptions: LensOption[] = [
  { id: "canon-is", code: "IS", description: "Stabilisé", brandId: "canon-id" },
  { id: "canon-usm", code: "USM", description: "Ultrasonique", brandId: "canon-id" }
];

const sonyOptions: LensOption[] = [
  { id: "sony-gm", code: "GM", description: "G Master", brandId: "sony-id" },
  { id: "sony-oss", code: "OSS", description: "Optical SteadyShot", brandId: "sony-id" }
];

const allOptions: LensOption[] = [...canonOptions, ...sonyOptions];

const groups: OptionGroup[] = [
  { id: "g-stab", slug: "stabilization", name: "Stabilisation", type: "flag" },
  { id: "g-motor", slug: "motor", name: "Motorisation", type: "value" }
];

const members: OptionGroupMember[] = [
  { optionId: "canon-is", groupId: "g-stab" },
  { optionId: "canon-usm", groupId: "g-motor" },
  { optionId: "sony-gm", groupId: "g-motor" }
];

// ---------------------------------------------------------------------------
// Mock useState for controlled test state
// ---------------------------------------------------------------------------

const reactHookMocks = vi.hoisted(() => ({
  useState: undefined as undefined | ((initialValue: unknown) => [unknown, (value: unknown) => void])
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: { ...actual },
    useState: (initialValue: unknown) =>
      reactHookMocks.useState
        ? reactHookMocks.useState(initialValue)
        : actual.useState(initialValue)
  };
});

// ---------------------------------------------------------------------------
// Import the component under test
// ---------------------------------------------------------------------------

import { OptionGroupManager } from "../../../src/components/settings/OptionGroupManager";

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("OptionGroupManager", () => {
  beforeEach(() => {
    reactHookMocks.useState = undefined;
    vi.clearAllMocks();
  });

  /**
   * Verifies that the component renders the main heading and page structure
   */
  test("renders main heading", () => {
    reactHookMocks.useState = (initialValue: unknown) => [initialValue, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    expect(html).toContain("Groupes d&#x27;options");
    expect(html).toContain('class="settings-page"');
  });

  /**
   * Verifies that the "Ajouter un groupe" section is present with the
   * required input fields and submit button
   */
  test("renders create group form", () => {
    reactHookMocks.useState = (initialValue: unknown) => [initialValue, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    expect(html).toContain("Ajouter un groupe");
    expect(html).toMatch(/<input[^>]*name="slug"/);
    expect(html).toMatch(/<input[^>]*name="name"/);
    expect(html).toMatch(/<select[^>]*name="type"/);
    expect(html).toContain("Ajouter");
  });

  /**
   * Verifies that existing groups are listed with their names, slugs and types
   */
  test("renders existing groups list", () => {
    reactHookMocks.useState = (initialValue: unknown) => [initialValue, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    expect(html).toContain("Groupes existants (2)");
    expect(html).toContain("Stabilisation");
    expect(html).toContain("(stabilization)");
    expect(html).toContain("Motorisation");
    expect(html).toContain("(motor)");
    // Type labels
    expect(html).toContain("Drapeau");
    expect(html).toContain("Valeur");
  });

  /**
   * Verifies that when no groups exist, an empty state message is displayed
   */
  test("shows empty state when no groups", () => {
    reactHookMocks.useState = (initialValue: unknown) => [initialValue, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups: [],
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members: []
      })
    );

    expect(html).toContain("Aucun groupe. Ajoutez-en un ci-dessus.");
    expect(html).not.toContain("settings-list-item");
  });

  /**
   * Verifies that the group selector dropdown is rendered with all groups
   */
  test("renders group selector dropdown", () => {
    reactHookMocks.useState = (initialValue: unknown) => [groups[0].id, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    expect(html).toContain("Groupe à configurer");
    expect(html).toContain("Stabilisation (stabilization)");
    expect(html).toContain("Motorisation (motor)");
  });

  /**
   * Verifies that member options are displayed for the selected group,
   * grouped by brand, with checkboxes pre-checked for existing members
   */
  test("renders member options grouped by brand", () => {
    // selectedGroupId = groups[0].id = "g-stab"
    reactHookMocks.useState = (initialValue: unknown) => [groups[0].id, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    // Section title for the selected group
    expect(html).toContain("Options du groupe : Stabilisation");

    // Both brands should have their own fieldset
    expect(html).toContain("Canon");
    expect(html).toContain("Sony");

    // IS is a member of g-stab -> should be checked by default
    expect(html).toContain('value="canon-is"');
    expect(html).toMatch(/<input[^>]*checked=""/);
    // USM is NOT a member of g-stab -> should NOT be checked
    expect(html).toMatch(/<input[^>]*value="canon-usm"[^>]*>/);
    expect(html).not.toMatch(/<input[^>]*value="canon-usm"[^>]*checked=""/);

    // Enregistrer button should be present
    expect(html).toContain("Enregistrer les associations");
  });

  /**
   * Verifies that when no options exist for a brand, its fieldset is hidden
   */
  test("hides brand section when brand has no options", () => {
    reactHookMocks.useState = (initialValue: unknown) => [groups[0].id, vi.fn()];

    // Only pass Canon options (no Sony options)
    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: canonOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    // Canon section should still appear
    expect(html).toContain("Canon");
    // Sony has no options passed -> its fieldset should not render
    // (The brand name may appear elsewhere. Check that no Sony options render)
    // But Sony brand name might appear in the brand list only, not as a fieldset legend
    // Actually the component filters options by brandId and skips brands with no options
    // So the brand name itself won't appear in a fieldset
    // The brand filter text still shows brand name in the brand selector though
    // Let's just check the count of fieldset elements
    const legendMatches = html.match(/<legend>/g);
    expect(legendMatches).toHaveLength(1); // Only Canon's fieldset
  });

  /**
   * Verifies that each group has "Modifier" and "Supprimer" buttons
   */
  test("renders edit and delete buttons for each group", () => {
    reactHookMocks.useState = (initialValue: unknown) => [initialValue, vi.fn()];

    const html = renderToStaticMarkup(
      createElement(OptionGroupManager, {
        groups,
        options: allOptions,
        brands: [canonBrand, sonyBrand],
        members
      })
    );

    // Each group should have a "Modifier" button
    const modifierCount = (html.match(/Modifier/g) || []).length;
    expect(modifierCount).toBe(2);

    // Each group should have a "Supprimer" button
    const supprimerCount = (html.match(/Supprimer/g) || []).length;
    expect(supprimerCount).toBe(2);
  });
});
