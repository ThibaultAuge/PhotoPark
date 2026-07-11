"use client";

import React from "react";

export function CollapsibleFilters({
  children,
  onReset,
  title = "Filtres",
}: {
  children: React.ReactNode;
  onReset: () => void;
  title?: string;
}) {
  return (
    <details className="card filters-panel">
      <summary className="filters-toggle">
        <span>{title}</span>
        <span className="filters-toggle-icon" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="filters-panel-body">
        <div className="filters">{children}</div>
        <div className="filters-panel-actions">
          <button className="ghost-button" type="button" onClick={onReset}>
            Effacer les filtres
          </button>
        </div>
      </div>
    </details>
  );
}
