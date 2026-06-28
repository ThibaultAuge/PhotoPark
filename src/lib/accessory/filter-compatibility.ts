import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";
import { getAccessoryActiveLocation, isFilterAccessory } from "@/lib/accessory/accessory-utils";

/** Maximum depth for chain exploration in the DFS search. */
const MAX_CHAIN_DEPTH = 5;

/** Represents a mount interface (type + diameter). */
export type MountInterface = {
  mountType: Accessory["rearMountType"];
  diameterMm: number | null;
};

export type AccessoryAssemblySuggestion = {
  accessoryIds: string[];
  labels: string[];
  requiresMovingMountedPart: boolean;
  reason: string;
};

export type LensAccessoryCompatibility = {
  mounted: Accessory[];
  available: AccessoryAssemblySuggestion[];
  moveRequired: AccessoryAssemblySuggestion[];
  blockedReason: string | null;
};

/**
 * Returns the active mount interface at the end of a mounted chain.
 * - If nothing is mounted: the lens's filter thread (threaded, filterDiameterMm)
 * - If items are mounted: the last item's front interface
 * Returns null if the lens has no filter diameter and nothing is mounted,
 * or if the last mounted item has frontMountType === "none".
 */
export function getActiveMountInterface(mountedChain: Accessory[], lens: Pick<AccessoryLensReference, "filterDiameterMm">): MountInterface | null {
  if (mountedChain.length > 0) {
    const last = mountedChain[mountedChain.length - 1];
    if (last.frontMountType === "none") return null;
    return { mountType: last.frontMountType, diameterMm: last.frontDiameterMm };
  }
  if (lens.filterDiameterMm === null) return null;
  return { mountType: "threaded", diameterMm: lens.filterDiameterMm };
}

/**
 * Returns accessories that can be mounted directly on the given mount interface.
 * Filters for: filter category, owned, not retired, not already mounted,
 * and matching rear interface (type + diameter).
 */
export function getMountableAccessories(mountInterface: MountInterface | null, accessories: Accessory[]): Accessory[] {
  if (!mountInterface || mountInterface.mountType === "none") return [];

  return accessories.filter((acc) => {
    if (!isFilterAccessory(acc)) return false;
    if (!acc.isOwned) return false;
    if (acc.retired) return false;
    // Already mounted somewhere (on a lens or on another accessory)
    if (acc.mountedOnLensId || acc.mountedOnAccessoryId) return false;
    if (!matchesMount(mountInterface, acc)) return false;
    return true;
  });
}

/** Checks whether an accessory's rear interface matches a given mount interface. */
export function matchesMount(mount: MountInterface, accessory: { rearMountType: Accessory["rearMountType"]; rearDiameterMm: number | null }): boolean {
  if (accessory.rearMountType !== mount.mountType) return false;
  if (mount.mountType === "none") return false;
  return accessory.rearDiameterMm === mount.diameterMm;
}

/**
 * Returns the full compatibility report for a lens.
 *
 * Fixed classification logic:
 * - `mounted` — items already mounted on this lens (current chain)
 * - `available` — chains that can be built WITHOUT moving any accessory (items
 *   already on this lens's chain can be extended; items mounted elsewhere
 *   require moving and go to `moveRequired`)
 * - `moveRequired` — chains that include items mounted on a DIFFERENT lens/chain
 */
