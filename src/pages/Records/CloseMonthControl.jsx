// src/pages/Records/CloseMonthControl.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import ConfirmModal from "../../components/closemonthmodal.jsx";

/** ✅ Month key in PH timezone -> "YYYY-MM" */
const monthKeyNow = () => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/** ✅ Convert "YYYY-MM" -> "February 2026" */
const formatMonthLabel = (yyyy_mm) => {
  if (!yyyy_mm) return "";
  const [y, m] = String(yyyy_mm).split("-");
  const monthIndex = Number(m) - 1;

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  if (!y || monthIndex < 0 || monthIndex > 11) return String(yyyy_mm);
  return `${months[monthIndex]} ${y}`;
};

/** ✅ Build last N months list (YYYY-MM) */
const buildMonthOptions = (count = 24) => {
  const base = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  base.setDate(1);

  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setMonth(base.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
};

/** ✅ safe millis for fallback sort */
const toMillis = (v) => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (v?.toMillis) return v.toMillis(); // Firestore Timestamp
  if (v instanceof Date) return v.getTime();
  return 0;
};

/** ✅ DISPLAY FIELDS (edit these to match your Firestore columns) */
const getBusiness = (r) =>
  r?.establishment ||
  r?.businessName ||
  r?.establishmentName ||
  r?.business ||
  "No Establishment";

const getOwner = (r) =>
  r?.owner ||
  r?.ownerName ||
  r?.owner_name ||
  r?.lessor ||
  r?.operator ||
  "—";

const getFsic = (r) =>
  r?.fsicAppNo ||
  r?.fsicNo ||
  r?.fsicNumber ||
  r?.fsic_app_no ||
  r?.fsic ||
  "—";

/** ✅ Search text */
const searchableText = (r) => {
  const parts = [
    getBusiness(r),
    getOwner(r),
    getFsic(r),
    r?.address || r?.location || "",
  ];
  return parts.join(" ").toLowerCase();
};

