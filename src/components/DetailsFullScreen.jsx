import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";

export default function DetailsFullScreen({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // prevent background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "#f8fafc",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
  };

  const header = {
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: `
      radial-gradient(circle at 85% 20%, rgba(255,255,255,0.18), transparent 40%),
      linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #080404 100%)
    `,
    color: "#fff",
    boxShadow: "0 18px 40px rgba(0,0,0,.25)",
  };

  const left = {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const titleStyle = {
    fontWeight: 950,
    fontSize: 16,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "70vw",
  };

  const subStyle = {
    fontWeight: 800,
    fontSize: 12,
    opacity: 0.9,
  };

  const backBtn = {
    border: "1px solid rgba(255,255,255,.35)",
    background: "rgba(255,255,255,.12)",
    color: "#fff",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 950,
    whiteSpace: "nowrap",
  };

  const body = {
    flex: 1,
    overflowY: "auto",
    padding: 16,
  };

  return createPortal(
    <div style={overlay}>
      <div style={header}>
        <div style={left}>
          <div style={titleStyle}>{title || "Record Details"}</div>
          <div style={subStyle}>Press ESC to close</div>
        </div>

        <button style={backBtn} onClick={onClose}>
          <HiOutlineArrowLeft size={18} />
          Back
        </button>
      </div>

      <div style={body}>{children}</div>
    </div>,
    document.body
  );
}