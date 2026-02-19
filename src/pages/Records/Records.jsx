// Records.jsx (FULL UPDATED) — Firestore Current + Archive + Close Month (Batch)

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { db } from "../../firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch, // ✅ ADDED
} from "firebase/firestore";

import RecordsTable from "./RecordsTable.jsx";
import RecordDetailsPanel from "./RecordDetailsPanel.jsx";
import AddRecord from "../../components/AddRecords.jsx";
import injectTableStyles from "./injectTableStyles.jsx";

const monthKeyNow = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function Records({ refresh, setRefresh }) {
  const [tab, setTab] = useState("view");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [months, setMonths] = useState([]);
  const [mode, setMode] = useState("current"); // current | archive
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ✅ keep Render API only for PDF opening
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => injectTableStyles(), []);

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

  // =========================
  // FIRESTORE LOADERS
  // =========================

  const fetchCurrent = async () => {
    const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setRecords(list);
  };

  const fetchMonths = async () => {
    // expects archives/{month} docs with field { month }
    const qy = query(collection(db, "archives"), orderBy("month", "desc"));
    const snap = await getDocs(qy);
    setMonths(snap.docs.map((d) => d.id)); // month doc id = YYYY-MM
  };

  const fetchArchiveMonth = async (m) => {
    const snap = await getDocs(collection(db, "archives", m, "records"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setRecords(list);
  };

  useEffect(() => {
    fetchCurrent().catch(() => setRecords([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    fetchMonths().catch(() => setMonths([]));
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

  // =========================
  // CLOSE MONTH (ARCHIVE) ✅ FIXED (writeBatch)
  // =========================
  const closeMonth = async () => {
    try {
      if (!window.confirm("Close month and archive records?")) return;

      const month = monthKeyNow();

      // get all current
      const currentSnap = await getDocs(collection(db, "records"));
      const archivedCount = currentSnap.size;

      if (archivedCount === 0) {
        alert("No records to archive.");
        return;
      }

      // NOTE: Firestore batch limit is 500 operations.
      // Each record uses 2 ops (set archive + delete current).
      // So safe up to ~249 records. If you may exceed, tell me for chunked version.
      const opsNeeded = archivedCount * 2 + 1; // +1 for month doc
      if (opsNeeded > 500) {
        alert(
          `Too many records for one batch (${archivedCount}). Need chunked batching.`
        );
        return;
      }

      const batch = writeBatch(db);

      // ensure month doc exists (for dropdown)
      batch.set(
        doc(db, "archives", month),
        {
          month,
          closedAt: new Date().toISOString(),
          count: archivedCount,
        },
        { merge: true }
      );

      // move docs
      currentSnap.docs.forEach((d) => {
        const data = d.data();

        // copy to archive subcollection
        batch.set(doc(db, "archives", month, "records", d.id), {
          ...data,
          archivedAt: new Date().toISOString(),
          sourceMonth: month,
        });

        // delete current
        batch.delete(doc(db, "records", d.id));
      });

      await batch.commit();

      alert(`✅ Archived ${archivedCount} records for ${month}`);

      // reset UI
      setMode("current");
      setSelectedMonth("");
      setSelectedRecord(null);

      await fetchMonths();
      await fetchCurrent();
    } catch (e) {
      console.error("closeMonth failed:", e);
      alert(
        "❌ Close Month failed. Most common reason: Firestore rules block write/delete."
      );
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

  const handleRenewSaved = ({ oldId, newRecord }) => {
    setSelectedRecord(newRecord);
    setRecords((prev) => {
      const idx = (prev || []).findIndex((r) => String(r.id) === String(oldId));
      if (idx === -1) return [newRecord, ...(prev || [])];
      const copy = [...prev];
      copy.splice(idx + 1, 0, newRecord);
      return copy;
    });
  };

  // =========================
  // UI STYLES
  // =========================

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

  const btnGold = { ...btn, border: `1px solid ${C.gold}`, background: C.gold, color: "#111827" };
  const btnGreen = { ...btn, border: `1px solid ${C.green}`, background: "#f0fdf4", color: "#166534" };
  const btnRed = { ...btn, border: `1px solid ${C.primary}`, background: C.primary, color: "#fff" };

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

  const panelStyles = {
    td: { padding: 10, borderBottom: `1px solid ${C.border}`, fontWeight: 850, fontSize: 13, color: C.text },
  };

  return (
    <div style={page}>
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
                    <option value="">📁 View Month Archive</option>
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
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

            <div style={{ height: 4, background: C.primary }} />
          </div>

          <div style={content}>
            <div style={card}>
              <div style={cardHead}>
                <div>{mode === "archive" ? "Archive List" : "Current List"}</div>
                <div style={{ opacity: 0.85, color: C.muted }}>Results: {filtered.length}</div>
              </div>
              <div style={scroll}>
                <RecordsTable records={filtered} onRowClick={onSelectRow} apiBase={API} />
              </div>
            </div>

            <RecordDetailsPanel
              styles={panelStyles}
              record={selectedRecord}
              source={mode === "archive" ? `Archive: ${selectedMonth}` : "Current"}
              isArchive={mode === "archive"}
              onRenewSaved={handleRenewSaved}
              onUpdated={(updated) => {
                setRecords((prev) => {
                  const copy = [...(prev || [])];
                  const idx = copy.findIndex((r) => String(r.id) === String(updated.id));
                  if (idx !== -1) copy[idx] = updated;
                  return copy;
                });
                setSelectedRecord(updated);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
