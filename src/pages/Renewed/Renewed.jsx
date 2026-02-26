import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

import RenewedTable from "./RenewedTable.jsx";
import RecordDetailsPanel from "../Records/RecordDetailsPanel.jsx";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";

export default function Renewed({ refresh, setRefresh }) {
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // ✅ FULLSCREEN
  const [showDetails, setShowDetails] = useState(false);

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

  const loadRenewed = async () => {
    try {
      const snap = await getDocs(collection(db, "renewals"));

      const list = snap.docs
        .map((d) => {
          const data = d.data() || {};
          const rec = data.record || null;
          if (!rec) return null;

          return {
            id: d.id, // entityKey
            ...rec,
            entityKey: rec.entityKey || d.id,
            teamLeader: rec.teamLeader || "",
            _sort:
              data.updatedAt?.toMillis?.() ||
              (rec.renewedAt ? Date.parse(rec.renewedAt) : 0),
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b._sort || 0) - (a._sort || 0));

      setRecords(list);
    } catch (e) {
      console.error("loadRenewed error:", e);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadRenewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return records;

    return (records || []).filter((r) => {
      return (
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.entityKey || "").toLowerCase().includes(q) ||
        (r.teamLeader || "").toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const onSelectRow = (r) => {
    if (!r) return;
    setSelected(r);
    setShowDetails(true); // ✅ open fullscreen
  };

  // UI
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

  const hTitle = { fontSize: 18, fontWeight: 950, color: C.bg };
  const hSub = { fontSize: 12, fontWeight: 800, color: C.bg, marginTop: 6 };

  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    outline: "none",
    fontWeight: 850,
  };

  const searchCard = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 12,
  };

  const contentWrap = {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
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
    background: C.softBg,
    color: C.primaryDark,
    fontWeight: 950,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  };

  const scroll = { flex: 1, overflow: "hidden", minHeight: 0 };

  const panelStyles = {
    td: {
      padding: 10,
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      color: C.text,
    },
  };

  const fullTitle =
    selected?.establishmentName || selected?.fsicAppNo || "Renewed Record Details";

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={hTitle}>Renewed Records</div>
          <div style={hSub}>Yearly renewals • You can renew again anytime</div>
        </div>
      </div>

      <div style={searchCard}>
        <input
          placeholder="🔍 Search renewed records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />
        <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 8 }}>
          Click a row → details opens full screen
        </div>
      </div>

      <div style={contentWrap}>
        <div style={card}>
          <div style={cardHead}>
            <div>Renewed List</div>
            <div style={{ opacity: 0.85, color: C.muted }}>Results: {filtered.length}</div>
          </div>

          <div style={scroll}>
            <RenewedTable records={filtered} onRowClick={onSelectRow} apiBase={API} />
          </div>
        </div>
      </div>

      {/* ✅ FULL SCREEN DETAILS */}
      <DetailsFullScreen
        open={showDetails}
        title={fullTitle}
        onClose={() => setShowDetails(false)}
      >
        <RecordDetailsPanel
          styles={panelStyles}
          record={selected}
          source="Renewed"
          isArchive={true} // ✅ so Renew button shows
          onRenewSaved={() => setRefresh?.((p) => !p)}
          onUpdated={() => setRefresh?.((p) => !p)}
        />
      </DetailsFullScreen>
    </div>
  );
}