import React from "react";
import type { Accessory } from "@/lib/accessory/types";

export function AccessoryStatusTags({ accessory }: { accessory: Accessory }) {
  return <span className="tag-list">{accessory.isOwned ? <span className="tag owned">Possédé</span> : null}{accessory.retired ? <span className="tag retired">Retiré</span> : null}{accessory.isFavorite ? <span className="tag favorite">Favori</span> : null}{accessory.isNextPurchase ? <span className="tag next">À acheter</span> : null}</span>;
}
