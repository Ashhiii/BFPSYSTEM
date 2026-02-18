import React, { useEffect, useMemo, useState } from "react";
import AddDocument from "../../components/AddDocument.jsx";
import DocumentsTable from "./DocumentsTable.jsx";
import DocumentDetailsPanel from "./DocumentDetailsPanel.jsx";

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
  green: "#16a34a",
  danger: "#dc2626",
};

export default function Documents({ refresh, setRefresh }) {
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const [tab, setTab] = useState("view"); // view | add
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

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
        (d.fsicAppNo || "").toLowerCase().includes(key) ||
        (d.chiefName || "").toLowerCase().includes(key) ||
        (d.marshalName || "").toLowerCase().includes(key)
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
    textTransform: "uppercase",
  });

  const content = {
    flex: 1,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 12,
  };

  const card = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
  };

  const cardHead = {
    padding: 10,
    borderBottom: `1px solid ${C.border}`,
    color: C.primaryDark,
    fontWeight: 950,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    background: C.softBg,
    textTransform: "uppercase",
  };

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden" };

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
          <div style={{ fontSize: 18, fontWeight: 950, color: C.primaryDark, textTransform: "uppercase" }}>
            Documents
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 6, textTransform: "uppercase" }}>
            View, edit Chief/Marshal, and generate PDFs
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "view")} onClick={() => setTab("view")}>
            View Documents
          </button>
          <button
            style={tabBtn(tab === "add")}
            onClick={() => {
              setTab("add");
              setSelectedDoc(null);
            }}
          >
            Add Document
          </button>
        </div>
      </div>

      {/* ADD DOCUMENT */}
      {tab === "add" && (
        <AddDocument
          onSaved={() => {
            setRefresh?.((p) => !p);
            setTab("view");
          }}
        />
      )}

      {/* VIEW DOCUMENTS */}
      {tab === "view" && (
        <div style={content}>
          <div style={card}>
            <div style={cardHead}>
              <div>Documents List</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>
                Results: {filtered.length}
              </div>
            </div>

            <div style={{ padding: 12 }}>
              <input
                placeholder="🔍 SEARCH DOCUMENTS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  outline: "none",
                  fontWeight: 850,
                  color: C.text,
                  textTransform: "uppercase",
                }}
              />
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 8, textTransform: "uppercase" }}>
                Click a row → details show on the right
              </div>
            </div>

            <div style={scroll}>
              <DocumentsTable docs={filtered} onRowClick={(d) => setSelectedDoc(d)} />
            </div>
          </div>

          <DocumentDetailsPanel
            doc={selectedDoc}
            onUpdated={(updated) => {
              setDocs((prev) => {
                const copy = [...(prev || [])];
                const idx = copy.findIndex((x) => String(x.id) === String(updated.id));
                if (idx !== -1) copy[idx] = updated;
                return copy;
              });
              setSelectedDoc(updated);

              // optional refresh fetch
              // setRefresh?.((p) => !p);
            }}
          />
        </div>
      )}
    </div>
  );
}
