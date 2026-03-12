import React, { useState } from "react";
import AddRecord from "../../components/AddRecords";
import AddClearance from "../../components/AddClearance";

const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
};

export default function AddRecordsPage({ setRefresh }) {
  const [activeTab, setActiveTab] = useState("record"); // record | clearance

  const page = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: "100%",
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

  const tabsWrap = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  };

  const tabBtn = (active) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: active ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,.25)",
    background: active ? C.gold : "rgba(255,255,255,.08)",
    color: active ? "#111827" : "#fff",
    fontWeight: 900,
    cursor: "pointer",
  });

  const bodyCard = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 12,
    overflow: "auto",
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: C.bg }}>
            Records and Clearances
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.bg, marginTop: 6 }}>
            Separate forms but connected in one page
          </div>
        </div>

        <div style={tabsWrap}>
          <button
            onClick={() => setActiveTab("record")}
            style={tabBtn(activeTab === "record")}
          >
            Add Record
          </button>

          <button
            onClick={() => setActiveTab("clearance")}
            style={tabBtn(activeTab === "clearance")}
          >
            Add Clearance
          </button>
        </div>
      </div>

      <div style={bodyCard}>
        {activeTab === "record" ? (
          <AddRecord setRefresh={setRefresh} />
        ) : (
          <AddClearance
            onSaved={() => {
              setActiveTab("record");
            }}
            onCancel={() => {
              setActiveTab("record");
            }}
          />
        )}
      </div>
    </div>
  );
}