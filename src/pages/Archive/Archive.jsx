// src/pages/Archive/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { HiOutlinePrinter } from "react-icons/hi";
import { db } from "../../firebase";

import RecordsTable from "../Records/RecordsTable.jsx";
import injectTableStyles from "../Records/injectTableStyles.jsx";
import RecordDetailsPanel from "../Records/RecordDetailsPanel.jsx";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";
import PrintSelectionModal from "../../components/PrintSelectionModal";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import TopRightToast from "../../components/TopRightToast.jsx";

/** ✅ Convert "YYYY-MM" -> "February 2026" */
const formatMonthLabel = (yyyy_mm) => {
  if (!yyyy_mm) return "";
  const [y, m] = String(yyyy_mm).split("-");
  const monthIndex = Number(m) - 1;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (!y || monthIndex < 0 || monthIndex > 11) return String(yyyy_mm);
  return `${months[monthIndex]} ${y}`;
};

/** ✅ Pretty datetime like "February 1, 2026 3:45 PM" (PH locale) */
const formatDateTimePretty = (dt) => {
  if (!dt) return "";
  try {
    const d = dt instanceof Date ? dt : new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);

    return d.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dt);
  }
};

/** ✅ Safe timestamp to millis (Firestore Timestamp | Date | string | number) */
const toMillisSafe = (v) => {
  if (!v) return 0;
  if (v?.toMillis) return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof v === "number") return v;
  return 0;
};

/** ✅ Same combined search as Records page */
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

