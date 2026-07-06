import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/app/actions/lens-actions", () => ({
  createMountAction: vi.fn(),
  updateMountAction: vi.fn(),
  deleteMountAction: vi.fn(),
}));

import { MountManager } from "../../../src/components/settings/MountManager";

describe("MountManager", () => {
  /**
   * Verifies that existing mount rows render the shared action menu controls
   */
  test("renders compact action menu for existing mounts", () => {
    const html = renderToStaticMarkup(createElement(MountManager, {
      mounts: [{ id: "m1", name: "Canon RF", sensorType: "FULL_FRAME" }],
    }));

    expect(html).toContain('aria-label="Actions pour Canon RF"');
    expect(html).toContain("OK");
    expect(html).toContain("Supprimer");
  });
});
