import type { Lens } from "@/lib/lens/types";

export function LensStatusTags({ lens }: { lens: Lens }) {
  return <span className="tag-list">{lens.isOwned ? <span className="tag owned">Possédé</span> : null}{lens.isFavorite ? <span className="tag favorite">Favori</span> : null}{lens.isNextPurchase ? <span className="tag next">Prochain achat</span> : null}</span>;
}
