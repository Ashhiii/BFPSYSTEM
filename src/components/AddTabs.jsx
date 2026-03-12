import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRecord = location.pathname === "/app/add-record";
  const isClearance = location.pathname === "/app/add-clearance";

  const styles = {
    tabsWrap: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14,
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: "#fff",
      paddingBottom: 10,
    },
    tabBtn: (active) => ({
      padding: "10px 14px",
      borderRadius: 12,
      border: active ? "1px solid #f59e0b" : "1px solid #d1d5db",
      background: active ? "#f59e0b" : "#fff",
      color: active ? "#111827" : "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: active ? "0 8px 18px rgba(245,158,11,0.22)" : "none",
      transition: "all 0.2s ease",
    }),
  };

  return (
    <div style={styles.tabsWrap}>
      <button
        type="button"
        onClick={() => navigate("/app/add-record")}
        style={styles.tabBtn(isRecord)}
      >
        Add Record
      </button>

      <button
        type="button"
        onClick={() => navigate("/app/add-clearance")}
        style={styles.tabBtn(isClearance)}
      >
        Add Clearance
      </button>
    </div>
  );
}