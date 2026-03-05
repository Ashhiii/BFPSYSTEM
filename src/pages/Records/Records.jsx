// src/pages/Records/Records.jsx
// ✅ Close Month separated into CloseMonthControl (still connected via props)
// ✅ Success/Error uses your TopRightToast (open/title/message)
// ✅ NEW: Month + Year filter based on dateInspected

import React, { useEffect, useMemo, useState } from "react";

import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

import { useLocation } from "react-router-dom";

import RecordsTable from "./RecordsTable.jsx";
import RecordDetailsPanel from "./RecordDetailsPanel.jsx";
import injectTableStyles from "./injectTableStyles.jsx";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";

import TopRightToast from "../../components/TopRightToast.jsx";
import CloseMonthControl from "./CloseMonthControl.jsx"; // ✅ NEW

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// ✅ parse month/year from "January 2, 2026" or "2026-02-01" or Date
const parseMonthYear = (val) => {
  if (!val) return { month: null, year: null };

  // Firestore Timestamp (if ever)
  if (typeof val === "object" && val?.toDate) {
    const dt = val.toDate();
    return { month: dt.getMonth() + 1, year: dt.getFullYear() };
  }

  // Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return { month: val.getMonth() + 1, year: val.getFullYear() };
  }

  const s = String(val).trim();
  if (!s) return { month: null, year: null };

  // format: YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    return { month: isNaN(month) ? null : month, year: isNaN(year) ? null : year };
  }

  // format: "January 2, 2026"
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return { month: dt.getMonth() + 1, year: dt.getFullYear() };
  }

  // fallback month-name contains
  const lower = s.toLowerCase();
  const map = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  const found = Object.keys(map).find((m) => lower.includes(m));
  const yearMatch = s.match(/\b(19\d{2}|20\d{2})\b/);

  return {
    month: found ? map[found] : null,
    year: yearMatch ? Number(yearMatch[1]) : null,
  };
};

