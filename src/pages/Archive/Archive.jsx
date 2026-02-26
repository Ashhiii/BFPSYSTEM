// src/pages/Archive/Archive.jsx
// ✅ Updates:
// 1) Unclose uses ConfirmModal (glass) instead of window.confirm
// 2) Success/Error uses your TopRightToast (same design)
// 3) DetailsFullScreen stays as-is (modal already ok). If you want the same glass modal too, tell me.

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
import { db } from "../../firebase";

import RecordsTable from "../Records/RecordsTable.jsx";
import injectTableStyles from "../Records/injectTableStyles.jsx";
import RecordDetailsPanel from "../Records/RecordDetailsPanel.jsx";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";

import ConfirmModal from "../../components/ConfirmModal.jsx"; // adjust if needed
import TopRightToast from "../../components/TopRightToast.jsx"; // ✅ your toast

export default function Archive() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);

  // ✅ FULLSCREEN DETAILS
  const [showDetails, setShowDetails] = useState(false);

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

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
   * ✅ Behavior:
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
      setShowDetails(false);
      return;
    }

    setSelectedMonth(m);
    setSelectedRecord(null);
    setSearch("");
    setRecords([]);
    setCloseInfo(null);
    setShowDetails(false);

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
      setShowDetails(false);

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

  // ✅ on row click -> open fullscreen
  const onSelectRow = (rec) => {
    setSelectedRecord(rec);
    setShowDetails(true);
  };

  // ✅ close date string
  const closeDateText =
    closeInfo?.closedAt?.toDate?.()
      ? closeInfo.closedAt.toDate().toLocaleString()
      : closeInfo?.closedAt || closeInfo?.closeDate || "";

  // ✅ treat month as "closed" if closedAt exists
  const isClosed = !!closeDateText;

  /**
   * ✅ UN-CLOSE core logic (no confirm here)
   */
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

      // 1) read all archived docs for this month
      const arcSnap = await getDocs(collection(db, "archives", selectedMonth, "records"));
      const arcDocs = arcSnap.docs;
      if (!arcDocs.length) {
        showToast("No Archived Docs", "No archived docs found.");
        return;
      }

      // 2) build a set of existing current record IDs (to avoid overwriting)
      const currentSnap = await getDocs(collection(db, "records"));
      const existingIds = new Set(currentSnap.docs.map((d) => String(d.id)));

      let restored = 0;
      let skipped = 0;

      // 3) batch restore + delete archive docs (chunked)
      let i = 0;
      while (i < arcDocs.length) {
        const batch = writeBatch(db);
        const slice = arcDocs.slice(i, i + 200); // 200 => safe (set+delete = 400 writes)

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

        // delete archive docs for ALL in slice (even if skipped restore)
        slice.forEach((d) => {
          batch.delete(doc(db, "archives", selectedMonth, "records", String(d.id)));
        });

        await batch.commit();
        i += 200;
      }

      // 4) delete month doc itself (removes closedAt)
      await deleteDoc(doc(db, "archives", selectedMonth));

      // ✅ Success toast
      showToast(
        "Unclosed Successfully",
        `✅ Restored: ${restored}\nSkipped: ${skipped}\nTotal: ${arcDocs.length}`
      );

      // 5) reset UI + refresh months
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
    `Archive: ${selectedMonth || ""}`;

  return (
    <div style={page}>
      {/* ✅ TOAST (your design) */}
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
            Select month → search → click row to view details / renew • (Unclose available if closed)
          </div>
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

        {/* ✅ Unclose button shows ONLY if month closed */}
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
            Month: {selectedMonth ? selectedMonth : "-"}
            {selectedMonth && !hasData ? (
              <span style={{ marginLeft: 10, color: C.muted }}>(No records)</span>
            ) : null}
          </div>

          <div style={{ opacity: 0.85, color: C.muted }}>
            Results: {filtered.length}
            {closeDateText ? <span style={{ marginLeft: 12 }}>• Closed: {closeDateText}</span> : null}
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
              onRowClick={(rec) => onSelectRow(rec)}
              activeId={selectedRecord?.id}
            />
          )}
        </div>
      </div>

      {/* ✅ FULL SCREEN DETAILS */}
      <DetailsFullScreen
        open={showDetails}
        title={modalTitle}
        onClose={() => setShowDetails(false)}
      >
        <RecordDetailsPanel
          styles={panelTableStyles}
          record={selectedRecord}
          source={selectedMonth ? `Archive: ${selectedMonth}` : "Archive"}
          isArchive={true}
          onRenewSaved={({ oldId, newRecord }) => {
            console.log("Renew saved:", oldId, newRecord);
            showToast("Renew Saved", "✅ Renewed record saved successfully.");
          }}
          onUpdated={(updated) => {
            setRecords((prev) =>
              (prev || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
            setSelectedRecord((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
            showToast("Updated", "✅ Record updated successfully.");
          }}
        />
      </DetailsFullScreen>

      {/* ✅ UN-CLOSE CONFIRM MODAL (glass) */}
      <ConfirmModal
        C={C}
        open={showUncloseConfirm}
        title={`Unclose Month ${selectedMonth || ""}`}
        message={
          "This will restore archived records back to CURRENT records and remove the archive month.\n\nProceed?"
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