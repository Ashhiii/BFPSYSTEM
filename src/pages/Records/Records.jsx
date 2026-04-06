import React, { useEffect, useMemo, useState, useCallback } from "react";

import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
  doc,
} from "firebase/firestore";

import { HiOutlinePrinter } from "react-icons/hi";
import { useLocation } from "react-router-dom";

import RecordsTable from "./RecordsTable.jsx";
import RecordDetailsPanel from "./RecordDetailsPanel.jsx";
import injectTableStyles from "./injectTableStyles.jsx";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";
import TopRightToast from "../../components/TopRightToast.jsx";
import CloseMonthControl from "./CloseMonthControl.jsx";
import PrintSelectionModal from "../../components/PrintSelectionModal";

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

const parseMonthYear = (val) => {
  if (!val) return { month: null, year: null };

  if (typeof val === "object" && val?.toDate) {
    const dt = val.toDate();
    return { month: dt.getMonth() + 1, year: dt.getFullYear() };
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    return { month: val.getMonth() + 1, year: val.getFullYear() };
  }

  const s = String(val).trim();
  if (!s) return { month: null, year: null };

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    return {
      month: Number.isNaN(month) ? null : month,
      year: Number.isNaN(year) ? null : year,
    };
  }

  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    return { month: dt.getMonth() + 1, year: dt.getFullYear() };
  }

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

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokensOf = (value) => normalizeText(value).split(" ").filter(Boolean);

const fieldMatchesCombinedSearch = (fieldValue, combinedSearch) => {
  const field = normalizeText(fieldValue);
  if (!field) return false;

  if (field.includes(combinedSearch)) return true;
  if (combinedSearch.includes(field)) return true;

  const fieldTokens = tokensOf(field);
  if (!fieldTokens.length) return false;

  return fieldTokens.every((token) => combinedSearch.includes(token));
};

