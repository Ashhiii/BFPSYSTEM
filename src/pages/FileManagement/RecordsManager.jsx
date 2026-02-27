// src/pages/RecordsManager.jsx (FULL) — Row-click toggle + Select All Filtered + Bulk Delete
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  orderBy,
  query,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

import ConfirmModal from "../FileManagement/deleteConfirmModal";
import TopRightToast from "../../components/TopRightToast";

export default function RecordsManager({ C, refresh, setRefresh }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ ONLY FILTER: MONTH
  const [month, setMonth] = useState("all"); // all | current | YYYY-MM | UNKNOWN

  // ✅ PAGINATION
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ✅ Modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [targetRow, setTargetRow] = useState(null);

  // ✅ Bulk targets for confirm (selection delete)
  const [bulkTargets, setBulkTargets] = useState([]);

  // ✅ Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Deleted successfully.");

  // ✅ Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set()); // store row keys

  /* ================= HELPERS ================= */

  const toMillisSafe = (v) => {
    if (v?.toMillis) return v.toMillis();
    if (v instanceof Date) return v.getTime();
    if (typeof v === "string") {
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : 0;
    }
    if (typeof v === "number") return v;
    return 0;
  };

  const getMonthKey = (data) => {
    const cm = String(
      data?.closeMonth || data?.closedMonth || data?.monthKey || ""
    ).trim();
    if (/^\d{4}-\d{2}$/.test(cm)) return cm;

    const ms =
      toMillisSafe(data?.createdAt) || toMillisSafe(data?.dateInspected) || 0;
    if (!ms) return "UNKNOWN";

    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  // unique key per row (source + docId)
  const rowKey = (r) =>
    `${String(r?._source || "")}::${String(r?._docId || r?.id || "")}`;

  const isSelected = (r) => selected.has(rowKey(r));

  const toggleRow = (r) => {
    const k = rowKey(r);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAllPage = (pageRows) => {
    setSelected((prev) => {
      const next = new Set(prev);
      (pageRows || []).forEach((r) => next.add(rowKey(r)));
      return next;
    });
  };

  const unselectAllPage = (pageRows) => {
    setSelected((prev) => {
      const next = new Set(prev);
      (pageRows || []).forEach((r) => next.delete(rowKey(r)));
      return next;
    });
  };

  const selectAllFiltered = (filtered) => {
    setSelected(() => new Set((filtered || []).map((r) => rowKey(r))));
  };

  const unselectAllFiltered = () => clearSelection();

  const selectedCount = selected.size;

  /* ================= LOAD ALL RECORDS (records + archive) ================= */

  const load = async () => {
    setLoading(true);
    try {
      const all = [];

      // A) records
      try {
        const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
        const snap = await getDocs(qy);
        snap.docs.forEach((d) => {
          const data = d.data() || {};
          all.push({ id: d.id, _docId: d.id, _source: "records", ...data });
        });
      } catch (e) {}

      // B1) records_archive
      try {
        const qyA = query(
          collection(db, "records_archive"),
          orderBy("createdAt", "desc")
        );
        const snapA = await getDocs(qyA);
        snapA.docs.forEach((d) => {
          const data = d.data() || {};
          all.push({ id: d.id, _docId: d.id, _source: "records_archive", ...data });
        });
      } catch (e) {}

      // B2) archives/{month}/records
      try {
        const monthsSnap = await getDocs(collection(db, "archives"));
        for (const mDoc of monthsSnap.docs) {
          const monthId = mDoc.id;
          try {
            const recSnap = await getDocs(
              collection(db, "archives", monthId, "records")
            );
            recSnap.docs.forEach((d) => {
              const data = d.data() || {};
              all.push({
                id: d.id,
                _docId: d.id,
                _source: `archives/${monthId}/records`,
                closeMonth:
                  data.closeMonth || data.closedMonth || data.monthKey || monthId,
                ...data,
              });
            });
          } catch (inner) {}
        }
      } catch (e) {}

      const items = all
        .map((x) => ({ ...x, _month: getMonthKey(x) }))
        .sort((a, b) => {
          const am = toMillisSafe(a.createdAt) || toMillisSafe(a.dateInspected) || 0;
          const bm = toMillisSafe(b.createdAt) || toMillisSafe(b.dateInspected) || 0;
          return bm - am;
        });

      setRows(items);
    } catch (e) {
      console.error("RecordsManager load error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [refresh]);

  /* ================= MONTH OPTIONS ================= */

  const monthOptions = useMemo(() => {
    const set = new Set(
      (rows || [])
        .filter(
          (r) =>
            r._source === "records_archive" ||
            String(r._source || "").startsWith("archives/")
        )
        .map((r) => r._month || "UNKNOWN")
    );

    const months = Array.from(set).filter(Boolean).sort().reverse();
    return ["all", "current", ...months];
  }, [rows]);

  /* ================= SEARCH + MONTH FILTER ================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (rows || []).filter((r) => {
      if (month === "current") {
        if (r._source !== "records") return false;
      } else if (month !== "all") {
        const mk = r._month || "UNKNOWN";
        if (mk !== month) return false;
      }

      if (!q) return true;

      return (
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.entityKey || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, month]);

  useEffect(() => setPage(1), [search, month, refresh, pageSize]);

  /* ================= PAGINATION ================= */

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const pageRows = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;
  const goPrev = () => canPrev && setPage((p) => Math.max(1, p - 1));
  const goNext = () => canNext && setPage((p) => Math.min(totalPages, p + 1));

  /* ================= DELETE via MODAL ================= */

  const requestDelete = (r) => {
    if (selectMode) {
      toggleRow(r);
      return;
    }
    setTargetRow(r);
    setBulkTargets([]);
    setConfirmOpen(true);
  };

  const requestDeleteSelected = () => {
    const picked = (rows || []).filter((r) => selected.has(rowKey(r)));
    if (picked.length === 0) {
      setToastMsg("No selected items.");
      setToastOpen(true);
      return;
    }
    setBulkTargets(picked);
    setTargetRow(null);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const list = bulkTargets?.length ? bulkTargets : targetRow ? [targetRow] : [];
    if (list.length === 0) return;

    setDeleting(true);

    try {
      for (const r of list) {
        if (r._source === "records") {
          await deleteDoc(doc(db, "records", String(r._docId || r.id)));
        } else if (r._source === "records_archive") {
          await deleteDoc(doc(db, "records_archive", String(r._docId || r.id)));
        } else if (String(r._source || "").startsWith("archives/")) {
          const parts = String(r._source).split("/");
          const monthId = parts[1];
          await deleteDoc(
            doc(db, "archives", monthId, "records", String(r._docId || r.id))
          );
        }
      }

      const delKeys = new Set(list.map((r) => rowKey(r)));

      setRows((prev) => (prev || []).filter((x) => !delKeys.has(rowKey(x))));

      // ✅ close modal + reset
      setConfirmOpen(false);
      setTargetRow(null);
      setBulkTargets([]);

      // ✅ selection reset
      clearSelection();

      setToastMsg(list.length > 1 ? `Deleted ${list.length} items.` : "Deleted successfully.");
      setToastOpen(true);

      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Delete failed:", e);
      alert(`Delete failed: ${e?.code || ""} ${e?.message || ""}`);
    } finally {
      setDeleting(false);
    }
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setTargetRow(null);
    setBulkTargets([]);
  };

  /* ================= STYLES (same) ================= */

  const toolRow = {
    display: "flex",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const toolLeft = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
  const toolRight = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };

  const input = {
    flex: "0 0 240px",
    width: 240,
    minWidth: 200,
    padding: "11px 12px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    outline: "none",
    fontWeight: 900,
    color: C.text,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
  };

  const select = {
    padding: "11px 12px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    fontSize: 12,
    fontWeight: 950,
    color: C.text,
    background: "rgba(255,255,255,0.92)",
    outline: "none",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
  };

  const statPill = {
    padding: "11px 12px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    fontSize: 12,
    fontWeight: 950,
    color: C.muted,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
  };

  const pagerBtnBox = (disabled) => ({
    padding: "10px 16px",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.95)",
    fontWeight: 950,
    fontSize: 13,
    color: disabled ? C.muted : C.text,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.04)",
    transition: "0.15s ease",
    opacity: disabled ? 0.6 : 1,
    whiteSpace: "nowrap",
  });

  const pagerPageBox = {
    padding: "10px 18px",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#ffffff",
    fontWeight: 950,
    fontSize: 13,
    color: C.text,
    boxShadow: "0 6px 14px rgba(0,0,0,0.04)",
    whiteSpace: "nowrap",
  };

  const tableWrap = {
    overflow: "auto",
    maxHeight: 700,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
  };

  const th = {
    textAlign: "left",
    padding: 12,
    fontSize: 12,
    fontWeight: 950,
    color: C.primaryDark,
    borderBottom: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.96)",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 3,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  const td = {
    padding: 12,
    fontSize: 13,
    fontWeight: 850,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "top",
    background: "#fff",
  };

  const rowHover = { transition: "background 0.12s ease" };

  const delBtn = {
    border: `1px solid rgba(220,38,38,0.6)`,
    background: "rgba(255,255,255,0.95)",
    color: C.danger,
    borderRadius: 12,
    padding: "7px 10px",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(0,0,0,0.05)",
    transition: "transform .12s ease, box-shadow .12s ease",
    whiteSpace: "nowrap",
  };

  const stickyFooter = {
    position: "sticky",
    bottom: 0,
    zIndex: 5,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderTop: `1px solid ${C.border}`,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  };

  const showing = { fontSize: 12, fontWeight: 900, color: C.muted };

  return (
    <>
      <ConfirmModal
        C={C}
        open={confirmOpen}
        title={bulkTargets?.length ? "Delete Selected" : "Delete Record"}
        subtitle={bulkTargets?.length ? "Permanent delete (bulk)" : "Permanent delete"}
        message={
          bulkTargets?.length
            ? `Delete permanently ${bulkTargets.length} selected record(s)?`
            : targetRow
            ? `Delete permanently this record?\n\nFSIC: ${targetRow.fsicAppNo || "-"}\nOwner: ${targetRow.ownerName || "-"}`
            : "Delete this item?"
        }
        danger
        busy={deleting}
        cancelText="Cancel"
        confirmText={deleting ? "Deleting..." : "Yes, Delete"}
        onCancel={closeConfirm}
        onConfirm={confirmDelete}
      />

      <TopRightToast
        C={{ border: "rgba(226,232,240,1)", text: "#0f172a", muted: "#64748b" }}
        open={toastOpen}
        title={bulkTargets?.length ? "Deleted Selected" : "Deleted"}
        message={toastMsg}
        autoCloseMs={1400}
        onClose={() => setToastOpen(false)}
      />

      <div style={toolRow}>
        <div style={toolLeft}>
          <input
            placeholder="🔍 Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={select}
            title="Month"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m === "all" ? "All months" : m === "current" ? "Current" : m}
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={select}
            title="Rows per page"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div style={toolRight}>
          {/* ✅ Selection controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              style={pagerBtnBox(false)}
              onClick={() => {
                setSelectMode((v) => !v);
                clearSelection();
              }}
            >
              {selectMode ? "Cancel Selection" : "Delete Selection"}
            </button>

            {selectMode && (
              <>
                <button style={pagerBtnBox(false)} onClick={() => selectAllPage(pageRows)}>
                  Select page
                </button>
                <button style={pagerBtnBox(false)} onClick={() => unselectAllPage(pageRows)}>
                  Unselect page
                </button>

                <button style={pagerBtnBox(false)} onClick={() => selectAllFiltered(filtered)}>
                  Select all filtered ({filtered.length})
                </button>
                <button style={pagerBtnBox(false)} onClick={unselectAllFiltered}>
                  Clear all
                </button>

                <button
                  style={{
                    ...pagerBtnBox(selectedCount === 0),
                    border: "1px solid rgba(220,38,38,0.5)",
                    color: selectedCount === 0 ? C.muted : C.danger,
                  }}
                  disabled={selectedCount === 0}
                  onClick={requestDeleteSelected}
                >
                  🗑 Delete Selected ({selectedCount})
                </button>
              </>
            )}
          </div>

          <div style={statPill}>{loading ? "Loading..." : `${total} item(s)`}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button style={pagerBtnBox(!canPrev)} onClick={goPrev} disabled={!canPrev}>
              Prev
            </button>

            <div style={pagerPageBox}>
              Page {safePage} / {totalPages}
            </div>

            <button style={pagerBtnBox(!canNext)} onClick={goNext} disabled={!canNext}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {selectMode && <th style={{ ...th, width: 46, textAlign: "center" }}>✓</th>}
              <th style={th}>FSIC</th>
              <th style={th}>Owner</th>
              <th style={th}>Establishment</th>
              <th style={th}>Address</th>
              <th style={th}>Month</th>
              <th style={{ ...th, textAlign: "center" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  style={{ ...td, textAlign: "center", color: C.muted, padding: 22 }}
                  colSpan={selectMode ? 7 : 6}
                >
                  {loading ? "Loading..." : "No data found."}
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => {
                const checked = isSelected(r);
                return (
                  <tr
                    key={(r._source || "") + ":" + (r._docId || r.id) + ":" + idx}
                    style={{
                      ...rowHover,
                      background: checked
                        ? "rgba(254,226,226,0.55)"
                        : idx % 2 === 0
                        ? "#fff"
                        : "rgba(249,250,251,0.8)",
                      cursor: selectMode ? "pointer" : "default",
                    }}
                    onMouseEnter={(e) => {
                      if (checked) return;
                      e.currentTarget.style.background = "rgba(254,242,242,0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = checked
                        ? "rgba(254,226,226,0.55)"
                        : idx % 2 === 0
                        ? "#fff"
                        : "rgba(249,250,251,0.8)";
                    }}
                    // ✅ Row click toggles selection ONLY in selectMode
                    onClick={() => {
                      if (!selectMode) return;
                      toggleRow(r);
                    }}
                  >
                    {selectMode && (
                      <td style={{ ...td, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(r)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}

                    <td style={td}>{r.fsicAppNo || "-"}</td>
                    <td style={td}>{r.ownerName || r.title || "-"}</td>
                    <td style={td}>{r.establishmentName || "-"}</td>
                    <td style={td}>{r.businessAddress || "-"}</td>
                    <td style={td}>{r._month || "UNKNOWN"}</td>

                    <td style={{ ...td, textAlign: "center" }}>
                      {!selectMode ? (
                        <button onClick={() => requestDelete(r)} style={delBtn}>
                          🗑 Delete
                        </button>
                      ) : (
                        <span style={{ fontWeight: 900, color: C.muted, fontSize: 12 }}>
                          click row to select
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={stickyFooter}>
          <div style={showing}>
            Showing{" "}
            <span style={{ color: C.text }}>
              {total === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, total)}
            </span>{" "}
            of <span style={{ color: C.text }}>{total}</span>
            {selectMode && (
              <>
                {" "}
                • Selected: <span style={{ color: C.text }}>{selectedCount}</span>
              </>
            )}
          </div>
          <div />
        </div>
      </div>
    </>
  );
}