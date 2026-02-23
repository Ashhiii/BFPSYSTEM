// src/pages/ImportPage/ImportPage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ✅ adjust this path if different
import ImportExcelFullScreen from "../ImportExcel/ImportExcel.jsx";

export default function ImportPage({ setRefresh }) {
  const navigate = useNavigate();

  const C = useMemo(
    () => ({
      primaryDark: "#7f1d1d",
      softBg: "#fef2f2",
      border: "#e5e7eb",
      text: "#111827",
      muted: "#6b7280",
    }),
    []
  );

  const page = {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
    background: "#fff",
  };

  const header = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.softBg,
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  };

  const hTitle = { fontSize: 18, fontWeight: 950, color: C.primaryDark };
  const hSub = { fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 6 };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 950,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    whiteSpace: "nowrap",
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={hTitle}>Import Excel</div>
          <div style={hSub}>Import rows into Firestore: records</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn} onClick={() => navigate("/app/dashboard")}>← Dashboard</button>
          <button style={btn} onClick={() => navigate("/app/records")}>🔎 Records</button>
        </div>
      </div>

      <ImportExcelFullScreen
        setRefresh={(fn) => {
          setRefresh(fn);
          // ✅ after import -> go to Records to see new rows
          navigate("/app/records");
        }}
        onClose={() => navigate("/app/dashboard")}
      />
    </div>
  );
}