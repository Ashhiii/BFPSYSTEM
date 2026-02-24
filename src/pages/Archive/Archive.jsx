// src/pages/Archive/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  deleteDoc, // ✅ NEW
} from "firebase/firestore";
import { db } from "../../firebase";

import RecordsTable from "../Records/RecordsTable.jsx";
import injectTableStyles from "../Records/injectTableStyles.jsx";
import RecordDetailsPanel from "../Records/RecordDetailsPanel.jsx";

export default function Archive() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);

  // ✅ close info saved in Firestore (archives/{YYYY-MM})
  const [closeInfo, setCloseInfo] = useState(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
  };

  useEffect(() => injectTableStyles(), []);

  const fetchMonths = async () => {
    const qy = query(collection(db, "archives"), orderBy("month", "desc"));
    const snap = await getDocs(qy);
    setMonths(snap.docs.map((d) => d.id)); // doc id = YYYY-MM
  };

  const makeEntityKey = (r) => {
    const base =
      (r.entityKey || "").trim() ||
      (r.fsicAppNo || "").trim() ||
      `${(r.establishmentName || "").trim()}|${(r.businessAddress || "").trim()}|${(r.ownerName || "").trim()}`;

    return base
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 140);
  };

  /**
   * ✅ NEW BEHAVIOR:
   * - If month has 0 records => DELETE archives/{month} doc
   *   so closeDate disappears and you can Close Month again.
   */
  const fetchArchiveMonth = async (m) => {
    if (!m) {
      setSelectedMonth("");
      setRecords([]);
      setSelectedRecord(null);
      setSearch("");
      setCloseInfo(null);
      return;
    }

    setSelectedMonth(m);
    setSelectedRecord(null);
    setSearch("");
    setRecords([]);
    setCloseInfo(null);

    // ✅ 1) fetch records first
    const snap = await getDocs(collection(db, "archives", m, "records"));

    const list = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        entityKey: data.entityKey || makeEntityKey(data),
      };
    });

    // ❗ IF EMPTY → delete month doc (removes close date)
    if (list.length === 0) {
      try {
        await deleteDoc(doc(db, "archives", m));
        console.log("✅ Empty archive month deleted:", m);
      } catch (err) {
        console.error("❌ Failed deleting empty month:", err);
      }

      // reset UI
      setSelectedMonth("");
      setRecords([]);
      setSelectedRecord(null);
      setSearch("");
      setCloseInfo(null);

      // refresh month list
      fetchMonths().catch(() => {});
      return;
    }

    // ✅ 2) if has data, fetch month doc for close info (closeDate/closedAt)
    try {
      const monthSnap = await getDoc(doc(db, "archives", m));
      setCloseInfo(monthSnap.exists() ? monthSnap.data() : null);
    } catch {
      setCloseInfo(null);
    }

    setRecords(list);
  };

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

  const hasData = (records || []).length > 0;

  // ---------- styles ----------
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

  const bar = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const input = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    outline: "none",
    fontWeight: 850,
    minWidth: 260,
    flex: 1,
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

  const body = {
    flex: 1,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1.65fr 1fr",
    gap: 12,
    alignItems: "stretch",
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

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden" };

  const emptyBox = { padding: 18, color: C.muted, fontWeight: 850 };

  const responsiveCss = `
    @media (max-width: 1050px){
      .archiveBody{ grid-template-columns: 1fr !important; }
    }
  `;

  const panelTableStyles = useMemo(
    () => ({
      td: {
        padding: "14px 12px",
        borderBottom: `1px solid ${C.border}`,
        fontWeight: 850,
        fontSize: 13,
        verticalAlign: "top",
      },
    }),
    [C.border]
  );

  // ✅ show close date if exists (supports Timestamp or string)
  const closeDateText =
    closeInfo?.closedAt?.toDate?.()
      ? closeInfo.closedAt.toDate().toLocaleString()
      : closeInfo?.closedAt || closeInfo?.closeDate || "";

  return (
    <div style={page}>
      <style>{responsiveCss}</style>

      <div style={header}>
        <div>
          <div style={hTitle}>Archive Records</div>
          <div style={hSub}>Select month → search → click row to view details / renew</div>
        </div>
      </div>

      <div style={bar}>
        <select
          style={select}
          value={selectedMonth}
          onChange={async (e) => {
            const m = e.target.value;
            await fetchArchiveMonth(m);
          }}
        >
          <option value="">📁 Select Month (YYYY-MM)</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <input
          style={input}
          placeholder="🔍 Search archived records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!selectedMonth || !hasData}
        />
      </div>

      <div style={body} className="archiveBody">
        {/* LEFT: TABLE */}
        <div style={card}>
          <div style={cardHead}>
            <div>
              Month: {selectedMonth ? selectedMonth : "-"}
              {selectedMonth && !hasData ? (
                <span style={{ marginLeft: 10, color: C.muted }}>(No records)</span>
              ) : null}
            </div>

            <div style={{ opacity: 0.85, color: C.muted }}>
              Results: {filtered.length}
              {closeDateText ? (
                <span style={{ marginLeft: 12 }}>• Closed: {closeDateText}</span>
              ) : null}
            </div>
          </div>

          <div style={scroll}>
            {!selectedMonth ? (
              <div style={emptyBox}>Select a month to view archived records.</div>
            ) : !hasData ? (
              <div style={emptyBox}>
                No archived records found for <b>{selectedMonth}</b>.
                <div style={{ marginTop: 8 }}>
                  (If month had no records, it auto-deletes the close date so you can close again.)
                </div>
              </div>
            ) : (
              <RecordsTable
                records={filtered}
                apiBase={API}
                onRowClick={(rec) => setSelectedRecord(rec)}
              />
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS PANEL */}
        <RecordDetailsPanel
          styles={panelTableStyles}
          record={selectedRecord}
          source={selectedMonth ? `Archive: ${selectedMonth}` : "Archive"}
          isArchive={true}
          onRenewSaved={({ oldId, newRecord }) => {
            console.log("Renew saved:", oldId, newRecord);
          }}
          onUpdated={(updated) => {
            setRecords((prev) =>
              (prev || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
            setSelectedRecord((prev) =>
              prev?.id === updated.id ? { ...prev, ...updated } : prev
            );
          }}
        />
      </div>
    </div>
  );
}