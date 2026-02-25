import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

import ConfirmModal from "../FileManagement/deleteConfirmModal";
import TopRightToast from "../../components/TopRightToast";

export default function RenewedManager({ C, refresh, setRefresh }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ✅ confirm modal + deleting state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Deleted successfully.");

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

  const pickRenewedUpdatedAt = (data, rec) => {
    return (
      toMillisSafe(data?.updatedAt) ||
      toMillisSafe(data?.renewedAt) ||
      toMillisSafe(rec?.updatedAt) ||
      toMillisSafe(rec?.renewedAt) ||
      0
    );
  };

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "renewals"));

      const items = snap.docs
        .map((d) => {
          const data = d.data() || {};
          const rec = data.record && typeof data.record === "object" ? data.record : data;

          const hasSomething =
            rec &&
            (rec.fsicAppNo ||
              rec.ownerName ||
              rec.establishmentName ||
              rec.businessAddress ||
              rec.entityKey ||
              data.entityKey);

          if (!hasSomething) return null;

          const entityKey = data.entityKey || rec.entityKey || d.id;
          const _updatedAt = pickRenewedUpdatedAt(data, rec);

          return {
            _docId: d.id,
            id: entityKey,
            entityKey,
            ...rec,
            _updatedAt,
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b._updatedAt || 0) - (a._updatedAt || 0));

      setRows(items);
    } catch (e) {
      console.error("Renewed load error:", e);
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
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.entityKey || "").toLowerCase().includes(q) ||
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

  const pageRows = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;
  const goPrev = () => canPrev && setPage((p) => Math.max(1, p - 1));
  const goNext = () => canNext && setPage((p) => Math.min(totalPages, p + 1));

  /* ================= DELETE (CONFIRM MODAL) ================= */

  const requestDelete = (r) => {
    setTargetRow(r);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetRow) return;
    setDeleting(true);

    try {
      const renewedDocId = String(targetRow._docId || targetRow.id);
      await deleteDoc(doc(db, "renewals", renewedDocId));

      setRows((prev) => (prev || []).filter((x) => String(x._docId || x.id) !== renewedDocId));

      setConfirmOpen(false);
      setTargetRow(null);

      // ✅ toast
      setToastMsg("Deleted successfully.");
      setToastOpen(true);

      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Delete renewed failed:", e);
      alert(`Delete failed: ${e?.code || ""} ${e?.message || ""}`);
    } finally {
      setDeleting(false);
    }
  };

  /* ===== styles (same as your current) ===== */
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
        title="Delete Renewed"
        subtitle="This will delete ONLY the renewed entry"
        message={
          targetRow
            ? `Delete this renewed entry?\n\nFSIC: ${targetRow.fsicAppNo || "-"}\nOwner: ${targetRow.ownerName || "-"}`
            : "Delete this renewed entry?"
        }
        danger
        busy={deleting}
        cancelText="Cancel"
        confirmText={deleting ? "Deleting..." : "Yes, Delete"}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setTargetRow(null);
        }}
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
            placeholder="🔍 Search renewed..."
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
                <td style={{ ...td, textAlign: "center", color: C.muted, padding: 22 }} colSpan={5}>
                  {loading ? "Loading..." : "No data found."}
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr
                  key={(r._docId || r.id) + ""}
                  style={{
                    ...rowHover,
                    background: idx % 2 === 0 ? "#fff" : "rgba(249,250,251,0.8)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(254,242,242,0.6)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "rgba(249,250,251,0.8)")
                  }
                >
                  <td style={td}>{r.fsicAppNo || "-"}</td>
                  <td style={td}>{r.ownerName || r.title || "-"}</td>
                  <td style={td}>{r.establishmentName || "-"}</td>
                  <td style={td}>{r.businessAddress || "-"}</td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <button onClick={() => requestDelete(r)} style={delBtn} disabled={deleting}>
                      🗑 Delete Renewed
                    </button>
                  </td>
                </tr>
              ))
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
          </div>
          <div />
        </div>
      </div>
    </>
  );
}