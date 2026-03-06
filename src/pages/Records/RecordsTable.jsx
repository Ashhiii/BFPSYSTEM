import React, { useEffect, useRef } from "react";

export default function RecordsTable({
  records = [],
  onRowClick,
  apiBase,
  activeId,
}) {
  const API = (apiBase || "http://localhost:5000").replace(/\/+$/, "");

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
    },

    select: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 800,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
      outline: "none",
      cursor: "pointer",
    },

    empty: {
      textAlign: "center",
      padding: 22,
      color: C.muted,
      fontWeight: 800,
    },
  };

  const activeRowRef = useRef(null);

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId]);

  const handleGenerateChange = (value, record, e) => {
    e.stopPropagation();
    if (!value) return;

    let url = "";

    if (value === "owner") {
      url = `${API}/records/${record.id}/certificate/owner/pdf`;
    } else if (value === "bfp") {
      url = `${API}/records/${record.id}/certificate/bfp/pdf`;
    } else if (value === "owner-new") {
      url = `${API}/records/${record.id}/certificate/owner-new/pdf`;
    } else if (value === "bfp-new") {
      url = `${API}/records/${record.id}/certificate/bfp-new/pdf`;
    }

    if (url) {
      window.open(url, "_blank");
    }

    e.target.value = "";
  };

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>FSIC App No</th>
            <th style={{ ...S.th, width: "15%" }}>Nature</th>
            <th style={{ ...S.th, width: "12%" }}>IO No</th>
            <th style={{ ...S.th, width: "15%" }}>Owner</th>
            <th style={{ ...S.th, width: "18%" }}>Establishment</th>
            <th style={{ ...S.th, width: "13%" }}>FSIC No</th>
            <th style={{ ...S.th, width: "10%" }}>Date</th>
            <th style={{ ...S.th, width: "25%" }}>Generate</th>
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
            records.map((r, i) => {
              const isActive = activeId && r.id === activeId;

              return (
                <tr
                  key={r.id || i}
                  ref={isActive ? activeRowRef : null}
                  style={{
                    ...S.row,
                    background: isActive
                      ? "#ffe4e6"
                      : i % 2 === 0
                      ? "#fff"
                      : "#fafafa",
                    boxShadow: isActive ? "inset 0 0 0 2px #b91c1c" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#fff1f2";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        i % 2 === 0 ? "#fff" : "#fafafa";
                    }
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
                    <div style={wrap}>{r.ioNumber || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{r.ownerName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{r.establishmentName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{r.fsicNo || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{r.dateInspected || "-"}</div>
                  </td>

                  <td style={S.actionsTd}>
                    <select
                      defaultValue=""
                      style={S.select}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleGenerateChange(e.target.value, r, e)}
                    >
                      <option value="" disabled>
                        Select template...
                      </option>
                      <option value="owner">Owner PDF</option>
                      <option value="bfp">BFP PDF</option>
                      <option value="owner-new">New Owner PDF</option>
                      <option value="bfp-new">New BFP PDF</option>
                    </select>
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