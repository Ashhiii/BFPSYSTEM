import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { HiOutlineX, HiOutlineExclamationCircle } from "react-icons/hi";

export default function ConfirmModal({
  C,
  open,
  title,
  message,
  icon, // optional React node
  cancelText = "Cancel",
  confirmText = "Confirm",
  danger = false, // true = red confirm
  busy = false,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onCancel?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999999,
    padding: 16,
  };

  const modal = {
    width: "min(440px, 100%)",
    background: "rgba(255,255,255,0.90)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 30px 90px rgba(2,6,23,0.35)",
    border: `1px solid ${C?.border || "rgba(0,0,0,0.08)"}`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    animation: "popIn .16s ease",
  };

  const topRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const left = { display: "flex", alignItems: "center", gap: 10 };

  const iconWrap = {
    width: 38,
    height: 38,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(185,28,28,0.10)",
    border: "1px solid rgba(185,28,28,0.18)",
    flexShrink: 0,
  };

  const closeBtn = {
    width: 36,
    height: 36,
    borderRadius: 14,
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "rgba(255,255,255,0.95)",
    cursor: busy ? "not-allowed" : "pointer",
    display: "grid",
    placeItems: "center",
    opacity: busy ? 0.7 : 1,
  };

  const t = { fontSize: 18, fontWeight: 980, color: C?.primaryDark || "#7f1d1d" };

  const msg = { fontSize: 13, fontWeight: 850, color: C?.muted || "#6b7280", lineHeight: 1.4 };

  const btnRow = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 };

  const cancelBtn = {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "rgba(255,255,255,0.95)",
    fontWeight: 950,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.7 : 1,
  };

  const confirmBtn = {
    padding: "10px 14px",
    borderRadius: 14,
    border: "none",
    background: danger ? (C?.primary || "#b91c1c") : (C?.primary || "#b91c1c"),
    color: "#fff",
    fontWeight: 980,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.85 : 1,
    boxShadow: danger
      ? "0 14px 26px rgba(185,28,28,0.28)"
      : "0 14px 26px rgba(2,6,23,0.18)",
  };

  const node = (
    <div style={overlay} onClick={() => !busy && onCancel?.()}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={topRow}>
          <div style={left}>
            <div style={iconWrap}>
              {icon || <HiOutlineExclamationCircle size={22} color={C?.primary || "#b91c1c"} />}
            </div>
            <div style={t}>{title}</div>
          </div>
        </div>

        <div style={msg}>{message}</div>

        <div style={btnRow}>
          <button style={cancelBtn} onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>

          <button style={confirmBtn} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait..." : confirmText}
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

  // ✅ PORTAL = dili matabunan
  return createPortal(node, document.body);
}