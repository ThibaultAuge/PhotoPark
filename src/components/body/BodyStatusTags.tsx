import React from "react";
import type { Body } from "@/lib/body/types";

export function BodyStatusTags({ body }: { body: Body }) {
  return <span className="tag-list">{body.isOwned ? <span className="tag owned">Possédé</span> : null}{body.retired ? <span className="tag retired">Retiré</span> : null}{body.isFavorite ? <span className="tag favorite">Favori</span> : null}{body.isNextPurchase ? <span className="tag next">À acheter</span> : null}</span>;
}
