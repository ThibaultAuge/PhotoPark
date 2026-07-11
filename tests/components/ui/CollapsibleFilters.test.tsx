import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { CollapsibleFilters } from "../../../src/components/ui/CollapsibleFilters";

function findElements(
  node: ReactNode,
  predicate: (props: Record<string, unknown>, type: unknown) => boolean,
  results: Array<{ type: unknown; props: Record<string, unknown> }> = [],
): Array<{ type: unknown; props: Record<string, unknown> }> {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") return results;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, results);
    return results;
  }

  const element = node as { type: unknown; props: Record<string, unknown> };
  if ((typeof element.type === "string" || typeof element.type === "function") && predicate(element.props, element.type)) {
    results.push({ type: element.type, props: element.props });
  }
  if (typeof element.type === "function") {
    findElements((element.type as (props: Record<string, unknown>) => ReactNode)(element.props), predicate, results);
    return results;
  }
  if (element.props && "children" in element.props) {
    findElements(element.props.children as ReactNode, predicate, results);
  }
  return results;
}

describe("CollapsibleFilters", () => {
  /**
   * Verifies that the shared filters wrapper renders as a closed details panel
   */
  test("renders a closed details panel with filters title", () => {
    const html = renderToStaticMarkup(createElement(CollapsibleFilters, {
      onReset: vi.fn(),
      children: createElement("div", null, "Champ"),
    }));

    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("<summary");
    expect(html).toContain("Filtres");
    expect(html).toContain("Effacer les filtres");
    expect(html).toContain("Champ");
  });

  /**
   * Verifies that the shared clear filters button calls the provided reset handler
   */
  test("clear filters button calls onReset", () => {
    const onReset = vi.fn();
    const tree = CollapsibleFilters({
      onReset,
      children: createElement("div", null, "Champ"),
    });

    const resetButton = findElements(tree, (props, type) => type === "button" && props.type === "button")[0];

    expect(resetButton).toBeDefined();
    (resetButton.props.onClick as () => void)();

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
