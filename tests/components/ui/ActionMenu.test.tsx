import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ActionMenu, ActionMenuButton } from "../../../src/components/ui/ActionMenu";

describe("ActionMenu", () => {
  /**
   * Verifies that the compact trigger renders with hidden menu content by default
   */
  test("renders a compact trigger with hidden menu content", () => {
    const html = renderToStaticMarkup(createElement(ActionMenu, {
      label: "Actions pour Canon EOS R6",
      children: [
        createElement(ActionMenuButton, { key: "view" }, "Voir"),
        createElement(ActionMenuButton, { key: "delete", danger: true }, "Supprimer"),
      ],
    }));

    expect(html).toContain('aria-label="Actions pour Canon EOS R6"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('role="menu"');
    expect(html).toContain("hidden=\"\"");
    expect(html).toContain("Voir");
    expect(html).toContain("Supprimer");
    expect(html).toContain("action-menu-trigger");
    expect(html).toContain("action-menu-item-danger");
  });

  /**
   * Verifies that menu buttons expose menuitem semantics and preserve attributes
   */
  test("renders menu buttons with menuitem role and merged classes", () => {
    const html = renderToStaticMarkup(createElement(ActionMenuButton, {
      className: "custom-class",
      danger: true,
      disabled: true,
    }, "Supprimer"));

    expect(html).toContain('role="menuitem"');
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('class="action-menu-item action-menu-item-danger custom-class"');
  });
});
