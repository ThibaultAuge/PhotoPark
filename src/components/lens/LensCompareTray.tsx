import type { Lens } from "@/lib/lens/types";

export function LensCompareTray({ lenses, onClear }: { lenses: Lens[]; onClear: () => void }) {
  if (lenses.length === 0) return null;
  return <aside className="compare-tray"><strong>{lenses.length}/5 sélectionné(s)</strong><span>{lenses.map((lens) => lens.label).join(" · ")}</span><button onClick={onClear}>Vider</button></aside>;
}
