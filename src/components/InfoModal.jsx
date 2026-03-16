import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi";

export default function InfoModal({
  C,
  open,
  title,
  message,
  type = "info", // info | success | warning | error
  buttonText = "OK",
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tone = {
    info: {
      icon: <HiOutlineInformationCircle size={22} color={C?.primary || "#b91c1c"} />,
      bg: "rgba(185,28,28,0.10)",
      bd: "1px solid rgba(185,28,28,0.18)",
    },
    success: {
      icon: <HiOutlineCheckCircle size={22} color="#16a34a" />,
      bg: "rgba(22,163,74,0.10)",
      bd: "1px solid rgba(22,163,74,0.18)",
    },
    warning: {
      icon: <HiOutlineExclamationCircle size={22} color="#d97706" />,
      bg: "rgba(217,119,6,0.10)",
      bd: "1px solid rgba(217,119,6,0.18)",
    },
    error: {
      icon: <HiOutlineExclamationCircle size={22} color="#dc2626" />,
      bg: "rgba(220,38,38,0.10)",
      bd: "1px solid rgba(220,38,38,0.18)",
    },
  }[type] || {
    icon: <HiOutlineInformationCircle size={22} color={C?.primary || "#b91c1c"} />,
    bg: "rgba(185,28,28,0.10)",
    bd: "1px solid rgba(185,28,28,0.18)",
  };

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
    background: tone.bg,
    border: tone.bd,
    flexShrink: 0,
  };

  const closeBtn = {
    width: 36,
    height: 36,
    borderRadius: 14,
    border: `1px solid ${C?.border || "#e5e7eb"}`,
    background: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  };

  const t = {
    fontSize: 18,
    fontWeight: 980,
    color: C?.primaryDark || "#7f1d1d",
  };

  const msg = {
    fontSize: 13,
    fontWeight: 850,
    color: C?.muted || "#6b7280",
    lineHeight: 1.45,
  };

  const btnRow = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  };

  const okBtn = {
    padding: "10px 14px",
    borderRadius: 14,
    border: "none",
    background: C?.primary || "#b91c1c",
    color: "#fff",
    fontWeight: 980,
    cursor: "pointer",
    boxShadow: "0 14px 26px rgba(185,28,28,0.28)",
  };

  const node = (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={topRow}>
          <div style={left}>
            <div style={iconWrap}>{tone.icon}</div>
            <div style={t}>{title}</div>
          </div>

          <button type="button" style={closeBtn} onClick={onClose}>
            <HiOutlineX size={18} color="#6b7280" />
          </button>
        </div>

        <div style={msg}>{message}</div>

        <div style={btnRow}>
          <button type="button" style={okBtn} onClick={onClose}>
            {buttonText}
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

  return createPortal(node, document.body);
}