import React from "react";

export default function RecordsTable({ records = [], onRowClick }) {
  const open = (url, e) => {
    e.stopPropagation();
    window.open(url, "_blank");
  };

  const wrap2 = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  };

  /* 🔥 BFP COLORS */
  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    accent: "#f59e0b",
    softBg: "#fef2f2",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    ownerBg: "#fff7ed",
    ownerBorder: "#fb923c",
    bfpBg: "#fef2f2",
    bfpBorder: "#b91c1c",
  };

  const S = {
    tableWrap: { width: "100%", overflowX: "auto" },

    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      minWidth: 980,
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 14,
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
      padding: "12px 12px",
      borderBottom: `2px solid ${C.primary}`,
      whiteSpace: "nowrap",
    },

    td: {
      padding: "12px 12px",
      fontSize: 13,
      fontWeight: 700,
      verticalAlign: "top",
      borderBottom: `1px solid ${C.border}`,
      color: C.text,
    },

    row: {
      cursor: "pointer",
      transition: "background .15s ease",
    },

    actionsTd: {
      padding: "10px 12px",
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: "nowrap",
    },

    btn: {
      padding: "8px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      cursor: "pointer",
      marginRight: 8,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
      transition: "transform .05s ease, background .15s ease, border .15s ease",
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

    empty: {
      textAlign: "center",
      padding: 22,
      color: C.muted,
      background: "#fff",
      fontWeight: 800,
    },
  };

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: 60 }}>No</th>
            <th style={{ ...S.th, width: 130 }}>FSIC App No</th>
            <th style={{ ...S.th, width: 170 }}>Nature of Inspection</th>
            <th style={{ ...S.th, width: 180 }}>Owner</th>
            <th style={{ ...S.th, width: 180 }}>Establishment</th>
            <th style={{ ...S.th, width: 240 }}>Address</th>
            <th style={{ ...S.th, width: 140 }}>Date Inspected</th>
            <th style={{ ...S.th, width: 220 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} style={S.empty}>
                No records found
              </td>
            </tr>
          ) : (
            records.map((r, i) => (
              <tr
                key={r.id || i}
                style={{
                  ...S.row,
                  background: i % 2 === 0 ? "#fff" : "#fafafa",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fff1f2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    i % 2 === 0 ? "#fff" : "#fafafa")
                }
                onClick={() => onRowClick?.(r)}
              >
                <td style={S.td}><div style={wrap2}>{r.no || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.fsicAppNo || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.natureOfInspection || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.ownerName || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.establishmentName || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.businessAddress || "-"}</div></td>
                <td style={S.td}><div style={wrap2}>{r.dateInspected || "-"}</div></td>

                <td style={S.actionsTd}>
                  <button
                    style={{ ...S.btn, ...S.btnOwner }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onClick={(e) =>
                      open(
                        `http://localhost:5000/records/${r.id}/certificate/owner/pdf`,
                        e
                      )
                    }
                  >
                    Owner PDF
                  </button>

                  <button
                    style={{ ...S.btn, ...S.btnBfp }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onClick={(e) =>
                      open(
                        `http://localhost:5000/records/${r.id}/certificate/bfp/pdf`,
                        e
                      )
                    }
                  >
                    BFP PDF
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
