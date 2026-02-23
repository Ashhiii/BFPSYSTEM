import React, { useMemo, useState } from "react";
import RecordsManager from "./RecordsManager";
import RenewedManager from "./RenewedManager";

/* 🔥 BFP COLOR PALETTE */
const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  accent: "#f59e0b",
  bg: "#ffffff",
  softBg: "#fef2f2",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  danger: "#dc2626",
};

export default function FileManagement({ refresh, setRefresh }) {
  const [tab, setTab] = useState("records"); // records | renewed

  const shell = {
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
  };

  const header = {
    borderRadius: 24,
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: "#fff",
    background: `
      radial-gradient(circle at 85% 20%, rgba(255,255,255,0.18), transparent 40%),
      linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #080404 100%)
    `,
    boxShadow: "0 20px 40px rgba(0,0,0,.25)",
  };

  const title = {
    fontSize: 18,
    fontWeight: 950,
    color: C.bg,
    letterSpacing: 0.2,
  };

  const subtitle = {
    fontSize: 12,
    fontWeight: 800,
    color: C.bg,
    marginTop: 6,
  };

  const pillGroup = {
    display: "flex",
    gap: 8,
    padding: 6,
    borderRadius: 999,
    background: "rgba(245, 204, 204, 0.75)",
    border: `1px solid ${C.border}`,
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  };

  const tabPill = (active) => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? "rgba(185,28,28,0.55)" : "transparent"}`,
    background: active ? C.primary : "transparent",
    color: active ? "#fff" : C.text,
    cursor: "pointer",
    fontWeight: 950,
    transition: "0.15s ease",
    boxShadow: active ? "0 10px 18px rgba(185,28,28,0.25)" : "none",
  });

  const shared = useMemo(() => ({ C, refresh, setRefresh }), [refresh, setRefresh]);

  return (
    <div style={shell}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <div style={title}>File Management</div>
          <div style={subtitle}>
            Archive / delete files
            <span style={{ marginLeft: 8, fontWeight: 950, color: C.accent }}>
              {tab === "records" ? "• Records" : "• Renewed"}
            </span>
          </div>
        </div>

        <div style={pillGroup}>
          <button style={tabPill(tab === "records")} onClick={() => setTab("records")}>
            📄 Records
          </button>
          <button style={tabPill(tab === "renewed")} onClick={() => setTab("renewed")}>
            ♻️ Renewed
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ marginTop: 12 }}>
        {tab === "records" ? (
          <RecordsManager {...shared} />
        ) : (
          <RenewedManager {...shared} />
        )}
      </div>
    </div>
  );
}