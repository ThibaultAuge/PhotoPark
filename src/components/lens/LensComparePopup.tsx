"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Lens, OptionGroup, OptionGroupMember } from "@/lib/lens/types";
import { LensCompareTable } from "@/components/lens/LensCompareTable";

interface LensComparePopupProps {
  lenses: Lens[];
  onClear: () => void;
  optionGroups?: OptionGroup[];
  optionGroupMembers?: OptionGroupMember[];
}

export function LensComparePopup({ lenses, onClear, optionGroups, optionGroupMembers }: LensComparePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const comparerBtnRef = useRef<HTMLButtonElement>(null);
  const fermerBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape and lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const comparerButton = comparerBtnRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Move focus to Fermer button when modal opens
    fermerBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      // Return focus to Comparer button when modal closes
      comparerButton?.focus();
    };
  }, [isOpen]);

  if (lenses.length === 0) return null;

  return (
    <>
      {/* Mini floating popup */}
      <aside className="compare-popup" role="status">
        <span className="compare-popup-count">
          <strong>{lenses.length}</strong>/5
        </span>
        <span className="compare-popup-labels">
          {lenses.map((lens) => lens.label).join(" · ")}
        </span>
        <button
          ref={comparerBtnRef}
          className="primary-button compare-popup-compare-btn"
          onClick={() => setIsOpen(true)}
        >
          Comparer
        </button>
        <button
          className="ghost-button compare-popup-clear-btn"
          onClick={onClear}
        >
          Vider
        </button>
      </aside>

      {/* Full comparison modal */}
      {isOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="modal-card compare-modal-card">
            <div className="modal-header">
              <h2>Comparaison</h2>
              <button
                ref={fermerBtnRef}
                className="ghost-button"
                onClick={() => setIsOpen(false)}
              >
                Fermer
              </button>
            </div>
            <LensCompareTable lenses={lenses} optionGroups={optionGroups} optionGroupMembers={optionGroupMembers} />
          </div>
        </div>
      )}
    </>
  );
}
