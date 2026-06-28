"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveMountInterface, getMountedAssembly, getMountableAccessories } from "@/lib/accessory/filter-compatibility";
import { formatMountEndpoint, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { mountAccessoryOnLensAction, mountAccessoryOnAccessoryAction, unmountAccessoryAction } from "@/app/actions/accessory-actions";
import type { Accessory, AccessoryLensReference, AccessoryMountType } from "@/lib/accessory/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  adapter: { color: "#4a6fa5", label: "Adaptateur" },
  filter: { color: "#2a9d8f", label: "Filtre" },
  hood: { color: "#e9c46a", label: "Pare-soleil" },
  general: { color: "#6b7280", label: "Générique" },
} as const;

function getRoleConfig(accessory: Accessory) {
  return ROLE_CONFIG[accessory.filterRole] ?? ROLE_CONFIG.general;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function FilterAssemblyAssistant({ accessories, lenses }: { accessories: Accessory[]; lenses: AccessoryLensReference[] }) {
  const router = useRouter();
  const eligibleLenses = useMemo(
    () => lenses.filter((lens) => (lens.isOwned || lens.isFavorite || lens.isNextPurchase) && !lens.retired),
    [lenses],
  );
  const [lensId, setLensId] = useState(eligibleLenses[0]?.id ?? "");
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());
  const [slotExpanded, setSlotExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync lensId when eligibleLenses changes
  useEffect(() => {
    setLensId((prev) => (eligibleLenses.some((l) => l.id === prev) ? prev : eligibleLenses[0]?.id ?? ""));
  }, [eligibleLenses]);

  const lens = useMemo(() => eligibleLenses.find((item) => item.id === lensId) ?? null, [lensId, eligibleLenses]);

  const filterAccessories = useMemo(
    () => accessories.filter((acc) => isFilterAccessory(acc) && acc.isOwned && !acc.retired),
    [accessories],
  );

  // Current mounted chain for selected lens
  const mountedChain = useMemo(
    () => (lens ? getMountedAssembly(lens.id, filterAccessories) : []),
    [lens, filterAccessories],
  );

  // Active interface at the end of the chain
  const activeInterface = useMemo(
    () => (lens ? getActiveMountInterface(mountedChain, lens) : null),
    [lens, mountedChain],
  );

  // Accessories that can be mounted next
  const available = useMemo(
    () => (activeInterface ? getMountableAccessories(activeInterface, filterAccessories) : []),
    [activeInterface, filterAccessories],
  );

  // Reset slot when available changes
  useEffect(() => {
    if (available.length === 0) setSlotExpanded(false);
  }, [available]);

  async function handleMount(accessoryId: string) {
    if (!lens) return;
    setPendingOps((prev) => new Set(prev).add(accessoryId));
    setError(null);
    setSlotExpanded(false);
    try {
      let result;
      if (mountedChain.length === 0) {
        result = await mountAccessoryOnLensAction(accessoryId, lens.id);
      } else {
        const lastItem = mountedChain[mountedChain.length - 1];
        result = await mountAccessoryOnAccessoryAction(accessoryId, lastItem.id);
      }
      if (!result.success) {
        setError(result.error ?? "Échec du montage.");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setPendingOps((prev) => { const next = new Set(prev); next.delete(accessoryId); return next; });
    }
  }

  async function handleUnmount(accessoryId: string) {
    setPendingOps((prev) => new Set(prev).add(accessoryId));
    setError(null);
    try {
      const result = await unmountAccessoryAction(accessoryId);
      if (!result.success) {
        setError(result.error ?? "Échec du démontage.");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setPendingOps((prev) => { const next = new Set(prev); next.delete(accessoryId); return next; });
    }
  }

  return (
    <section className="card filter-assistant-card">
      <div className="toolbar">
        <div>
          <h2>Assistant de montage</h2>
          <p>Construis la pile de filtres et bagues par objectif.</p>
        </div>
      </div>

      <div className="filter-assistant-controls">
        <label>
          Objectif
          <select value={lensId} onChange={(e) => { setLensId(e.target.value); setSlotExpanded(false); setError(null); }}>
            {eligibleLenses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {error ? <div className="form-error" role="alert">{error}</div> : null}

      {!lens ? (
        <p className="empty-state">Aucun objectif éligible (possédé, favori ou à acheter, non retiré).</p>
      ) : lens.filterDiameterMm === null ? (
        <p className="empty-state">Cet objectif n&apos;a pas de diamètre de filtre renseigné.</p>
      ) : (
        <FilterStack
          lens={lens}
          mountedChain={mountedChain}
          available={available}
          slotExpanded={slotExpanded}
          setSlotExpanded={setSlotExpanded}
          pendingOps={pendingOps}
          onMount={handleMount}
          onUnmount={handleUnmount}
        />
      )}
    </section>
  );
}

// ─── Visual Subcomponents ───────────────────────────────────────────────────

function FilterStack({
  lens,
  mountedChain,
  available,
  slotExpanded,
  setSlotExpanded,
  pendingOps,
  onMount,
  onUnmount,
}: {
  lens: AccessoryLensReference;
  mountedChain: Accessory[];
  available: Accessory[];
  slotExpanded: boolean;
  setSlotExpanded: (v: boolean) => void;
  pendingOps: Set<string>;
  onMount: (id: string) => void;
  onUnmount: (id: string) => void;
}) {
  // Build the visual items from top to bottom
  const visualItems: React.ReactNode[] = [];

  // 1. Add slot at the very top
  visualItems.push(
    <AddSlot
      key="add-slot"
      expanded={slotExpanded}
      onToggle={() => setSlotExpanded(!slotExpanded)}
      available={available}
      pendingOps={pendingOps}
      onMount={onMount}
    />,
  );

  if (mountedChain.length === 0) {
    // Nothing mounted: show connector from lens to available
    visualItems.push(
      <ConnectorLine key="conn-lens-avail" mountType="threaded" label="Diamètre du filetage" />,
    );
  } else {
    // Show the front interface of the last mounted item (what's available at the end)
    const last = mountedChain[mountedChain.length - 1];
    visualItems.push(
      <ConnectorLine
        key="conn-top"
        mountType={last.frontMountType}
        label={last.frontMountType !== "none" ? `Sortie ${formatMountEndpoint(last.frontMountType, last.frontDiameterMm)}` : undefined}
      />,
    );

    // Show mounted chain in reverse (top to bottom)
    for (let i = mountedChain.length - 1; i >= 0; i--) {
      const acc = mountedChain[i];
      const isFirstOnLens = i === 0; // first in array = closest to lens

      visualItems.push(
        <AccessoryBlock key={acc.id} accessory={acc} onUnmount={onUnmount} isPending={pendingOps.has(acc.id)} />,
      );

      // Connector to the next item below (or to the lens)
      const connectorMountType = acc.rearMountType;
      // For the first piece on the lens, show "Filetage ⌀52 mm" label, otherwise show generic
      const connLabel = isFirstOnLens
        ? `Filetage ${formatMountEndpoint(acc.rearMountType, acc.rearDiameterMm)}`
        : undefined;
      visualItems.push(
        <ConnectorLine key={`conn-${acc.id}`} mountType={connectorMountType} label={connLabel} />,
      );
    }
  }

  // 3. Lens block at the bottom
  visualItems.push(<LensBlock key="lens" lens={lens} />);

  return <div className="filter-stack">{visualItems}</div>;
}

// ─── Block Components ───────────────────────────────────────────────────────

function LensBlock({ lens }: { lens: Pick<AccessoryLensReference, "label" | "filterDiameterMm"> }) {
  return (
    <div className="filter-stack-block filter-stack-block--lens">
      <div className="filter-stack-block-body">
        <span className="filter-stack-block-name">{lens.label}</span>
        {lens.filterDiameterMm !== null ? (
          <span className="filter-stack-diameter">
            {formatMountEndpoint("threaded", lens.filterDiameterMm)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AccessoryBlock({
  accessory,
  onUnmount,
  isPending,
}: {
  accessory: Accessory;
  onUnmount: (id: string) => void;
  isPending: boolean;
}) {
  const { color, label: roleLabel } = getRoleConfig(accessory);
  return (
    <div className="filter-stack-block" style={{ "--role-color": color } as React.CSSProperties}>
      {isPending ? <span className="filter-stack-spinner" /> : null}
      <button
        className="filter-stack-remove-btn"
        onClick={() => onUnmount(accessory.id)}
        disabled={isPending}
        title="Démonter cette pièce et toutes celles montées après"
        aria-label={`Démonter ${accessory.label}`}
      >
        ×
      </button>
      <div className="filter-stack-block-body">
        <div className="filter-stack-block-header">
          <span className="filter-stack-block-name">{accessory.label}</span>
          <span className="filter-stack-role-badge" style={{ background: color }}>
            {roleLabel}
          </span>
        </div>
        <div className="filter-stack-block-interfaces">
          <span className="filter-stack-interface">
            {formatMountEndpoint(accessory.rearMountType, accessory.rearDiameterMm)}
          </span>
          <span className="filter-stack-arrow">→</span>
          <span className="filter-stack-interface">
            {formatMountEndpoint(accessory.frontMountType, accessory.frontDiameterMm)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConnectorLine({ mountType, label }: { mountType: AccessoryMountType | "none"; label?: string }) {
  if (mountType === "none") {
    return <div className="filter-stack-spacer" />;
  }
  const isThreaded = mountType === "threaded";
  return (
    <div className={`filter-stack-connector ${isThreaded ? "filter-stack-connector--threaded" : "filter-stack-connector--magnetic"}`}>
      <span className="filter-stack-connector-label">
        {label ?? (isThreaded ? "Fileté" : "Magnétique")}
      </span>
    </div>
  );
}

function AddSlot({
  expanded,
  onToggle,
  available,
  pendingOps,
  onMount,
}: {
  expanded: boolean;
  onToggle: () => void;
  available: Accessory[];
  pendingOps: Set<string>;
  onMount: (id: string) => void;
}) {
  if (expanded) {
    return (
      <div className="filter-stack-slot filter-stack-slot--open">
        <div className="filter-stack-slot-header">
          <strong>Pièces compatibles</strong>
          <button className="ghost-button" onClick={onToggle}>Fermer</button>
        </div>
        {available.length === 0 ? (
          <p className="filter-stack-empty-text">Aucune pièce compatible disponible dans l&apos;inventaire.</p>
        ) : (
          <ul className="filter-stack-add-list">
            {available.map((acc) => (
              <li key={acc.id} className="filter-stack-add-item">
                <div className="filter-stack-add-info">
                  <span className="filter-stack-add-name">{acc.label}</span>
                  <span className="filter-stack-add-interface">
                    {formatMountEndpoint(acc.rearMountType, acc.rearDiameterMm)}
                    {" → "}
                    {formatMountEndpoint(acc.frontMountType, acc.frontDiameterMm)}
                  </span>
                </div>
                <button
                  className="primary-button"
                  onClick={() => onMount(acc.id)}
                  disabled={pendingOps.has(acc.id)}
                >
                  {pendingOps.has(acc.id) ? "Montage..." : "Monter"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Collapsed state
  if (available.length === 0) {
    return (
      <div className="filter-stack-slot filter-stack-slot--empty">
        <span className="filter-stack-slot-empty-text">Aucune pièce compatible disponible</span>
      </div>
    );
  }

  return (
    <button className="filter-stack-slot" onClick={onToggle} aria-label="Ajouter un élément à la pile">
      <span className="filter-stack-slot-icon">+</span>
      <span className="filter-stack-slot-text">Ajouter un élément...</span>
      <span className="filter-stack-slot-count">{available.length} disponible{available.length > 1 ? "s" : ""}</span>
    </button>
  );
}
