// src/pages/ClearanceManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

import ConfirmModal from "../FileManagement/deleteConfirmModal";
import TopRightToast from "../../components/TopRightToast";

export default function ClearanceManager({ C, refresh, setRefresh }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // confirm modal + deleting state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // bulk confirm
  const [bulkTargets, setBulkTargets] = useState([]);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Deleted successfully.");

  // selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

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

  const pickClearanceUpdatedAt = (data) => {
    return (
      toMillisSafe(data?.updatedAt) ||
      toMillisSafe(data?.createdAt) ||
      toMillisSafe(data?.dateIssued) ||
      0
    );
  };

  const rowKey = (r) => String(r?._docId || r?.id || "");
  const isSelected = (r) => selected.has(rowKey(r));
  const selectedCount = selected.size;

  const toggleRow = (r) => {
    const k = rowKey(r);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAllPage = (pageRows) =>
    setSelected((prev) => {
      const next = new Set(prev);
      (pageRows || []).forEach((r) => next.add(rowKey(r)));
      return next;
    });

  const unselectAllPage = (pageRows) =>
    setSelected((prev) => {
      const next = new Set(prev);
      (pageRows || []).forEach((r) => next.delete(rowKey(r)));
      return next;
    });

  const selectAllFiltered = (filtered) =>
    setSelected(() => new Set((filtered || []).map((r) => rowKey(r))));

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "clearances"));

      const items = snap.docs
        .map((d) => {
          const data = d.data() || {};

          const hasSomething =
            data &&
            (data.fsicAppNo ||
              data.fsicNumber ||
              data.ownerName ||
              data.establishmentName ||
              data.businessAddress ||
              data.clearanceType ||
              d.id);

          if (!hasSomething) return null;

          return {
            _docId: d.id,
            id: d.id,
            ...data,
            _updatedAt: pickClearanceUpdatedAt(data),
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b._updatedAt || 0) - (a._updatedAt || 0));

      setRows(items);
    } catch (e) {
      console.error("Clearance load error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return (rows || []).filter((r) => {
      return (
        (r.clearanceType || "").toLowerCase().includes(q) ||
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.fsicNumber || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.plateNumber || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  useEffect(() => setPage(1), [search, refresh, pageSize]);

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

  /* ================= DELETE ================= */

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
        const clearanceDocId = String(r._docId || r.id);
        await deleteDoc(doc(db, "clearances", clearanceDocId));
      }

      const delKeys = new Set(list.map((r) => rowKey(r)));
      setRows((prev) => (prev || []).filter((x) => !delKeys.has(rowKey(x))));

      setConfirmOpen(false);
      setTargetRow(null);
      setBulkTargets([]);
      clearSelection();

      setToastMsg(
        list.length > 1
          ? `Deleted ${list.length} clearance item(s).`
          : "Deleted successfully."
      );
      setToastOpen(true);

      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Delete clearance failed:", e);
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

  /* ================= styles ================= */

  const toolRow = {
    display: "flex",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const toolLeft = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  };

  const toolRight = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  };

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
    maxHeight: 440,
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

  const showing = {
    fontSize: 12,
    fontWeight: 900,
    color: C.muted,
  };

  return (
    <>
      <ConfirmModal
        C={C}
        open={confirmOpen}
        title={bulkTargets?.length ? "Delete Selected Clearance" : "Delete Clearance"}
        subtitle={
          bulkTargets?.length
            ? "This will delete ONLY clearance entries (bulk)"
            : "This will delete ONLY the clearance entry"
        }
        message={
          bulkTargets?.length
            ? `Delete ${bulkTargets.length} selected clearance entry(s)?`
            : targetRow
            ? `Delete this clearance entry?\n\nType: ${targetRow.clearanceType || "-"}\nOwner: ${targetRow.ownerName || "-"}`
            : "Delete this clearance entry?"
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
        title="Deleted"
        message={toastMsg}
        autoCloseMs={1400}
        onClose={() => setToastOpen(false)}
      />

      <div style={toolRow}>
        <div style={toolLeft}>
          <input
            placeholder="🔍 Search clearance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />

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
                <button style={pagerBtnBox(false)} onClick={clearSelection}>
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
              <th style={th}>Type</th>
              <th style={th}>FSIC</th>
              <th style={th}>Owner</th>
              <th style={th}>Establishment</th>
              <th style={th}>Address</th>
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
                    key={String(r._docId || r.id) + ":" + idx}
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

                    <td style={td}>{r.clearanceType || "-"}</td>
                    <td style={td}>{r.fsicAppNo || r.fsicNumber || "-"}</td>
                    <td style={td}>{r.ownerName || "-"}</td>
                    <td style={td}>{r.establishmentName || "-"}</td>
                    <td style={td}>{r.businessAddress || "-"}</td>

                    <td style={{ ...td, textAlign: "center" }}>
                      {!selectMode ? (
                        <button
                          onClick={() => requestDelete(r)}
                          style={delBtn}
                          disabled={deleting}
                        >
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