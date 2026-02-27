// ✅ RecentRecords.jsx — POLISHED DESIGN (glass + clean pagination + active highlight)
// - 4 items per page (from Dashboard slice)
// - Pagination top-right
// - Active (clicked) row highlight

import React from "react";
import { HiOutlineChevronRight } from "react-icons/hi";

export default function RecentRecords({
  C,
  loading,
  list,
  onOpen,
  activeId, // ✅ IMPORTANT
  page,
  setPage,
  total,
  pageSize,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const canPaginate = !loading && (total || 0) > (pageSize || 1);

  const card = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    boxShadow: C.shadow,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const headerRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const headerTitle = {
    fontSize: 14,
    fontWeight: 950,
    color: C.text,
    letterSpacing: 0.2,
  };
  const headerSub = { fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 2 };

  const pager = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  };

  const pagePill = {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.70)",
    color: C.muted,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };

  const btn = (disabled) => ({
    padding: "7px 12px",
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: disabled ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    fontSize: 12,
    fontWeight: 950,
    color: C.text,
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
  });

  const listWrap = { display: "flex", flexDirection: "column", gap: 10 };

  const baseRow = {
    padding: "12px 12px",
    borderRadius: 18,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease",
  };

  const leftInfo = { minWidth: 0, display: "flex", flexDirection: "column", gap: 4 };

  const title = {
    fontSize: 13,
    fontWeight: 950,
    color: C.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const sub = {
    fontSize: 11,
    fontWeight: 850,
    color: C.muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const rightSide = { display: "flex", alignItems: "center", gap: 8 };

  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(185,28,28,0.10)",
    color: C.primaryDark,
    fontSize: 11,
    fontWeight: 980,
    border: `1px solid ${C.border}`,
    maxWidth: 140,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const chevron = {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.70)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const emptyBox = {
    padding: 14,
    borderRadius: 18,
    border: `1px dashed ${C.border}`,
    background: "rgba(255,255,255,0.55)",
    color: C.muted,
    fontSize: 12,
    fontWeight: 850,
  };

  const skeleton = (i) => ({
    height: 54,
    borderRadius: 18,
    border: `1px solid ${C.border}`,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
    backgroundSize: "200% 100%",
    animation: `shimmer 1.1s ease-in-out ${i * 0.08}s infinite`,
  });

  const css = `
    @keyframes shimmer {
      0% { background-position: 0% 0%; }
      100% { background-position: -200% 0%; }
    }
  `;

  return (
    <div style={card}>
      <style>{css}</style>

      {/* Header + Pagination */}
      <div style={headerRow}>
        <div style={{ minWidth: 0 }}>
          <div style={headerTitle}>Recent Records</div>
          <div style={headerSub}>Latest added records (4 per page)</div>
        </div>

        {canPaginate && (
          <div style={pager}>
            <button
              style={btn(page === 1)}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>

            <div style={pagePill}>
              Page {page} / {totalPages}
            </div>

            <button
              style={btn(page >= totalPages)}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div style={listWrap}>
        {loading ? (
          <>
            <div style={skeleton(0)} />
            <div style={skeleton(1)} />
            <div style={skeleton(2)} />
            <div style={skeleton(3)} />
          </>
        ) : list?.length ? (
          list.map((r) => {
            const isActive = String(activeId || "") === String(r.id || "");

            const rowStyle = {
              ...baseRow,
              borderColor: isActive ? "rgba(185,28,28,0.55)" : C.border,
              background: isActive ? "rgba(185,28,28,0.12)" : baseRow.background,
              boxShadow: isActive ? "0 14px 26px rgba(185,28,28,0.14)" : "none",
            };

            return (
              <div
                key={r.id}
                style={rowStyle}
                onClick={() => onOpen?.(r.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = isActive
                    ? "0 14px 26px rgba(185,28,28,0.16)"
                    : "0 12px 24px rgba(2,6,23,0.10)";
                  e.currentTarget.style.background = isActive
                    ? "rgba(185,28,28,0.14)"
                    : "rgba(255,255,255,0.92)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isActive
                    ? "0 14px 26px rgba(185,28,28,0.14)"
                    : "none";
                  e.currentTarget.style.background = isActive
                    ? "rgba(185,28,28,0.12)"
                    : "rgba(255,255,255,0.78)";
                }}
              >
                <div style={leftInfo}>
                  <div style={title}>{r.establishmentName || r.fsicAppNo || "Record"}</div>
                  <div style={sub}>
                    {r.ownerName ? `Owner: ${r.ownerName} • ` : ""}
                    {r.natureOfInspection ? `${r.natureOfInspection} • ` : ""}
                    {r.dateText || ""}
                  </div>
                </div>

                <div style={rightSide}>
                  <div style={chip} title={r.fsicAppNo || "FSIC"}>
                    {r.fsicAppNo || "FSIC"}
                  </div>

                  <div style={chevron}>
                    <HiOutlineChevronRight size={18} color="rgba(15,23,42,0.50)" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={emptyBox}>No recent records found.</div>
        )}
      </div>
    </div>
  );
}