import React, { useEffect, useMemo, useState } from "react";
import AddDocument from "./AddDocuments.jsx";
import DocumentsTable from "./DocumentsTable.jsx";

/* 🔥 BFP COLORS */
const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  softBg: "#fef2f2",
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
};

export default function Documents({ refresh, setRefresh }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [tab, setTab] = useState("view"); // view | add
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");

  const fetchDocs = async () => {
    const res = await fetch(`${API}/documents`);
    const data = await res.json();
    setDocs(data || []);
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    return (docs || []).filter((d) => {
      return (
        (d.ownerName || "").toLowerCase().includes(key) ||
        (d.establishmentName || "").toLowerCase().includes(key) ||
        (d.fsicAppNo || "").toLowerCase().includes(key)
      );
    });
  }, [docs, search]);

  const tabBtn = (active) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? C.primary : "#fff",
    color: active ? "#fff" : C.text,
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          background: C.softBg,
          border: `1px solid ${C.primary}`,
          borderRadius: 18,
          padding: 14,
          boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: C.primaryDark }}>
            Documents
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 6 }}>
            View and generate document PDFs
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "view")} onClick={() => setTab("view")}>
            View Documents
          </button>
          <button style={tabBtn(tab === "add")} onClick={() => setTab("add")}>
            Add Document
          </button>
        </div>
      </div>

      {/* ADD DOCUMENT */}
      {tab === "add" && (
        <AddDocument
          setRefresh={setRefresh}
          onSaved={() => {
            setRefresh((p) => !p);
            setTab("view");
          }}
          onCancel={() => setTab("view")}
        />
      )}

      {/* VIEW DOCUMENTS */}
      {tab === "view" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <input
              placeholder="🔍 Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 240,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                outline: "none",
                fontWeight: 850,
                color: C.text,
              }}
            />
          </div>

          <DocumentsTable docs={filtered} />
        </div>
      )}
    </div>
  );
}
