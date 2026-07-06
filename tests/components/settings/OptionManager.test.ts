import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/app/actions/lens-actions", () => ({
  createOptionAction: vi.fn(),
  updateOptionAction: vi.fn(),
  deleteOptionAction: vi.fn(),
}));

import { OptionManager } from "../../../src/components/settings/OptionManager";

describe("OptionManager", () => {
  /**
   * Verifies that filtered option rows render the shared action menu controls
   */
  test("renders compact action menu for options of the selected brand", () => {
    const html = renderToStaticMarkup(createElement(OptionManager, {
      brands: [
        { id: "canon", name: "Canon" },
        { id: "sony", name: "Sony" },
      ],
      options: [
        { id: "opt-1", code: "IS", description: "Stabilisation", brandId: "canon" },
        { id: "opt-2", code: "GM", description: "G Master", brandId: "sony" },
      ],
    }));

    expect(html).toContain('aria-label="Actions pour IS"');
    expect(html).toContain("OK");
    expect(html).toContain("Supprimer");
    expect(html).not.toContain('aria-label="Actions pour GM"');
  });
});
