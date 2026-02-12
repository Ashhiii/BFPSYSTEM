import React from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* 🔥 BFP COLORS */
const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  softBg: "#fef2f2",
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",

  ioBorder: "#2563eb",
  ioBg: "#eff6ff",
  ioText: "#1d4ed8",

  reBorder: "#fb923c",
  reBg: "#fff7ed",
  reText: "#9a3412",

  nfsiBorder: "#16a34a",
  nfsiBg: "#f0fdf4",
  nfsiText: "#166534",
};

export default function DocumentsTable({ docs = [], onRowClick }) {
  const open = (url, e) => {
    e?.stopPropagation?.();
    window.open(url, "_blank");
  };

  const clamp2 = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.25,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    maxWidth: "100%",
  };

  const S = {
    wrap: { width: "100%", overflowX: "auto" },

    table: {
      width: "100%",
      minWidth: 1100,
      borderCollapse: "separate",
      borderSpacing: 0,
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

    row: { cursor: "pointer", transition: "background .15s ease" },

    actionsTd: {
      padding: "10px 12px",
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: "nowrap",
    },

    btn: {
      padding: "8px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 950,
      cursor: "pointer",
      marginRight: 8,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
      transition: "transform .05s ease, background .15s ease, border .15s ease",
    },

    btnIO: {
      border: `1px solid ${C.ioBorder}`,
      background: C.ioBg,
      color: C.ioText,
    },

    btnReinspect: {
      border: `1px solid ${C.reBorder}`,
      background: C.reBg,
      color: C.reText,
    },

    btnNFSI: {
      border: `1px solid ${C.nfsiBorder}`,
      background: C.nfsiBg,
      color: C.nfsiText,
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
    <div style={S.wrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: 140 }}>FSIC App No</th>
            <th style={{ ...S.th, width: 160 }}>Owner</th>
            <th style={{ ...S.th, width: 180 }}>Establishment</th>
            <th style={{ ...S.th, width: 220 }}>Address</th>
            <th style={{ ...S.th, width: 260 }}>Generate</th>
          </tr>
        </thead>

        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan={5} style={S.empty}>
                No documents found
              </td>
            </tr>
          ) : (
            docs.map((d, i) => (
              <tr
                key={d.id || i}
                style={{
                  ...S.row,
                  background: i % 2 === 0 ? "#fff" : "#fafafa",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")
                }
                onClick={() => onRowClick?.(d)}
              >
                <td style={S.td}>
                  <div style={clamp2} title={d.fsicAppNo || "-"}>
                    {d.fsicAppNo || "-"}
                  </div>
                </td>

                <td style={S.td}>
                  <div style={clamp2} title={d.ownerName || "-"}>
                    {d.ownerName || "-"}
                  </div>
                </td>

                <td style={S.td}>
                  <div style={clamp2} title={d.establishmentName || "-"}>
                    {d.establishmentName || "-"}
                  </div>
                </td>

                <td style={S.td}>
                  <div style={clamp2} title={d.businessAddress || "-"}>
                    {d.businessAddress || "-"}
                  </div>
                </td>

                <td style={S.actionsTd}>
                  <button
                    style={{ ...S.btn, ...S.btnIO }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                   onClick={(e) => open(`${API}/documents/${d.id}/io/pdf`, e)}
                  >
                    IO
                  </button>

                  <button
                    style={{ ...S.btn, ...S.btnReinspect }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                   onClick={(e) => open(`${API}/documents/${d.id}/reinspection/pdf`, e)}

                  >
                    Reinspection
                  </button>

                  <button
                    style={{ ...S.btn, ...S.btnNFSI }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onClick={(e) => open(`${API}/documents/${d.id}/nfsi/pdf`, e)}
                  >
                    NFSI
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
