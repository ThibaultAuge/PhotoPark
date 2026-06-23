import type { Lens } from "./types";

export const CHART_PALETTE = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
];
export const DEFAULT_CHART_COLOR = CHART_PALETTE[0];

export function buildStableLensColorMap(lenses: Pick<Lens, "id">[]) {
  return Object.fromEntries(
    lenses.map((lens, index) => [
      lens.id,
      CHART_PALETTE[index % CHART_PALETTE.length],
    ]),
  );
}

export function getContrastTextColor(hexColor: string) {
  const sanitized = hexColor.replace("#", "");
  const normalized = sanitized.length === 3
    ? sanitized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : sanitized;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "#111827";
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 160 ? "#111827" : "#ffffff";
}
