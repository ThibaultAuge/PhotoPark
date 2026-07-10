"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ActionMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function closeAfterAction() {
    window.setTimeout(() => setOpen(false), 0);
  }

  useEffect(() => {
    if (!open) return;

    function updatePanelPosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = 160;
      const viewportPadding = 8;
      const left = Math.min(
        Math.max(viewportPadding, rect.right - panelWidth),
        window.innerWidth - panelWidth - viewportPadding,
      );

      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left,
        minWidth: panelWidth,
      });
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      const target = event.target;
      if (
        target instanceof Node
        && !rootRef.current.contains(target)
        && !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    updatePanelPosition();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  const panel = (
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      className="action-menu-panel"
      hidden={!open}
      style={open ? panelStyle : undefined}
      onClick={(event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest("button")) {
          closeAfterAction();
        }
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
    </div>
  );
}

export function ActionMenuButton({
  children,
  className = "",
  danger = false,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      role="menuitem"
      className={`action-menu-item${danger ? " action-menu-item-danger" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
