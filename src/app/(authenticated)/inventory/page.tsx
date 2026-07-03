import { listLenses } from "@/lib/db/lens-repository";
import { listBodies } from "@/lib/db/body-repository";
import { listAccessories } from "@/lib/db/accessory-repository";
import { formatWeight } from "@/lib/lens/lens-utils";

type InventoryItem = {
  id: string;
  brand: string;
  label: string;
  weightG: number | null;
};

type InventorySection = {
  title: string;
  items: InventoryItem[];
  totalWeight: number;
  countWithoutWeight: number;
};

type InventoryGroup = {
  title: string;
  sections: InventorySection[];
  grandTotal: number;
  totalWithoutWeight: number;
};

type InventorySourceItem = {
  id: string;
  brand: string;
  label: string;
  weightG: number | null;
  isOwned: boolean;
  retired: boolean;
};

function computeGroup(
  title: string,
  predicate: (item: InventorySourceItem) => boolean,
  lenses: InventorySourceItem[],
  bodies: InventorySourceItem[],
  accessories: InventorySourceItem[],
): InventoryGroup {
  const rawSections: { title: string; items: InventoryItem[] }[] = [
    {
      title: "Objectifs possédés",
      items: lenses
        .filter(predicate)
        .map((l) => ({ id: l.id, brand: l.brand, label: l.label, weightG: l.weightG })),
    },
    {
      title: "Boîtiers possédés",
      items: bodies
        .filter(predicate)
        .map((b) => ({ id: b.id, brand: b.brand, label: b.label, weightG: b.weightG })),
    },
    {
      title: "Accessoires possédés",
      items: accessories
        .filter(predicate)
        .map((a) => ({ id: a.id, brand: a.brand, label: a.label, weightG: a.weightG })),
    },
  ];

  let grandTotal = 0;
  let totalWithoutWeight = 0;

  const sections: InventorySection[] = rawSections.map((raw) => {
    let totalWeight = 0;
    let countWithoutWeight = 0;

    for (const item of raw.items) {
      if (item.weightG !== null) {
        totalWeight += item.weightG;
      } else {
        countWithoutWeight++;
      }
    }

    grandTotal += totalWeight;
    totalWithoutWeight += countWithoutWeight;

    return { ...raw, totalWeight, countWithoutWeight };
  });

  return { title, sections, grandTotal, totalWithoutWeight };
}

export default async function InventoryPage() {
  const [lenses, bodies, accessories] = await Promise.all([
    Promise.resolve(listLenses()),
    Promise.resolve(listBodies()),
    Promise.resolve(listAccessories()),
  ]);

  const groups = [
    computeGroup(
      "Inventaire",
      (item) => item.isOwned && !item.retired,
      lenses,
      bodies,
      accessories,
    ),
    computeGroup(
      "Et en réserve",
      (item) => item.isOwned && item.retired,
      lenses,
      bodies,
      accessories,
    ),
  ];

  return (
    <div className="inventory-page">
      {groups.map((group, index) => (
        <div key={group.title} className="inventory-group">
          <div className={`section-title card inventory-group-title${index === 0 ? " inventory-group-title-primary" : ""}`}>
            <div>
              <p className="eyebrow">{index === 0 ? "Disponible" : "Retiré"}</p>
              <h2>{group.title}</h2>
            </div>
          </div>

          {group.sections.map((section) => (
            <section key={`${group.title}-${section.title}`} className="inventory-section card">
              <div className="inventory-section-header">
                <h3>{section.title}</h3>
                <span className="inventory-count">
                  {section.items.length} objet{section.items.length !== 1 ? "s" : ""}
                  {section.countWithoutWeight > 0 && (
                    <span className="inventory-no-weight-note">
                      {" · "}
                      {section.countWithoutWeight} sans poids
                    </span>
                  )}
                </span>
              </div>

              {section.items.length === 0 ? (
                <p className="empty-state">Aucun élément dans cette catégorie.</p>
              ) : (
                <>
                  <div className="inventory-table-wrapper table-card desktop-only">
                    <table>
                      <thead>
                        <tr>
                          <th>Marque</th>
                          <th>Libellé</th>
                          <th className="numeric-cell">Poids</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.brand}</td>
                            <td>{item.label}</td>
                            <td className="numeric-cell">
                              {item.weightG !== null ? formatWeight(item.weightG) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="inventory-subtotal-row">
                          <td colSpan={2}>Sous-total</td>
                          <td className="numeric-cell">
                            <strong>{formatWeight(section.totalWeight)}</strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mobile-cards">
                    {section.items.map((item) => (
                      <div key={item.id} className="inventory-card card">
                        <div className="inventory-card-brand">{item.brand}</div>
                        <div className="inventory-card-label">{item.label}</div>
                        <div className="inventory-card-weight numeric-value">
                          {item.weightG !== null ? formatWeight(item.weightG) : "—"}
                        </div>
                      </div>
                    ))}
                    <div className="inventory-card inventory-subtotal-card">
                      <span>Sous-total</span>
                      <strong className="numeric-value">{formatWeight(section.totalWeight)}</strong>
                    </div>
                  </div>
                </>
              )}
            </section>
          ))}

          <div className="inventory-grand-total-section">
            <div className="inventory-grand-total card">
              <span className="inventory-grand-total-label">Poids total estimé</span>
              <strong className="inventory-grand-total-value">
                {formatWeight(group.grandTotal)}
              </strong>
            </div>
            {group.totalWithoutWeight > 0 && (
              <p className="inventory-grand-total-note">
                {group.totalWithoutWeight} objet{group.totalWithoutWeight !== 1 ? "s" : ""} sans poids
                non comptabilisé{group.totalWithoutWeight !== 1 ? "s" : ""} dans le total.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