export default function Archive() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);

  // ✅ FULLSCREEN DETAILS
  const [showDetails, setShowDetails] = useState(false);

  // ✅ PRINT MODAL
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ✅ close info saved in Firestore (archives/{YYYY-MM})
  const [closeInfo, setCloseInfo] = useState(null);

  // ✅ busy state for unclose
  const [unclosing, setUnclosing] = useState(false);

  // ✅ UN-CLOSE CONFIRM MODAL
  const [showUncloseConfirm, setShowUncloseConfirm] = useState(false);

  // ✅ TOAST
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("Success");
  const [toastMsg, setToastMsg] = useState("");

  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    danger: "#dc2626",
    gold: "#f59e0b",
  };

  const showToast = (title, message) => {
    setToastTitle(title);
    setToastMsg(message);
    setToastOpen(true);
  };

  useEffect(() => injectTableStyles(), []);

  const fetchMonths = async () => {
    const qy = query(collection(db, "archives"), orderBy("month", "desc"));
    const snap = await getDocs(qy);
    setMonths(snap.docs.map((d) => d.id));
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

  const fetchArchiveMonth = async (m) => {
    if (!m) {
      setSelectedMonth("");
      setRecords([]);
      setSelectedRecord(null);
      setSearch("");
      setCloseInfo(null);
      setShowDetails(false);
      return;
    }

    setSelectedMonth(m);
    setSelectedRecord(null);
    setSearch("");
    setRecords([]);
    setCloseInfo(null);
    setShowDetails(false);

    const arcRef = collection(db, "archives", m, "records");

    let snap;
    try {
      const qArc = query(arcRef, orderBy("createdAt", "desc"));
      snap = await getDocs(qArc);
    } catch (e) {
      snap = await getDocs(arcRef);
    }

    let list = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        entityKey: data.entityKey || makeEntityKey(data),
      };
    });

    list = list.sort((a, b) => {
      const bt =
        toMillisSafe(b.createdAt) ||
        toMillisSafe(b.archivedAt) ||
        toMillisSafe(b.restoredAt);
      const at =
        toMillisSafe(a.createdAt) ||
        toMillisSafe(a.archivedAt) ||
        toMillisSafe(a.restoredAt);
      return bt - at;
    });

    if (list.length === 0) {
      try {
        await deleteDoc(doc(db, "archives", m));
        console.log("✅ Empty archive month deleted:", m);
      } catch (err) {
        console.error("❌ Failed deleting empty month:", err);
      }

      setSelectedMonth("");
      setRecords([]);
      setSelectedRecord(null);
      setSearch("");
      setCloseInfo(null);
      setShowDetails(false);

      fetchMonths().catch(() => {});
      return;
    }

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

  /** ✅ Same multiple search feel as Records page */
  const filtered = useMemo(() => {
    const combinedSearch = normalizeText(search);

    return (records || []).filter((r) => {
      if (!combinedSearch) return true;

      const searchableFields = [
        r.fsicAppNo,
        r.fsicNo,
        r.establishmentName,
        r.ownerName,
        r.ioNumber,
        r.natureOfInspection,
        r.inspectors,
        r.businessAddress,
        r.nfsiNumber,
        r.ntcNumber,
        r.remarks,
      ];

      const rowCombined = normalizeText(searchableFields.join(" "));

      if (rowCombined.includes(combinedSearch)) return true;

      return searchableFields.some((field) =>
        fieldMatchesCombinedSearch(field, combinedSearch)
      );
    });
  }, [records, search]);

  const hasData = (records || []).length > 0;

  const onSelectRow = (rec) => {
    setSelectedRecord(rec);
    setShowDetails(true);
  };

  const closeDateText = (() => {
    const raw =
      closeInfo?.closedAt?.toDate?.()
        ? closeInfo.closedAt.toDate()
        : closeInfo?.closedAt || closeInfo?.closeDate || "";
    return formatDateTimePretty(raw);
  })();

  const isClosed = !!closeDateText;

  const doUncloseMonth = async () => {
    try {
      if (unclosing) return;
      if (!selectedMonth) {
        showToast("Select Month", "Select a month first.");
        return;
      }
      if (!isClosed) {
        showToast("Not Closed", "This month is not marked as closed.");
        return;
      }
      if (!hasData) {
        showToast("No Records", "No archived records to restore.");
        return;
      }

      setUnclosing(true);

      const arcSnap = await getDocs(
        collection(db, "archives", selectedMonth, "records")
      );
      const arcDocs = arcSnap.docs;
      if (!arcDocs.length) {
        showToast("No Archived Docs", "No archived docs found.");
        return;
      }

      const currentSnap = await getDocs(collection(db, "records"));
      const existingIds = new Set(currentSnap.docs.map((d) => String(d.id)));

      let restored = 0;
      let skipped = 0;

      let i = 0;
      while (i < arcDocs.length) {
        const batch = writeBatch(db);
        const slice = arcDocs.slice(i, i + 200);

        slice.forEach((d) => {
          const data = d.data() || {};
          const id = String(d.id);

          if (existingIds.has(id)) {
            skipped++;
            return;
          }

          batch.set(doc(db, "records", id), {
            ...data,
            restoredFromArchiveMonth: selectedMonth,
            restoredAt: new Date().toISOString(),
          });

          restored++;
        });

        slice.forEach((d) => {
          batch.delete(
            doc(db, "archives", selectedMonth, "records", String(d.id))
          );
        });

        await batch.commit();
        i += 200;
      }

      await deleteDoc(doc(db, "archives", selectedMonth));

      showToast(
        "Unclosed Successfully",
        `✅ Month: ${formatMonthLabel(selectedMonth)}\nRestored: ${restored}\nSkipped: ${skipped}\nTotal: ${arcDocs.length}`
      );

      setSelectedMonth("");
      setRecords([]);
      setSelectedRecord(null);
      setSearch("");
      setCloseInfo(null);
      setShowDetails(false);

      fetchMonths().catch(() => {});
    } catch (e) {
      console.error("uncloseMonth error:", e);
      showToast("Unclose Failed", `❌ ${e?.message || e}`);
    } finally {
      setUnclosing(false);
      setShowUncloseConfirm(false);
    }
  };

  /** ✅ Same bulk print flow as Records page */
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

  const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginLeft: "auto",
  flexWrap: "wrap",
  justifyContent: "flex-end",
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

  const btnDanger = {
    ...btn,
    border: `1px solid ${C.danger}`,
    background: "#fff1f2",
    color: C.danger,
    opacity: unclosing ? 0.7 : 1,
  };

  const btnRed = {
    ...btn,
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
    flex: 1,
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
    alignItems: "center",
  };

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden" };
  const emptyBox = { padding: 18, color: C.muted, fontWeight: 850 };

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

  const modalTitle =
    selectedRecord?.establishmentName ||
    selectedRecord?.fsicAppNo ||
    `Archive: ${formatMonthLabel(selectedMonth) || ""}`;

  return (
    <div style={page}>
      <TopRightToast
        C={C}
        open={toastOpen}
        title={toastTitle}
        message={toastMsg}
        autoCloseMs={2200}
        onClose={() => setToastOpen(false)}
      />

<div style={header}>
  <div>
    <div style={hTitle}>Archive Records</div>
    <div style={hSub}>
      Select month → search → click row to view details / renew / bulk print
    </div>
  </div>

  <div style={headerRight}>
    {selectedMonth && hasData ? (
      <button
        style={btnRed}
        onClick={() => setShowPrintModal(true)}
        title="Bulk Print"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <HiOutlinePrinter size={16} />
        </span>
      </button>
    ) : null}
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
          <option value="">📁 Select Month</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>

        <input
          style={input}
          placeholder="🔍 Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!selectedMonth || !hasData}
        />

        {selectedMonth && isClosed ? (
          <button
            style={btnDanger}
            onClick={() => setShowUncloseConfirm(true)}
            disabled={unclosing}
          >
            {unclosing ? "Unclosing..." : "Unclose Month"}
          </button>
        ) : null}
      </div>

      <div style={card}>
        <div style={cardHead}>
          <div>
            Month: {selectedMonth ? formatMonthLabel(selectedMonth) : "-"}
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
              No archived records found for <b>{formatMonthLabel(selectedMonth)}</b>.
              <div style={{ marginTop: 8 }}>
                (If month had no records, it auto-deletes the close date so you can close again.)
              </div>
            </div>
          ) : (
            <RecordsTable
              records={filtered}
              apiBase={API}
              onRowClick={(rec) => onSelectRow(rec)}
              activeId={selectedRecord?.id}
            />
          )}
        </div>
      </div>

      <DetailsFullScreen
        open={showDetails}
        title={modalTitle}
        onClose={() => setShowDetails(false)}
      >
        <RecordDetailsPanel
          styles={panelTableStyles}
          record={selectedRecord}
          source={selectedMonth ? `Archive: ${formatMonthLabel(selectedMonth)}` : "Archive"}
          isArchive={true}
          onRenewSaved={({ oldId, newRecord }) => {
            console.log("Renew saved:", oldId, newRecord);
            showToast("Renew Saved", "✅ Renewed record saved successfully.");
          }}
          onUpdated={(updated) => {
            setRecords((prev) =>
              (prev || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
            setSelectedRecord((prev) =>
              prev?.id === updated.id ? { ...prev, ...updated } : prev
            );
            showToast("Updated", "✅ Record updated successfully.");
          }}
        />
      </DetailsFullScreen>

      <PrintSelectionModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        records={filtered}
        onPrintSelected={handlePrintSelected}
      />

      <ConfirmModal
        C={C}
        open={showUncloseConfirm}
        title={`Unclose Month ${formatMonthLabel(selectedMonth) || ""}`}
        message={
          `This will restore archived records back to CURRENT records and remove the archive month (${formatMonthLabel(
            selectedMonth
          )}).\n\nProceed?`
        }
        cancelText="Cancel"
        confirmText="Yes, Unclose"
        danger={true}
        busy={unclosing}
        onCancel={() => !unclosing && setShowUncloseConfirm(false)}
        onConfirm={doUncloseMonth}
      />
    </div>
  );
}