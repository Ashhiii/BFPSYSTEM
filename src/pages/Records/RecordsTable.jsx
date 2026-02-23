// ✅ RecordsTable.jsx (FULL) — with highlight + safe PDF open (fix "record not found" when id missing)
// ✅ Added: disable buttons if r.id missing + show tiny warning badge
import React, { useEffect, useRef } from "react";

export default function RecordsTable({
  records = [],
  onRowClick,
  apiBase,
  activeId, // ✅ highlight row id
}) {
  const API = (apiBase || "http://localhost:5000").replace(/\/+$/, "");

  // ✅ safer open (stop row click + noopener)
  const open = (url, e) => {
    e?.stopPropagation?.();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const wrap = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    softBg: "#fef2f2",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    ownerBg: "#fff7ed",
    ownerBorder: "#fb923c",
    bfpBg: "#fef2f2",
  };

  const S = {
    tableWrap: {
      width: "100%",
      height: "100%",
      overflow: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      background: "#fff",
    },

    th: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      textAlign: "left",
      fontSize: 12,
      fontWeight: 900,
      color: C.primaryDark,
      background: C.softBg,
      padding: "12px",
      borderBottom: `2px solid ${C.primary}`,
    },

    td: {
      padding: "12px",
      fontSize: 13,
      fontWeight: 700,
      borderBottom: `1px solid ${C.border}`,
      color: C.text,
      verticalAlign: "middle",
    },

    row: {
      cursor: "pointer",
      transition: "background .15s ease, box-shadow .15s ease",
    },

    actionsTd: {
      padding: "10px",
      borderBottom: `1px solid ${C.border}`,
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    btn: {
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      cursor: "pointer",
      marginRight: 6,
      border: `1px solid ${C.border}`,
      background: "#fff",
    },

    btnOwner: {
      border: `1px solid ${C.ownerBorder}`,
      background: C.ownerBg,
      color: "#9a3412",
    },

    btnBfp: {
      border: `1px solid ${C.primary}`,
      background: C.bfpBg,
      color: C.primaryDark,
    },

    btnDisabled: {
      opacity: 0.55,
      cursor: "not-allowed",
    },

    warn: {
      display: "inline-block",
      marginLeft: 6,
      padding: "4px 8px",
      borderRadius: 999,
      border: `1px solid ${C.border}`,
      color: C.muted,
      fontSize: 11,
      fontWeight: 900,
      background: "#fff",
      verticalAlign: "middle",
    },

    empty: {
      textAlign: "center",
      padding: 22,
      color: C.muted,
      fontWeight: 800,
    },
  };

  // ✅ auto-scroll to highlighted row
  const activeRowRef = useRef(null);
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId]);

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>FSIC App No</th>
            <th style={{ ...S.th, width: "15%" }}>Nature</th>
            <th style={{ ...S.th, width: "15%" }}>Owner</th>
            <th style={{ ...S.th, width: "15%" }}>Establishment</th>
            <th style={{ ...S.th, width: "23%" }}>Address</th>
            <th style={{ ...S.th, width: "10%" }}>Date</th>
            <th style={{ ...S.th, width: "30%" }}>Generate</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={7} style={S.empty}>
                No records found
              </td>
            </tr>
          ) : (
            records.map((r, i) => {
              const isActive = activeId && r.id === activeId;
              const rid = r?.id; // ✅ must exist for PDF endpoints
              const disabled = !rid;

              return (
                <tr
                  key={rid || i}
                  ref={isActive ? activeRowRef : null}
                  style={{
                    ...S.row,
                    background: isActive
                      ? "#ffe4e6" // ✅ highlight
                      : i % 2 === 0
                      ? "#fff"
                      : "#fafafa",
                    boxShadow: isActive ? "inset 0 0 0 2px #b91c1c" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#fff1f2";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        i % 2 === 0 ? "#fff" : "#fafafa";
                  }}
                  onClick={() => onRowClick?.(r)}
                >
                  <td style={S.td}>
                    <div style={wrap}>{r.fsicAppNo || "-"}</div>
                  </td>
                  <td style={S.td}>
                    <div style={wrap}>{r.natureOfInspection || "-"}</div>
                  </td>
                  <td style={S.td}>
                    <div style={wrap}>{r.ownerName || "-"}</div>
                  </td>
                  <td style={S.td}>
                    <div style={wrap}>{r.establishmentName || "-"}</div>
                  </td>
                  <td style={S.td}>
                    <div style={wrap}>{r.businessAddress || "-"}</div>
                  </td>
                  <td style={S.td}>
                    <div style={wrap}>{r.dateInspected || "-"}</div>
                  </td>

                  <td style={S.actionsTd}>
                    <button
                      style={{
                        ...S.btn,
                        ...S.btnOwner,
                        ...(disabled ? S.btnDisabled : {}),
                      }}
                      disabled={disabled}
                      title={disabled ? "Missing record id" : "Open Owner PDF"}
                      onClick={(e) => {
                        if (disabled) return;
                        open(`${API}/records/${rid}/certificate/owner/pdf`, e);
                      }}
                    >
                      Owner PDF
                    </button>

                    <button
                      style={{
                        ...S.btn,
                        ...S.btnBfp,
                        ...(disabled ? S.btnDisabled : {}),
                      }}
                      disabled={disabled}
                      title={disabled ? "Missing record id" : "Open BFP PDF"}
                      onClick={(e) => {
                        if (disabled) return;
                        open(`${API}/records/${rid}/certificate/bfp/pdf`, e);
                      }}
                    >
                      BFP PDF
                    </button>

                    {disabled && <span style={S.warn}>⚠️ no id</span>}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}