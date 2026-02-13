import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import RecordsTable from "./RecordsTable.jsx";
import RecordDetailsPanel from "./RecordDetailsPanel.jsx";
import AddRecord from "./AddRecord.jsx";

import injectTableStyles from "./injectTableStyles.jsx";

export default function Records({ refresh, setRefresh }) {
  const [tab, setTab] = useState("view"); // view | add
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [months, setMonths] = useState([]);
  const [mode, setMode] = useState("current"); // current | archive
  const [selectedMonth, setSelectedMonth] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => injectTableStyles(), []);

  /* 🔥 BFP COLORS */
  const C = {
    primary: "#b91c1c", // fire red
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

  const fetchCurrent = async () => {
    const res = await fetch(`${API}/records`);
    const data = await res.json();
    setRecords(data || []);
  };

  const fetchMonths = async () => {
    const res = await fetch(`${API}/archive/months`);
    const data = await res.json();
    setMonths(data || []);
  };

  const fetchArchiveMonth = async (m) => {
    const res = await fetch(`${API}/archive/${m}`);
    const data = await res.json();
    setRecords(data || []);
  };

  useEffect(() => {
    fetchCurrent();
  }, [refresh]);

  useEffect(() => {
    fetchMonths();
  }, []);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    return (records || []).filter((r) => {
      return (
        (r.ownerName || "").toLowerCase().includes(key) ||
        (r.establishmentName || "").toLowerCase().includes(key) ||
        (r.businessAddress || "").toLowerCase().includes(key) ||
        (r.fsicAppNo || "").toLowerCase().includes(key) ||
        (r.natureOfInspection || "").toLowerCase().includes(key) ||
        (r.inspectors || "").toLowerCase().includes(key)
      );
    });
  }, [records, search]);

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BFP Records");
    XLSX.writeFile(workbook, "BFP_Records.xlsx");
  };

  const exportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "BFP_Records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeMonth = async () => {
    if (!window.confirm("Close month and archive records?")) return;

    const res = await fetch(`${API}/records/close-month`, { method: "POST" });
    const data = await res.json();

    if (data.success) {
      alert(`Archived ${data.archivedCount} records for ${data.month}`);
      setMode("current");
      setSelectedMonth("");
      setSelectedRecord(null);
      await fetchMonths();
      await fetchCurrent();
    } else {
      alert(data.message || "Failed");
    }
  };

  const onSelectRow = (record) => {
    if (!record) return;
    const fixed = {
      ...record,
      entityKey: record.entityKey || (record.fsicAppNo ? `fsic:${record.fsicAppNo}` : ""),
    };
    setSelectedRecord(fixed);
  };

const handleRenewSaved = ({ newRecord }) => {
  setSelectedRecord(newRecord);
  setRefresh((p) => !p); // reload /records from backend
};


  /* ===================== STYLES (BFP THEME) ===================== */

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

  const tabBtn = (active) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? C.primary : "#fff",
    color: active ? "#fff" : C.text,
    cursor: "pointer",
    fontWeight: 950,
    whiteSpace: "nowrap",
  });

  const topbar = {
    borderRadius: 16,
    overflow: "hidden",
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
  };

  const topbarInner = {
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  };

  const leftRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 300,
  };

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

  const select = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    outline: "none",
    fontWeight: 850,
    minWidth: 220,
    cursor: "pointer",
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

  const btnGreen = {
    ...btn,
    border: `1px solid ${C.green}`,
    background: "#f0fdf4",
    color: "#166534",
  };

  const btnRed = {
    ...btn,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: "#fff",
  };

  const btnGhost = {
    ...btn,
    background: "#fff",
    border: `1px solid ${C.border}`,
    color: C.text,
  };

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
  };

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden" };

  // NOTE: This is passed to RecordDetailsPanel; adjust there if needed
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
      background: "#fef2f2",
      color: C.danger,
      fontWeight: 950,
      cursor: "pointer",
    },
  };

  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <div style={hTitle}>Fire Inspection Records</div>
          <div style={hSub}>View records, archive by month, export, add and manage records</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "view")} onClick={() => setTab("view")}>
            View Records
          </button>
          <button style={tabBtn(tab === "add")} onClick={() => setTab("add")}>
            Add Record
          </button>
        </div>
      </div>

      {/* ADD TAB */}
      {tab === "add" && (
        <div style={card}>
          <div style={{ padding: 12, overflow: "auto" }}>
            <AddRecord
              setRefresh={(fn) => {
                setRefresh(fn);
                setTab("view");
              }}
            />
          </div>
        </div>
      )}

      {/* VIEW TAB */}
      {tab === "view" && (
        <>
          <div style={topbar}>
            <div style={topbarInner}>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontSize: 16, fontWeight: 950, color: C.primaryDark }}>
                  {mode === "archive" ? `Archive Records (${selectedMonth || "-"})` : "Current Records"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 4 }}>
                  Click a row → details show on the right
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={btnGold} onClick={exportExcel}>Export Excel</button>
                <button style={btnRed} onClick={closeMonth}>Close Month</button>
              </div>

              <div style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <div style={leftRow}>
                  <input
                    placeholder="🔍 Search records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={input}
                  />

                  <select
                    style={select}
                    value={selectedMonth}
                    onChange={async (e) => {
                      const m = e.target.value;
                      setSelectedMonth(m);
                      if (!m) return;

                      setMode("archive");
                      setSelectedRecord(null);
                      await fetchArchiveMonth(m);
                    }}
                  >
                    <option value="">
                      📁 View Month Archive
                    </option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <button
                    style={btnGreen}
                    onClick={async () => {
                      setMode("current");
                      setSelectedMonth("");
                      setSelectedRecord(null);
                      await fetchCurrent();
                    }}
                  >
                    View Current
                  </button>
                </div>
              </div>
            </div>

            {/* small accent bar */}
            <div style={{ height: 4, background: C.primary }} />
          </div>

          <div style={content}>
            <div style={card}>
              <div style={cardHead}>
                <div>{mode === "archive" ? "Archive List" : "Current List"}</div>
                <div style={{ opacity: 0.85, color: C.muted }}>Results: {filtered.length}</div>
              </div>
              <div style={scroll}>
                <RecordsTable records={filtered} onRowClick={onSelectRow} />
              </div>
            </div>

            <RecordDetailsPanel
              styles={panelStyles}
              record={selectedRecord}
              source={mode === "archive" ? `Archive: ${selectedMonth}` : "Current"}
              isArchive={mode === "archive"}
              onRenewSaved={handleRenewSaved}
            />
          </div>
        </>
      )}
    </div>
  );
}
