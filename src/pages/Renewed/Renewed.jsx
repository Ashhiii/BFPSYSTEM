import React, { useEffect, useMemo, useState } from "react";
import RenewedTable from "../Renewed/RenewedTable.jsx";
import RecordDetailsPanel from "../Records/RecordDetailsPanel.jsx";

export default function Renewed({ refresh, setRefresh }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

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

  const page = {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
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

  const input = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    outline: "none",
    fontWeight: 850,
    flex: 1,
    minWidth: 260,
  };

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

  const btnGold = {
    ...btn,
    border: `1px solid ${C.gold}`,
    background: C.gold,
    color: "#111827",
  };

  const contentWrap = {
    flex: 1,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1.3fr .9fr",
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

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 };

  // Pass theme-friendly table cell + buttons into RecordDetailsPanel
  const panelStyles = {
    td: {
      padding: 10,
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      color: C.text,
    },
    primaryBtn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${C.primary}`,
      background: C.primary,
      color: "#fff",
      fontWeight: 950,
      cursor: "pointer",
    },
    dangerBtn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${C.danger}`,
      background: C.softBg,
      color: C.danger,
      fontWeight: 950,
      cursor: "pointer",
    },
  };

  const normalizeOne = (x) => {
    if (!x) return x;
    const d = x.data && typeof x.data === "object" ? x.data : {};
    return {
      ...x,
      ...d,
      id: x.id ?? d.id,
      entityKey: x.entityKey ?? d.entityKey ?? "",
      teamLeader: x.teamLeader ?? d.teamLeader ?? "",
      kind: x.kind ?? d.kind,
      source: x.source ?? d.source,
      createdAt: x.createdAt ?? d.createdAt,
      changedAt: x.changedAt ?? d.changedAt,
    };
  };

  const loadRenewed = async () => {
    try {
      const res = await fetch("http://localhost:5000/manager/items?scope=renewed&month=");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.items || data.records || [];
      const onlyRenewed = raw.filter((r) => (r.kind || "") === "renewed");
      setRecords(onlyRenewed.map(normalizeOne));
    } catch (e) {
      console.error("loadRenewed error:", e);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadRenewed();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return records;
    return records.filter((r) => {
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

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={hTitle}>Renewed Records</div>
          <div style={hSub}>Yearly renewals • You can renew again anytime</div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          background: "#fff",
          boxShadow: "0 10px 25px rgba(0,0,0,.06)",
          padding: 12,
        }}
      >
        <input
          placeholder="🔍 Search renewed records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />
      </div>

      <div style={contentWrap}>
        <div style={card}>
          <div style={cardHead}>
            <div>Renewed List</div>
            <div style={{ opacity: 0.85, color: C.muted }}>Results: {filtered.length}</div>
          </div>

          <div style={scroll}>
            <RenewedTable records={filtered} onRowClick={(r) => setSelected(r)} />
          </div>
        </div>

        <RecordDetailsPanel
          styles={panelStyles}
          record={selected}
          source="Renewed"
          isArchive={true}
          onRenewSaved={() => setRefresh((p) => !p)}
        />
      </div>
    </div>
  );
}
