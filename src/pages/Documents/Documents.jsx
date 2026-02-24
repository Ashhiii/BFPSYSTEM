import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

import DocumentsTable from "./DocumentsTable.jsx";
import DocumentDetailsPanel from "./DocumentDetailsPanel.jsx";

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
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocs = async () => {
    try {
      const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocs(list);
    } catch (e) {
      console.error("fetchDocs error:", e);
      setDocs([]);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refresh]);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    if (!key) return docs;

    return (docs || []).filter((d) => {
      return (
        (d.ownerName || "").toLowerCase().includes(key) ||
        (d.establishmentName || "").toLowerCase().includes(key) ||
        (d.fsicAppNo || "").toLowerCase().includes(key) ||
        (d.businessAddress || "").toLowerCase().includes(key) ||
        (d.chiefName || "").toLowerCase().includes(key) ||
        (d.marshalName || "").toLowerCase().includes(key)
      );
    });
  }, [docs, search]);

  const page = {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
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

  const searchCard = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 12,
  };

  const content = {
    flex: 1,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 12,
    minHeight: 0,
  };

  const card = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
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
  };

  const scrollSlot = { flex: 1, overflow: "hidden", minHeight: 0 };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: C.bg }}>Documents</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.bg, marginTop: 6 }}>
            Auto-filled from Records • Edit Chief/Marshal here • Generate PDFs
          </div>
        </div>  
      </div>

      <div style={searchCard}>
        <input
          placeholder="🔍 Search documents..."
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
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 8 }}>
          Click a row → details show on the right
        </div>
      </div>

      <div style={content}>
        <div style={card}>
          <div style={cardHead}>
            <div>Documents List</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>Results: {filtered.length}</div>
          </div>

          <div style={scrollSlot}>
            <DocumentsTable docs={filtered} onRowClick={(d) => setSelectedDoc(d)} apiBase={API} />
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
            setRefresh?.((p) => !p);
          }}
        />
      </div>
    </div>
  );
}