import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { HiOutlineExclamationCircle, HiOutlineX } from "react-icons/hi";

export default function lockConfirmModal({ C, exporting, onCancel, onConfirm }) {
  // ✅ ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 2000000, // ✅ always above cards/backdrop filters
    background: "rgba(2,6,23,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
  };

  const modal = {
    width: "min(420px, 92vw)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.92)",
    border: `1px solid ${C?.border || "rgba(0,0,0,0.08)"}`,
    boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
    overflow: "hidden",
    transform: "translateY(0)",
    animation: "popIn .16s ease",
  };

  const head = {
    padding: 16,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: `1px solid ${C?.border || "rgba(0,0,0,0.08)"}`,
    background:
      "linear-gradient(135deg, rgba(185,28,28,0.10), rgba(255,255,255,0.0))",
  };

  const iconWrap = {
    width: 40,
    height: 40,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(185,28,28,0.12)",
    border: `1px solid rgba(185,28,28,0.18)`,
    flexShrink: 0,
  };

  const title = { fontWeight: 950, fontSize: 16, color: C?.primaryDark || "#7f1d1d" };
  const desc = { marginTop: 4, fontSize: 12, fontWeight: 800, color: C?.muted || "#6b7280" };

  const xBtn = {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "#fff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  };

  const body = { padding: 16 };
  const note = { fontSize: 13, fontWeight: 800, color: "#111827", lineHeight: 1.35 };

  const foot = {
    padding: 16,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    borderTop: `1px solid ${C?.border || "rgba(0,0,0,0.08)"}`,
    background: "rgba(255,255,255,0.75)",
  };

  const btnBase = {
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 950,
    fontSize: 13,
    cursor: "pointer",
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "#fff",
  };

  const btnCancel = { ...btnBase, color: "#111827" };
  const btnConfirm = {
    ...btnBase,
    border: `1px solid ${C?.primary || "#b91c1c"}`,
    background: C?.primary || "#b91c1c",
    color: "#fff",
    opacity: exporting ? 0.75 : 1,
  };

  const ui = (
    <div style={overlay} onClick={onCancel}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={iconWrap}>
              <HiOutlineExclamationCircle size={22} color={C?.primary || "#b91c1c"} />
            </div>
            <div>
              <div style={title}>Export Excel</div>
              <div style={desc}>Download ALL current records</div>
            </div>
          </div>

          <button style={xBtn} onClick={onCancel} aria-label="Close">
            <HiOutlineX />
          </button>
        </div>

        <div style={body}>
          <div style={note}>
            Are you sure you want to export the current records to Excel?
          </div>
        </div>

        <div style={foot}>
          <button style={btnCancel} onClick={onCancel} disabled={exporting}>
            Cancel
          </button>
          <button style={btnConfirm} onClick={onConfirm} disabled={exporting}>
            {exporting ? "Exporting..." : "Yes, Export"}
          </button>
        </div>

        <style>{`
          @keyframes popIn {
            from { transform: translateY(8px) scale(.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );

  // ✅ Portal to body = dili na siya matabunan sa dashboard cards
  return createPortal(ui, document.body);
}