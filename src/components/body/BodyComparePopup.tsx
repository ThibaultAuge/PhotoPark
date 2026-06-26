"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Body } from "@/lib/body/types";
import { BodyCompareTable } from "@/components/body/BodyCompareTable";

export function BodyComparePopup({ bodies, onClear }: { bodies: Body[]; onClear: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const compareBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const compareButton = compareBtnRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      compareButton?.focus();
    };
  }, [isOpen]);

  if (bodies.length === 0) return null;

  return (
    <>
      <aside className="compare-popup" role="status">
        <span className="compare-popup-count"><strong>{bodies.length}</strong>/5</span>
        <span className="compare-popup-labels">{bodies.map((body) => body.label).join(" · ")}</span>
        <button ref={compareBtnRef} className="primary-button compare-popup-compare-btn" onClick={() => setIsOpen(true)}>Comparer</button>
        <button className="ghost-button compare-popup-clear-btn" onClick={onClear}>Vider</button>
      </aside>

      {isOpen ? (
        <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <div className="modal-card compare-modal-card">
            <div className="modal-header"><h2>Comparaison</h2><button ref={closeBtnRef} className="ghost-button" onClick={() => setIsOpen(false)}>Fermer</button></div>
            <BodyCompareTable bodies={bodies} />
          </div>
        </div>
      ) : null}
    </>
  );
}
