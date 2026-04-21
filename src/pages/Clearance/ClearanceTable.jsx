import React, { useEffect, useRef, useState } from "react";

export default function ClearanceTable({
  clearances = [],
  onRowClick,
  onEdit,
  onDelete,
  apiBase,
  activeId,
}) {
  const API = import.meta.env.VITE_API_URL || apiBase || "http://localhost:5000";

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
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    select: {
      flex: 1,
      minWidth: 160,
      padding: "8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 800,
      border: `1px solid ${C.border}`,
      background: C.white,
      color: C.text,
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box",
      lineHeight: 1.2,
    },
    btn: {
      padding: "8px 12px",
      borderRadius: 10,
      border: `1px solid ${C.primary}`,
      background: C.primary,
      color: "#fff",
      fontWeight: 900,
      fontSize: 12,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    empty: {
      textAlign: "center",
      padding: 22,
      color: C.muted,
      fontWeight: 800,
    },
  };

  const activeRowRef = useRef(null);
  const [selectedTemplates, setSelectedTemplates] = useState({});

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId]);

  const normalizeType = (item) => {
    const raw = String(
      item?.type || item?.clearanceType || item?.templateType || ""
    ).trim().toUpperCase();

    if (raw === "CONVEYANCE") return "conveyance";
    if (raw === "STORAGE") return "storage";
    if (raw === "HOT_WORKS" || raw === "HOTWORKS") return "hotworks";
    if (raw === "FIRE_DRILL" || raw === "FIREDRILL") return "firedrill";
    if (raw === "FUMIGATION") return "fumigation";
    if (raw === "SEMINAR" || raw === "FSED-SEMINAR") return "seminar";
    if (raw === "FIRE_SAFETY" || raw === "FIRESAFETY") return "firesafety";

    const lower = raw.toLowerCase();
    if (["conveyance", "storage", "hotworks", "firedrill", "fumigation", "seminar", "firesafety"].includes(lower)) {
      return lower;
    }

    return "";
  };

  useEffect(() => {
    const next = {};
    (clearances || []).forEach((item) => {
      const id = String(item?.id || item?.docId || item?._id || "").trim();
      if (!id) return;
      next[id] = normalizeType(item) || "";
    });
    setSelectedTemplates(next);
  }, [clearances]);

  const formatType = (type) => {
    const map = {
      conveyance: "Conveyance Tanker",
      storage: "Storage",
      hotworks: "Hot Works",
      firedrill: "Fire Drill",
      fumigation: "Fumigation",
      seminar: "Seminar",
      firesafety: "Conveyance LPG",
    };
    return map[String(type || "").toLowerCase()] || type || "-";
  };

    const getId = (item) => {
      return String(item?.id || item?.docId || item?._id || "").trim();
    };

    const getPdfUrl = (templateValue, id) => {
      if (!templateValue || !id) return "";

      if (templateValue === "conveyance") return `${API}/clearances/${id}/certificate/conveyance/pdf`;
      if (templateValue === "storage") return `${API}/clearances/${id}/certificate/storage/pdf`;
      if (templateValue === "hotworks") return `${API}/clearances/${id}/certificate/hotworks/pdf`;
      if (templateValue === "firedrill") return `${API}/clearances/${id}/certificate/firedrill/pdf`;
      if (templateValue === "fumigation") return `${API}/clearances/${id}/certificate/fumigation/pdf`;
      if (templateValue === "seminar") return `${API}/clearances/${id}/certificate/seminar/pdf`;
      if (templateValue === "firesafety") return `${API}/clearances/${id}/certificate/firesafety/pdf`;

      return "";
    };

  const handleGenerate = (item, e) => {
    e.stopPropagation();
    const id = getId(item);
    const selected = selectedTemplates[id] || normalizeType(item);
    const url = getPdfUrl(selected, id);

    if (!id || !selected || !url) {
      alert("Missing clearance type or ID.");
      return;
    }

    window.open(url, "_blank");
  };

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>Type</th>
            <th style={{ ...S.th, width: "18%" }}>Establishment</th>
            <th style={{ ...S.th, width: "16%" }}>Owner</th>
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
              const itemType = normalizeType(item);

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
                      e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa";
                    }
                  }}
                  onClick={() => onRowClick?.(item)}
                >
                  <td style={S.td}>
                    <div style={wrap}>{formatType(itemType)}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.establishmentName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.ownerName || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.orNumber || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{item.orDate || "-"}</div>
                  </td>

                  <td style={S.actionsTd}>
                    <div style={S.selectWrap} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={selectedTemplates[rowId] || itemType || ""}
                        style={S.select}
                        onChange={(e) =>
                          setSelectedTemplates((prev) => ({
                            ...prev,
                            [rowId]: e.target.value,
                          }))
                        }
                      >
                        <option value="conveyance">Conveyance Tanker PDF</option>
                        <option value="storage">Storage PDF</option>
                        <option value="hotworks">Hot Works PDF</option>
                        <option value="firedrill">Fire Drill PDF</option>
                        <option value="fumigation">Fumigation PDF</option>
                        <option value="seminar">Seminar PDF</option>
                        <option value="firesafety">Conveyance LPG PDF</option>
                      </select>

                      <button style={S.btn} onClick={(e) => handleGenerate(item, e)}>
                        Generate
                      </button>
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