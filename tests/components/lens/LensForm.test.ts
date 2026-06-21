import { isValidElement, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { LensForm } from "../../../src/components/lens/LensForm";
import type { LensReferenceData } from "../../../src/lib/lens/types";

vi.mock("@/app/actions/lens-actions", () => ({
  createLensAction: vi.fn(),
  updateLensAction: vi.fn()
}));

type InputProps = {
  name?: string;
  type?: string;
  required?: boolean;
  children?: ReactNode;
};

function collectInputs(node: ReactNode, inputs: Record<string, InputProps> = {}) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectInputs(child, inputs));
    return inputs;
  }

  if (!isValidElement<InputProps>(node)) return inputs;

  if (typeof node.type === "function") {
    const renderComponent = node.type as (props: InputProps) => ReactNode;
    return collectInputs(renderComponent(node.props), inputs);
  }

  if (node.type === "input" && node.props.name) {
    inputs[node.props.name] = node.props;
  }

  collectInputs(node.props.children, inputs);
  return inputs;
}

const referenceData: LensReferenceData = {
  brands: [{ id: "11111111-1111-4111-8111-111111111111", name: "Canon" }],
  mounts: [{ id: "22222222-2222-4222-8222-222222222221", name: "RF", sensorType: "FULL_FRAME" }],
  options: []
};

describe("LensForm", () => {
  /**
   * Verifies that aperture fields allow decimal comma input in browsers
   */
  test("renders aperture inputs as text fields", () => {
    const inputs = collectInputs(LensForm({ title: "Objectif", referenceData, onClose: vi.fn() }));

    expect(inputs.maxApertureAtMinFocal?.type).toBe("text");
    expect(inputs.maxApertureAtMaxFocal?.type).toBe("text");
    expect(inputs.minAperture?.type).toBe("text");
  });

  /**
   * Verifies that max focal aperture is optional in the form
   */
  test("renders max focal aperture without required validation", () => {
    const inputs = collectInputs(LensForm({ title: "Objectif", referenceData, onClose: vi.fn() }));

    expect(inputs.maxApertureAtMinFocal?.required).toBe(true);
    expect(inputs.maxApertureAtMaxFocal?.required).toBeUndefined();
  });
});