export default function Records({ refresh, setRefresh }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // ✅ FULLSCREEN
  const [showDetails, setShowDetails] = useState(false);

  // ✅ Toast state (matches TopRightToast props)
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("Success");
  const [toastMsg, setToastMsg] = useState("");

  // ✅ NEW: Month + Year filters
  const [monthFilter, setMonthFilter] = useState("ALL"); // "ALL" or 1..12
  const [yearFilter, setYearFilter] = useState("ALL"); // "ALL" or "2026"

  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => injectTableStyles(), []);

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    danger: "#dc2626",
  };

  const showToast = (title, message) => {
    setToastTitle(title);
    setToastMsg(message);
    setToastOpen(true);
  };

  const fetchCurrent = async () => {
    const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchCurrent().catch(() => setRecords([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  // ✅ Year options from records dateInspected
  const yearOptions = useMemo(() => {
    const set = new Set();
    (records || []).forEach((r) => {
      const { year } = parseMonthYear(r.dateInspected);
      if (year) set.add(year);
    });
    const years = Array.from(set).sort((a, b) => b - a).map(String);
    return ["ALL", ...years];
  }, [records]);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();

    const wantMonth = monthFilter === "ALL" ? null : Number(monthFilter);
    const wantYear = yearFilter === "ALL" ? null : Number(yearFilter);

    return (records || []).filter((r) => {
      // ✅ Month/Year filter based on dateInspected
      const { month, year } = parseMonthYear(r.dateInspected);

      if (wantMonth && month !== wantMonth) return false;
      if (wantYear && year !== wantYear) return false;

      // ✅ Search filter
      if (!key) return true;

      return (
        (r.ownerName || "").toLowerCase().includes(key) ||
        (r.establishmentName || "").toLowerCase().includes(key) ||
        (r.ioNumber || "").toLowerCase().includes(key) ||
        (r.fsicAppNo || "").toLowerCase().includes(key) ||
        (r.natureOfInspection || "").toLowerCase().includes(key) ||
        (r.inspectors || "").toLowerCase().includes(key)
      );
    });
  }, [records, search, monthFilter, yearFilter]);

  const onSelectRow = (record) => {
    if (!record) return;

    setActiveId(record.id); // ✅ highlight

    const fixed = {
      ...record,
      entityKey: record.entityKey || (record.fsicAppNo ? `fsic:${record.fsicAppNo}` : ""),
    };
    setSelectedRecord(fixed);
    setShowDetails(true);
  };

  // ✅ AUTO-OPEN + HIGHLIGHT when navigated from Dashboard
  useEffect(() => {
    const navActiveId = location.state?.activeId;

    if (navActiveId && (records || []).length) {
      setActiveId(navActiveId); // ✅ highlight only (no details)
      window.history.replaceState({}, document.title); // clear state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, records]);

  const handleRenewSaved = ({ oldId, newRecord }) => {
    setSelectedRecord(newRecord);
    setRecords((prev) => {
      const idx = (prev || []).findIndex((r) => String(r.id) === String(oldId));
      if (idx === -1) return [newRecord, ...(prev || [])];
      const copy = [...prev];
      copy.splice(idx + 1, 0, newRecord);
      return copy;
    });
    setRefresh?.((p) => !p);
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
    fontWeight: 950,
    whiteSpace: "nowrap",
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

  const btnRed = {
    ...btn,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: "#fff",
  };

  const content = {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const card = {
    flex: 1,
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
    td: {
      padding: 10,
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      color: C.text,
    },
  };

  const fullTitle = selectedRecord?.establishmentName || selectedRecord?.fsicAppNo || "Record Details";

  return (
    <div style={page}>
      {/* ✅ YOUR TOP RIGHT TOAST */}
      <TopRightToast
        C={C}
        open={toastOpen}
        title={toastTitle}
        message={toastMsg}
        autoCloseMs={2000}
        onClose={() => setToastOpen(false)}
      />

      <div style={header}>
        <div>
          <div style={hTitle}>Records</div>
          <div style={hSub}>View current records + details + close month</div>
        </div>

        {/* ✅ SEPARATED CLOSE MONTH (still connected) */}
        <CloseMonthControl
          C={C}
          buttonStyle={btnRed}
          showToast={showToast}
          fetchCurrent={fetchCurrent}
          setRefresh={setRefresh}
          onAfterCloseUIReset={() => {
            setSelectedRecord(null);
            setShowDetails(false);
            setSearch("");
            setActiveId(null);
            setMonthFilter("ALL"); // ✅ reset filters too
            setYearFilter("ALL");
          }}
        />
      </div>

      <div style={topbar}>
        <div style={topbarInner}>
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: C.primaryDark }}>Current Records</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 4 }}>
              Click a row → details opens full screen
            </div>
          </div>

           <input
            placeholder="🔍 Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />

          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={select}>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={select}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y === "ALL" ? "All Years" : y}
              </option>
            ))}
          </select>

          <button
            style={btn}
            onClick={() => {
              setMonthFilter("ALL");
              setYearFilter("ALL");
            }}
          >
            Reset Filters
          </button>
        </div>

        <div style={{ height: 4, background: C.primary }} />
      </div>

      <div style={content}>
        <div style={card}>
          <div style={cardHead}>
            <div>Current List</div>
            <div style={{ opacity: 0.85, color: C.muted }}>Results: {filtered.length}</div>
          </div>

          <div style={scroll}>
            <RecordsTable records={filtered} onRowClick={onSelectRow} apiBase={API} activeId={activeId} />
          </div>
        </div>
      </div>

      <DetailsFullScreen open={showDetails} title={fullTitle} onClose={() => setShowDetails(false)}>
        <RecordDetailsPanel
          styles={panelStyles}
          record={selectedRecord}
          source="Current"
          isArchive={false}
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
      </DetailsFullScreen>
    </div>
  );
}