export function getLensAccessoryCompatibility(lens: AccessoryLensReference, accessories: Accessory[]): LensAccessoryCompatibility {
  if (lens.filterDiameterMm === null) {
    return { mounted: [], available: [], moveRequired: [], blockedReason: "Cet objectif n'a pas de diamètre de filtre renseigné." };
  }

  const filterAccessories = accessories.filter((accessory) => isFilterAccessory(accessory) && accessory.isOwned && !accessory.retired);
  const mounted = getMountedAssembly(lens.id, filterAccessories);
  const currentMountedIds = new Set(mounted.map((item) => item.id));

  // Use exploreChains for all possible mounting chains
  const allSuggestions = exploreChains(lens, filterAccessories);

  const available: AccessoryAssemblySuggestion[] = [];
  const moveRequired: AccessoryAssemblySuggestion[] = [];

  for (const suggestion of allSuggestions) {
    // A chain requires moving if it includes items mounted on ANOTHER lens/chain
    // Items that are part of THIS lens's mounted chain don't require moving
    // (they're already in place, you can just add more on top)
    const hasMountedElsewhere = suggestion.accessoryIds.some((id) => {
      if (currentMountedIds.has(id)) return false; // part of this lens's chain — fine
      const acc = accessories.find((a) => a.id === id);
      if (!acc) return false;
      return getAccessoryActiveLocation(acc) === "mounted";
    });

    if (hasMountedElsewhere) {
      moveRequired.push(suggestion);
    } else {
      available.push(suggestion);
    }
  }

  return {
    mounted,
    available,
    moveRequired,
    blockedReason: available.length === 0 && moveRequired.length === 0 && mounted.length === 0 ? "Aucun montage compatible disponible avec l'inventaire actuel." : null,
  };
}

/**
 * Retrieves the chain of accessories already mounted on a lens.
 * Walks the mountedOnAccessoryId chain starting from the piece directly on the lens.
 */
export function getMountedAssembly(lensId: string, accessories: Accessory[]) {
  const byParent = new Map<string, Accessory>();
  let root: Accessory | null = null;

  for (const accessory of accessories) {
    if (accessory.mountedOnLensId === lensId) root = accessory;
    if (accessory.mountedOnAccessoryId) byParent.set(accessory.mountedOnAccessoryId, accessory);
  }

  const chain: Accessory[] = [];
  const visited = new Set<string>();
  let current = root;
  while (current && !visited.has(current.id)) {
    chain.push(current);
    visited.add(current.id);
    current = byParent.get(current.id) ?? null;
  }

  return chain;
}

/**
 * Explores all possible mounting chains starting from the lens.
 * Used internally for the `moveRequired` report.
 */
function exploreChains(lens: AccessoryLensReference, accessories: Accessory[]) {
  const rootMount: MountInterface = { mountType: "threaded", diameterMm: lens.filterDiameterMm };
  const chains = new Map<string, AccessoryAssemblySuggestion>();

  search(accessories, rootMount, [], chains, new Set(), MAX_CHAIN_DEPTH);

  return [...chains.values()].sort((a, b) => a.labels.length - b.labels.length || a.labels.join(" ").localeCompare(b.labels.join(" ")));
}

function search(accessories: Accessory[], mount: MountInterface, chain: Accessory[], chains: Map<string, AccessoryAssemblySuggestion>, visited: Set<string>, depthLeft: number) {
  if (depthLeft === 0) return;

  for (const accessory of accessories) {
    if (visited.has(accessory.id)) continue;
    if (!matchesMount(mount, accessory)) continue;
    const nextChain = [...chain, accessory];
    const key = nextChain.map((item) => item.id).join("> ");
    chains.set(key, {
      accessoryIds: nextChain.map((item) => item.id),
      labels: nextChain.map((item) => item.label),
      requiresMovingMountedPart: nextChain.some((item) => getAccessoryActiveLocation(item) === "mounted"),
      reason: nextChain.some((item) => getAccessoryActiveLocation(item) === "mounted") ? "Nécessite de démonter au moins une pièce déjà montée." : "Montage possible immédiatement.",
    });

    // Clone visited for this branch so siblings can reuse the same accessories
    const nextVisited = new Set(visited);
    nextVisited.add(accessory.id);
    const front: MountInterface = { mountType: accessory.frontMountType, diameterMm: accessory.frontDiameterMm };
    if (front.mountType !== "none") search(accessories, front, nextChain, chains, nextVisited, depthLeft - 1);
  }
}
