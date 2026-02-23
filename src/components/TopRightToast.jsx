// src/components/TopRightToast.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { HiOutlineCheckCircle, HiOutlineX } from "react-icons/hi";

export default function TopRightToast({
  C,
  open,
  title = "Added to Records",
  message = "Record saved successfully.",
  autoCloseMs = 1800,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    let t = null;
    if (autoCloseMs && autoCloseMs > 0) {
      t = setTimeout(() => onClose?.(), autoCloseMs);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (t) clearTimeout(t);
    };
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  const wrap = {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 9999999,
    width: "min(360px, calc(100vw - 32px))",
    animation: "slideIn .18s ease",
  };

  const card = {
    background: "rgba(255,255,255,0.90)",
    border: `1px solid ${C?.border || "rgba(0,0,0,0.08)"}`,
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  };

  const iconWrap = {
    width: 36,
    height: 36,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(22,163,74,0.10)",
    border: "1px solid rgba(22,163,74,0.18)",
    flexShrink: 0,
    marginTop: 1,
  };

  const titleStyle = {
    fontSize: 13,
    fontWeight: 980,
    color: C?.text || "#0f172a",
    lineHeight: 1.1,
  };

  const msgStyle = {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 850,
    color: C?.muted || "#64748b",
    lineHeight: 1.35,
  };

  const closeBtn = {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 12,
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  };

  const node = (
    <div style={wrap}>
      <div style={card}>
        <div style={iconWrap}>
          <HiOutlineCheckCircle size={20} color="#16a34a" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={titleStyle}>{title} ✅</div>
          <div style={msgStyle}>{message}</div>
        </div>

        <button style={closeBtn} onClick={onClose} aria-label="Close toast">
          <HiOutlineX size={16} color={C?.muted || "#64748b"} />
        </button>

        <style>{`
          @keyframes slideIn {
            from { transform: translateY(-8px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}