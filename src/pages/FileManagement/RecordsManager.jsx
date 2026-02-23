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

export default function RecordsManager({ C, refresh, setRefresh }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ ONLY FILTER: MONTH
  const [month, setMonth] = useState("all"); // all | YYYY-MM | UNKNOWN

  // ✅ PAGINATION
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    // priority: closeMonth/closedMonth/monthKey -> createdAt -> dateInspected
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
          all.push({
            id: d.id,
            _docId: d.id,
            _source: "records",
            ...data,
          });
        });
      } catch (e) {}

      // B1) records_archive (if exists)
      try {
        const qyA = query(
          collection(db, "records_archive"),
          orderBy("createdAt", "desc")
        );
        const snapA = await getDocs(qyA);
        snapA.docs.forEach((d) => {
          const data = d.data() || {};
          all.push({
            id: d.id,
            _docId: d.id,
            _source: "records_archive",
            ...data,
          });
        });
      } catch (e) {}

      // B2) archives/{month}/records (Close Month style)
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
  // months ONLY from archive sources
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

  // values: all, current, YYYY-MM...
  return ["all", "current", ...months];
}, [rows]);

  /* ================= SEARCH + MONTH FILTER ================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (rows || []).filter((r) => {
    // ✅ Month filter
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

  useEffect(() => {
    setPage(1);
  }, [search, month, refresh, pageSize]);

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

  /* ================= DELETE (PERMANENT) ================= */

  const deleteRow = async (r) => {
    if (!window.confirm("Delete this item permanently?")) return;

    try {
      if (r._source === "records") {
        await deleteDoc(doc(db, "records", String(r._docId || r.id)));
      } else if (r._source === "records_archive") {
        await deleteDoc(doc(db, "records_archive", String(r._docId || r.id)));
      } else if (String(r._source || "").startsWith("archives/")) {
        const parts = String(r._source).split("/");
        const monthId = parts[1];
        await deleteDoc(doc(db, "archives", monthId, "records", String(r._docId || r.id)));
      }

      setRows((prev) =>
        (prev || []).filter(
          (x) => !(String(x._docId || x.id) === String(r._docId || r.id) && x._source === r._source)
        )
      );

      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Delete failed:", e);
      alert(`Delete failed: ${e?.code || ""} ${e?.message || ""}`);
    }
  };

  /* ================= STYLES (SAME AS YOUR ORIGINAL) ================= */

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

  const rowHover = {
    transition: "background 0.12s ease",
  };

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
      {/* ✅ TOP TOOLS: SAME DESIGN */}
      <div style={toolRow}>
        <div style={toolLeft}>
          <input
            placeholder="🔍 Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />

          {/* ✅ Month filter only */}
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={select} title="Month">
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
          <div style={statPill}>{loading ? "Loading..." : `${total} item(s)`}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              style={pagerBtnBox(!canPrev)}
              onClick={goPrev}
              disabled={!canPrev}
              onMouseEnter={(e) => {
                if (!canPrev) return;
                e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Prev
            </button>

            <div style={pagerPageBox}>
              Page {safePage} / {totalPages}
            </div>

            <button
              style={pagerBtnBox(!canNext)}
              onClick={goNext}
              disabled={!canNext}
              onMouseEnter={(e) => {
                if (!canNext) return;
                e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* TABLE + STICKY FOOTER (SAME DESIGN) */}
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
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
                <td style={{ ...td, textAlign: "center", color: C.muted, padding: 22 }} colSpan={6}>
                  {loading ? "Loading..." : "No data found."}
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr
                  key={(r._source || "") + ":" + (r._docId || r.id) + ":" + idx}
                  style={{
                    ...rowHover,
                    background: idx % 2 === 0 ? "#fff" : "rgba(249,250,251,0.8)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(254,242,242,0.6)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      idx % 2 === 0 ? "#fff" : "rgba(249,250,251,0.8)")
                  }
                >
                  <td style={td}>{r.fsicAppNo || "-"}</td>
                  <td style={td}>{r.ownerName || r.title || "-"}</td>
                  <td style={td}>{r.establishmentName || "-"}</td>
                  <td style={td}>{r.businessAddress || "-"}</td>
                  <td style={td}>{r._month || "UNKNOWN"}</td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <button
                      onClick={() => deleteRow(r)}
                      style={delBtn}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 14px 22px rgba(220,38,38,0.14)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 10px 18px rgba(0,0,0,0.05)")
                      }
                    >
                      🗑 Delete
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