export default function CloseMonthControl({
  C,
  buttonStyle,
  showToast,
  fetchCurrent,
  onAfterCloseUIReset,
  setRefresh,
}) {
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const monthOptions = useMemo(() => buildMonthOptions(24), []);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyNow());

  // ✅ current records list
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);

  // ✅ search + selection
  const [qText, setQText] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const loadRows = async () => {
    try {
      setLoadingRows(true);

      // ✅ newest -> oldest (preferred)
      let snap;
      try {
        // change "createdAt" if your timestamp field name is different
        const qq = query(collection(db, "records"), orderBy("createdAt", "desc"));
        snap = await getDocs(qq);
      } catch (err) {
        // fallback if field missing / no index
        snap = await getDocs(collection(db, "records"));
      }

      let arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ✅ fallback newest->oldest (common fields)
      arr.sort((a, b) => {
        const aT =
          toMillis(a.createdAt) ||
          toMillis(a.dateCreated) ||
          toMillis(a.timestamp) ||
          toMillis(a.created_at);
        const bT =
          toMillis(b.createdAt) ||
          toMillis(b.dateCreated) ||
          toMillis(b.timestamp) ||
          toMillis(b.created_at);
        return bT - aT;
      });

      setRows(arr);

      // keep only valid selections
      setSelectedIds((prev) => {
        const next = new Set();
        arr.forEach((r) => prev.has(r.id) && next.add(r.id));
        return next;
      });
    } catch (e) {
      console.error("loadRows error:", e);
      showToast?.("Load Failed", "❌ Could not load current records.");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    if (showCloseConfirm) loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCloseConfirm]);

  const filtered = useMemo(() => {
    const s = qText.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => searchableText(r).includes(s));
  }, [rows, qText]);

  const selectedCount = selectedIds.size;

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const clearVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) clearVisible();
    else selectVisible();
  };

  const doCloseMonth = async () => {
    try {
      if (closing) return;
      setClosing(true);

      const month = selectedMonth || monthKeyNow();
      const monthDocRef = doc(db, "archives", month);

      const monthDoc = await getDoc(monthDocRef);
      const alreadyClosed = monthDoc.exists() && monthDoc.data()?.closedAt;

      if (rows.length === 0) {
        showToast?.("No Records", "No records to archive.");
        return;
      }

      if (selectedCount === 0) {
        showToast?.("No Selection", "Please select at least 1 record to archive.");
        return;
      }

      // ensure month doc exists + closedAt (set once)
      if (!alreadyClosed) {
        await setDoc(
          monthDocRef,
          { month, closedAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await setDoc(monthDocRef, { month }, { merge: true });
      }

      // selected rows only
      const selectedRows = rows.filter((r) => selectedIds.has(r.id));

      let i = 0;
      while (i < selectedRows.length) {
        const batch = writeBatch(db);
        const slice = selectedRows.slice(i, i + 200);

        slice.forEach((r) => {
          const { id, ...data } = r;

          batch.set(doc(db, "archives", month, "records", id), {
            ...data,
            archivedAt: new Date().toISOString(),
          });

          batch.delete(doc(db, "records", id));
        });

        await batch.commit();
        i += 200;
      }

      onAfterCloseUIReset?.();
      setSelectedIds(new Set());
      setQText("");

      showToast?.(
        "Archived Successfully",
        `✅ Archived ${selectedRows.length} record(s) into ${formatMonthLabel(month)}.`
      );

      await fetchCurrent?.();
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Close Month error:", e);
      showToast?.("Close Month Failed", "❌ Check Firestore rules / console.");
    } finally {
      setClosing(false);
      setShowCloseConfirm(false);
    }
  };

  /* ===================== CLEAN UI STYLES ===================== */

const modalWrap = {
  width: "min(980px, 96vw)",
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowX: "hidden",     // ✅ prevent horizontal overflow
};
const gridTop = {
  display: "grid",
  gridTemplateColumns: "1fr", // ✅ stack by default
  gap: 10,
  alignItems: "end",
};

  const miniLabel = {
    fontSize: 12,
    fontWeight: 900,
    color: C.muted,
    marginBottom: 6,
  };

  const selectStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    fontWeight: 900,
    outline: "none",
    cursor: "pointer",
  };

  const searchStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: "#fff",
    fontWeight: 850,
    outline: "none",
  };

  const actionsRow = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const ghostBtn = {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: "#f9fafb",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const dangerGhostBtn = {
    ...ghostBtn,
    background: "#fff5f5",
    border: "1px solid #fecaca",
    color: "#b91c1c",
  };

  const listContainer = {
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
  };

  const listHeader = {
    padding: "12px 14px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    fontWeight: 950,
    fontSize: 13,
    background: "#f9fafb",
  };

  const scrollBox = {
    maxHeight: 420,
    overflowY: "auto",
  };

  const rowStyle = (active) => ({
    padding: "12px 14px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    background: active ? "#fef2f2" : "#fff",
    cursor: "pointer",
  });

  const titleStyle = {
    fontWeight: 950,
    fontSize: 14,
    color: C.text,
    lineHeight: 1.2,
  };

  const subStyle = {
    fontSize: 12,
    fontWeight: 800,
    color: C.muted,
    marginTop: 4,
    lineHeight: 1.3,
  };

  const checkboxStyle = {
    width: 18,
    height: 18,
    marginTop: 2,
    cursor: "pointer",
  };

  const helperText = {
    fontSize: 12,
    fontWeight: 850,
    color: C.muted,
    marginTop: 2,
  };

  /* responsive: stack top grid on small screens */
  const topResponsive = `
    @media (max-width: 820px) {
      .cm-gridTop { grid-template-columns: 1fr !important; }
    }
  `;

  return (
    <>
      <button
        style={{ ...buttonStyle, opacity: closing ? 0.7 : 1 }}
        onClick={() => setShowCloseConfirm(true)}
        disabled={closing}
      >
        {closing ? "Closing..." : "Close Month"}
      </button>

      <ConfirmModal
        C={C}
        open={showCloseConfirm}
        title="Close Month"
        message={
          <div style={modalWrap}>
            <style>{topResponsive}</style>

            {/* TOP: month + search */}
            <div className="cm-gridTop" style={gridTop}>
              <div>
                <div style={miniLabel}>Month to close</div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={selectStyle}
                  disabled={closing}
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
                <div style={helperText}>
                  Target: <b>{formatMonthLabel(selectedMonth)}</b>
                </div>
              </div>

              <div>
                <div style={miniLabel}>Search</div>
                <input
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Search establishment, owner, FSIC/IO..."
                  style={searchStyle}
                  disabled={closing || loadingRows}
                />
                <div style={helperText}>
                  Showing <b>{filtered.length}</b> record(s) • Selected{" "}
                  <b>{selectedCount}</b>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={actionsRow}>
              <button
                type="button"
                style={ghostBtn}
                onClick={selectVisible}
                disabled={closing || loadingRows || filtered.length === 0}
              >
                Select visible
              </button>

              <button
                type="button"
                style={dangerGhostBtn}
                onClick={clearVisible}
                disabled={closing || loadingRows || filtered.length === 0}
              >
                Clear visible
              </button>

              <button
                type="button"
                style={ghostBtn}
                onClick={loadRows}
                disabled={closing || loadingRows}
              >
                {loadingRows ? "Refreshing..." : "Refresh list"}
              </button>
            </div>

            {/* LIST */}
            <div style={listContainer}>
              <div style={listHeader}>
                <span>{filtered.length} record(s)</span>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 900,
                    color: C.muted,
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={closing || loadingRows || filtered.length === 0}
                  />
                  Select all visible
                </label>
              </div>

              <div style={scrollBox}>
                {loadingRows ? (
                  <div style={{ padding: 14, fontWeight: 900, color: C.muted }}>
                    Loading records...
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 14, fontWeight: 900, color: C.muted }}>
                    No matching records.
                  </div>
                ) : (
                  filtered.map((r) => {
                    const active = selectedIds.has(r.id);

                    return (
                      <div
                        key={r.id}
                        style={rowStyle(active)}
                        onClick={() => !closing && toggleOne(r.id)}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = "#fff";
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={titleStyle}>{getBusiness(r)}</div>
                          <div style={subStyle}>
                            Owner: {getOwner(r)} • FSIC APP: {getFsic(r)}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleOne(r.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={closing}
                          style={checkboxStyle}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText={
          selectedCount
            ? `Archive Selected (${selectedCount}) → ${formatMonthLabel(selectedMonth)}`
            : "Select records first"
        }
        danger={true}
        busy={closing}
        onCancel={() => !closing && setShowCloseConfirm(false)}
        onConfirm={doCloseMonth}
      />
    </>
  );
}