export default function Records({ refresh, setRefresh }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("Success");
  const [toastMsg, setToastMsg] = useState("");

  const [monthFilter, setMonthFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const [visibleCount, setVisibleCount] = useState(0);

  const location = useLocation();
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

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
  }, [refresh]);

  const saveChangedRows = useCallback(
    async (changedRows = [], allUpdatedRecords = []) => {
      if (!Array.isArray(changedRows) || !changedRows.length) {
        if (Array.isArray(allUpdatedRecords) && allUpdatedRecords.length) {
          setRecords(allUpdatedRecords);
        }
        return;
      }

      const batch = writeBatch(db);

      changedRows.forEach((row) => {
        if (!row?.id) return;
        const { id, ...payload } = row;
        const ref = doc(db, "records", id);
        batch.set(ref, payload, { merge: true });
      });

      await batch.commit();

      if (Array.isArray(allUpdatedRecords) && allUpdatedRecords.length) {
        setRecords(allUpdatedRecords);
      } else {
        setRecords((prev) =>
          prev.map((item) => {
            const updated = changedRows.find((r) => String(r.id) === String(item.id));
            return updated ? updated : item;
          })
        );
      }

      if (selectedRecord?.id) {
        const freshSelected = changedRows.find(
          (r) => String(r.id) === String(selectedRecord.id)
        );
        if (freshSelected) {
          setSelectedRecord(freshSelected);
        }
      }
    },
    [selectedRecord]
  );

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
    const combinedSearch = normalizeText(search);

    const wantMonth = monthFilter === "ALL" ? null : Number(monthFilter);
    const wantYear = yearFilter === "ALL" ? null : Number(yearFilter);

    return (records || []).filter((r) => {
      const { month, year } = parseMonthYear(r.dateInspected);

      if (wantMonth && month !== wantMonth) return false;
      if (wantYear && year !== wantYear) return false;

      if (!combinedSearch) return true;

      const searchableFields = [
        r.fsicAppNo,
        r.fsicNo,
        r.establishmentName,
        r.ownerName,
        r.ioNumber,
        r.natureOfInspection,
        r.inspectors,
      ];

      const rowCombined = normalizeText(searchableFields.join(" "));

      if (rowCombined.includes(combinedSearch)) return true;

      return searchableFields.some((field) =>
        fieldMatchesCombinedSearch(field, combinedSearch)
      );
    });
  }, [records, search, monthFilter, yearFilter]);

  const onSelectRow = (record) => {
    if (!record) return;

    setActiveId(record.id);

    const fixed = {
      ...record,
      entityKey: record.entityKey || (record.fsicAppNo ? `fsic:${record.fsicAppNo}` : ""),
    };
    setSelectedRecord(fixed);
    setShowDetails(true);
  };

  useEffect(() => {
    const navActiveId = location.state?.activeId;

    if (navActiveId && (records || []).length) {
      setActiveId(navActiveId);
      window.history.replaceState({}, document.title);
    }
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

  const getCertificateUrl = (recordId, value) => {
    if (value === "owner") return `${API}/records/${recordId}/certificate/owner/pdf`;
    if (value === "bfp") return `${API}/records/${recordId}/certificate/bfp/pdf`;
    if (value === "owner-new") return `${API}/records/${recordId}/certificate/owner-new/pdf`;
    if (value === "bfp-new") return `${API}/records/${recordId}/certificate/bfp-new/pdf`;
    if (value === "io") return `${API}/records/${recordId}/io/pdf`;
    if (value === "reinspection") return `${API}/records/${recordId}/reinspection/pdf`;
    if (value === "nfsi") return `${API}/records/${recordId}/nfsi/pdf`;
    return "";
  };

  const printPdfBlob = async (blob) => {
    const blobUrl = window.URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print iframe error:", err);
        window.open(blobUrl, "_blank");
      }

      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
        window.URL.revokeObjectURL(blobUrl);
      }, 5000);
    };
  };

  const handlePrintSelected = async ({ selectedIds, template }) => {
    if (!selectedIds?.length) {
      alert("Select record(s) to print.");
      return;
    }

    if (!template) {
      alert("Please select a template.");
      return;
    }

    try {
      for (const recordId of selectedIds) {
        const url = getCertificateUrl(recordId, template);
        if (!url) continue;

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          throw new Error(`Failed to load printable PDF for record ${recordId}`);
        }

        const blob = await res.blob();
        await printPdfBlob(blob);
      }
    } catch (err) {
      console.error("Print failed:", err);
      alert("There's a problem with the print function. Check backend endpoint or popup/print permissions.");
    }
  };

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

  const fullTitle =
    selectedRecord?.establishmentName || selectedRecord?.fsicAppNo || "Record Details";

  return (
    <div style={page}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              setMonthFilter("ALL");
              setYearFilter("ALL");
              setVisibleCount(0);
            }}
          />

          <IconActionBtn
            title="Print"
            onClick={() => setShowPrintModal(true)}
            icon={<HiOutlinePrinter size={15} />}
          />
        </div>
      </div>

      <div style={topbar}>
        <div style={topbarInner}>
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: C.primaryDark }}>
              Current Records
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 4 }}>
              Click a row → details opens full screen
            </div>
          </div>

          <input
            placeholder="🔍 Search"
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
              setSearch("");
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
            <div style={{ opacity: 0.85, color: C.muted }}>Results: {visibleCount}</div>
          </div>

          <div style={scroll}>
            <RecordsTable
              records={filtered}
              onRowClick={onSelectRow}
              apiBase={API}
              activeId={activeId}
              onBulkUpdate={(updatedRecords) => {
                setRecords(updatedRecords);
              }}
              onVisibleCountChange={setVisibleCount}
              onAutoSave={saveChangedRows}
            />
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

      <PrintSelectionModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        records={filtered}
        apiBase={API}
        C={C}
        onAutoSave={saveChangedRows}
        onBulkUpdate={setRecords}
        onPrint={async (payload) => {
          await handlePrintSelected(payload);
          setShowPrintModal(false);
        }}
      />
    </div>
  );
}

function IconActionBtn({ title, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: "1px solid rgba(255,255,255,0.20)",
        background: "rgba(255,255,255,0.12)",
        color: "#fff",
        width: 32,
        height: 32,
        borderRadius: 14,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
        transition: "all .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.20)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.12)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon}
    </button>
  );
}