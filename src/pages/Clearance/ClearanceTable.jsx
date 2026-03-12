import React, { useEffect, useRef } from "react";

export default function ClearanceTable({
  clearances = [],
  onRowClick,
  onEdit,
  onDelete,
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
    white: "#ffffff",
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

    selectWrap: {
      position: "relative",
      width: "100%",
      maxWidth: 180,
    },

    select: {
      width: "100%",
      padding: "8px 34px 8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 800,
      border: `1px solid ${C.border}`,
      background: C.white,
      color: C.text,
      outline: "none",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      boxSizing: "border-box",
      lineHeight: 1.2,
    },

    selectArrow: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      fontSize: 10,
      color: C.muted,
      fontWeight: 900,
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

  const formatType = (type) => {
    const map = {
      conveyance: "Conveyance",
      storage: "Storage",
      hotworks: "Hot Works",
      firedrill: "Fire Drill",
      fumigation: "Fumigation",
    };
    return map[String(type || "").toLowerCase()] || type || "-";
  };

  const getId = (item) => {
    return String(item?.id || item?.docId || item?._id || "").trim();
  };

  const getTypeValue = (item) =>
    String(item?.type || item?.clearanceType || "").toLowerCase().trim();

  const handleGenerateChange = (value, item, e) => {
    e.stopPropagation();

    const id = getId(item);

    console.log("CLEARANCE ITEM:", item);
    console.log("CLEARANCE ID:", id);
    console.log("SELECTED TEMPLATE:", value);

    if (!value || !id) {
      alert("Missing clearance ID.");
      e.target.value = "";
      return;
    }

    let url = "";

    if (value === "conveyance") {
      url = `${API}/clearances/${id}/certificate/conveyance/pdf`;
    } else if (value === "storage") {
      url = `${API}/clearances/${id}/certificate/storage/pdf`;
    } else if (value === "hotworks") {
      url = `${API}/clearances/${id}/certificate/hotworks/pdf`;
    } else if (value === "firedrill") {
      url = `${API}/clearances/${id}/certificate/firedrill/pdf`;
    } else if (value === "fumigation") {
      url = `${API}/clearances/${id}/certificate/fumigation/pdf`;
    }

    if (!url) {
      alert("Invalid template.");
      e.target.value = "";
      return;
    }

    window.open(url, "_blank");
    e.target.value = "";
  };

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>Type</th>
            <th style={{ ...S.th, width: "14%" }}>FSIC App No</th>
            <th style={{ ...S.th, width: "18%" }}>Establishment</th>
            <th style={{ ...S.th, width: "16%" }}>Owner</th>
            <th style={{ ...S.th, width: "18%" }}>Address</th>
            <th style={{ ...S.th, width: "10%" }}>OR No</th>
            <th style={{ ...S.th, width: "10%" }}>OR Date</th>
            <th style={{ ...S.th, width: "20%" }}>Generate</th>
          </tr>
        </thead>

        <tbody>
          {clearances.length === 0 ? (
            <tr>
              <td colSpan={8} style={S.empty}>
                No clearances found
              </td>
            </tr>
          ) : (
            clearances.map((item, i) => {
              const rowId = getId(item);
              const isActive = activeId && rowId === activeId;
              const itemType = getTypeValue(item);

              return (
                <tr
                  key={rowId || i}
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
                  onClick={() => onRowClick?.(item)}
                >
                  <td style={S.td}>
                    <div style={wrap}>{formatType(itemType)}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>
                      {item.FSIC_APP_NO || item.fsicAppNo || "-"}
                    </div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.establishmentName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.ownerName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.businessAddress || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.orNumber || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.orDate || "-"}</div>
                  </td>

                  <td style={S.actionsTd}>
                    <div
                      style={S.selectWrap}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        defaultValue=""
                        style={S.select}
                        onChange={(e) =>
                          handleGenerateChange(e.target.value, item, e)
                        }
                      >
                        <option value="" disabled>
                          Select template
                        </option>
                        <option value="conveyance">Conveyance PDF</option>
                        <option value="storage">Storage PDF</option>
                        <option value="hotworks">Hot Works PDF</option>
                        <option value="firedrill">Fire Drill PDF</option>
                        <option value="fumigation">Fumigation PDF</option>
                      </select>

                      <span style={S.selectArrow}>▼</span>
                    </div>
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