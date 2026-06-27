import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";
import { getAccessoryActiveLocation, isFilterAccessory } from "@/lib/accessory/accessory-utils";

type MountInterface = {
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

export function getLensAccessoryCompatibility(lens: AccessoryLensReference, accessories: Accessory[]): LensAccessoryCompatibility {
  if (lens.filterDiameterMm === null) {
    return { mounted: [], available: [], moveRequired: [], blockedReason: "Cet objectif n'a pas de diamètre de filtre renseigné." };
  }

  const filterAccessories = accessories.filter((accessory) => isFilterAccessory(accessory) && accessory.isOwned && !accessory.retired);
  const mounted = getMountedAssembly(lens.id, filterAccessories);
  const suggestions = exploreChains(lens, filterAccessories);

  return {
    mounted,
    available: suggestions.filter((suggestion) => !suggestion.requiresMovingMountedPart),
    moveRequired: suggestions.filter((suggestion) => suggestion.requiresMovingMountedPart),
    blockedReason: suggestions.length === 0 ? "Aucun montage compatible disponible avec l'inventaire actuel." : null,
  };
}

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

function exploreChains(lens: AccessoryLensReference, accessories: Accessory[]) {
  const rootMount: MountInterface = { mountType: "threaded", diameterMm: lens.filterDiameterMm };
  const chains = new Map<string, AccessoryAssemblySuggestion>();

  search(accessories, rootMount, [], chains, new Set(), 5);

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

    visited.add(accessory.id);
    const front: MountInterface = { mountType: accessory.frontMountType, diameterMm: accessory.frontDiameterMm };
    if (front.mountType !== "none") search(accessories, front, nextChain, chains, visited, depthLeft - 1);
    visited.delete(accessory.id);
  }
}

function matchesMount(mount: MountInterface, accessory: Accessory) {
  if (accessory.rearMountType !== mount.mountType) return false;
  if (mount.mountType === "none") return false;
  return accessory.rearDiameterMm === mount.diameterMm;
}
