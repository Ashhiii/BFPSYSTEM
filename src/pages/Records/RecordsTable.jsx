import React, { useEffect, useMemo, useRef, useState } from "react";
import TopRightToast from "../../components/TopRightToast";

export default function RecordsTable({
  records = [],
  onRowClick,
  apiBase,
  activeId,
  onBulkUpdate,
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
    selectedBg: "#fee2e2",
    selectedBorder: "#dc2626",
    selectedText: "#7f1d1d",
  };

  const S = {
    tableWrap: {
      width: "100%",
      height: "100%",
      overflow: "auto",
      position: "relative",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      background: "#fff",
      userSelect: "none",
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

    fsicCell: {
      cursor: "cell",
      position: "relative",
      borderLeft: "1px solid transparent",
      borderRight: "1px solid transparent",
      transition: "all .12s ease",
    },

    fsicCellSelected: {
      background: C.selectedBg,
      boxShadow: `inset 0 0 0 2px ${C.selectedBorder}`,
      color: C.selectedText,
    },

    pasteHint: {
      padding: "10px 12px",
      fontSize: 12,
      fontWeight: 800,
      color: C.primaryDark,
      background: "#fff7f7",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: C.softBg,
      color: C.primaryDark,
      fontSize: 11,
      fontWeight: 900,
      border: `1px solid #fecaca`,
    },

    headerFilterWrap: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      width: "100%",
      justifyContent: "space-between",
    },

    headerFilterRight: {
      position: "relative",
      flexShrink: 0,
    },

    headerArrowBtn: {
      width: 28,
      minWidth: 28,
      height: 26,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: "#000",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 900,
      lineHeight: 1,
    },

    headerDropdown: {
      position: "absolute",
      top: "calc(100% + 8px)",
      right: 0,
      width: 150,
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      boxShadow: "0 12px 28px rgba(0,0,0,.12)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      overflow: "visible",
    },

    headerDropdownBtn: {
      display: "block",
      width: "100%",
      border: "none",
      background: "#fff",
      color: "#000",
      textAlign: "left",
      padding: "12px",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      borderBottom: `1px solid ${C.border}`,
    },

    headerDropdownBtnActive: {
      background: "#fee2e2",
      color: "#7f1d1d",
    },
  };

  const activeRowRef = useRef(null);
  const containerRef = useRef(null);
  const pasteBoxRef = useRef(null);
  const fsicMenuRef = useRef(null);

  const [selectedFsicRows, setSelectedFsicRows] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [fsicFilterMode, setFsicFilterMode] = useState("all");
  const [fsicMenuOpen, setFsicMenuOpen] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [undoStack, setUndoStack] = useState([]);

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

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId, fsicFilterMode]);

  const sortedSelectedRows = useMemo(() => {
    return [...selectedFsicRows].sort((a, b) => a - b);
  }, [selectedFsicRows]);

  const visibleRows = useMemo(() => {
    if (fsicFilterMode === "selected") {
      return sortedSelectedRows
        .map((originalIndex) => ({
          row: records[originalIndex],
          originalIndex,
        }))
        .filter((item) => item.row);
    }

    return records.map((row, originalIndex) => ({
      row,
      originalIndex,
    }));
  }, [records, fsicFilterMode, sortedSelectedRows]);

  const clearSelection = () => {
    setSelectedFsicRows([]);
    setLastSelectedIndex(null);
  };

  const handleFsicCellClick = (rowIndex, e) => {
    e.stopPropagation();

    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    setSelectedFsicRows((prev) => {
      let next = [...prev];

      if (isShift && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, rowIndex);
        const end = Math.max(lastSelectedIndex, rowIndex);
        const range = [];
        for (let i = start; i <= end; i++) range.push(i);

        if (isCtrl) {
          const set = new Set([...prev, ...range]);
          next = [...set];
        } else {
          next = range;
        }
      } else if (isCtrl) {
        if (next.includes(rowIndex)) {
          next = next.filter((i) => i !== rowIndex);
        } else {
          next.push(rowIndex);
        }
      } else {
        next = [rowIndex];
      }

      return next.sort((a, b) => a - b);
    });

    setLastSelectedIndex(rowIndex);

    setTimeout(() => {
      pasteBoxRef.current?.focus();
    }, 0);
  };

  const handlePaste = (e) => {
    if (!selectedFsicRows.length) return;

    const text = e.clipboardData.getData("text");
    if (!text) return;

    e.preventDefault();

    const values = text
      .replace(/\r/g, "")
      .split(/\n|\t/)
      .map((v) => v.trim())
      .filter((v) => v !== "");

    if (!values.length) return;
    if (typeof onBulkUpdate !== "function") return;

    const updated = [...records];
    setUndoStack((prev) => [...prev, records]);

    const targetRows = [...selectedFsicRows].sort((a, b) => a - b);

    if (values.length === 1) {
      targetRows.forEach((rowIndex) => {
        if (updated[rowIndex]) {
          updated[rowIndex] = {
            ...updated[rowIndex],
            fsicNo: values[0],
          };
        }
      });
    } else {
      targetRows.forEach((rowIndex, i) => {
        if (updated[rowIndex] && values[i] !== undefined) {
          updated[rowIndex] = {
            ...updated[rowIndex],
            fsicNo: values[i],
          };
        }
      });
    }

    onBulkUpdate(updated);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (undoStack.length && typeof onBulkUpdate === "function") {
          const last = undoStack[undoStack.length - 1];
          setUndoStack((prev) => prev.slice(0, -1));
          onBulkUpdate(last);
          return;
        }
      }

      if (selectedFsicRows.length && (e.key === "Delete" || e.key === "Backspace")) {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();

        if (tag === "input" || tag === "textarea" || tag === "select") return;

        const updated = [...records];

        selectedFsicRows.forEach((rowIndex) => {
          if (updated[rowIndex]) {
            updated[rowIndex] = {
              ...updated[rowIndex],
              fsicNo: "",
            };
          }
        });

        onBulkUpdate(updated);
      }

      if (e.key === "Escape") {
        clearSelection();
        setFsicMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFsicRows, records, onBulkUpdate, undoStack]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fsicMenuRef.current && !fsicMenuRef.current.contains(e.target)) {
        setFsicMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      style={S.tableWrap}
      onClick={(e) => {
        const clickedInsideFsicCell = e.target.closest?.("[data-fsic-cell='true']");
        const clickedInsideHeaderFilter = e.target.closest?.("[data-fsic-header-filter='true']");
        if (!clickedInsideFsicCell && !clickedInsideHeaderFilter) {
          clearSelection();
        }
      }}
    >
      <TopRightToast
        C={C}
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <textarea
        ref={pasteBoxRef}
        onPaste={handlePaste}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          left: -99999,
          top: -99999,
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />

      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>FSIC App No</th>
            <th style={{ ...S.th, width: "15%" }}>Nature</th>
            <th style={{ ...S.th, width: "12%" }}>IO No</th>
            <th style={{ ...S.th, width: "15%" }}>Owner</th>
            <th style={{ ...S.th, width: "18%" }}>Establishment</th>

            <th style={{ ...S.th, width: "13%" }}>
              <div style={S.headerFilterWrap}>
                <span style={{ ...wrap, fontWeight: 900 }}>FSIC No</span>

                <div
                  ref={fsicMenuRef}
                  style={S.headerFilterRight}
                  data-fsic-header-filter="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    style={S.headerArrowBtn}
                    onClick={() => setFsicMenuOpen((prev) => !prev)}
                    title="Filter FSIC rows"
                  >
                    ▼
                  </button>

                  {fsicMenuOpen && (
                    <div style={S.headerDropdown}>
                      <button
                        type="button"
                        style={{
                          ...S.headerDropdownBtn,
                          ...(fsicFilterMode === "all" ? S.headerDropdownBtnActive : {}),
                        }}
                        onClick={() => {
                          setFsicFilterMode("all");
                          setFsicMenuOpen(false);
                        }}
                      >
                        All
                      </button>

                      <button
                        type="button"
                        style={{
                          ...S.headerDropdownBtn,
                          ...(fsicFilterMode === "selected"
                            ? S.headerDropdownBtnActive
                            : {}),
                          borderBottom: "none",
                        }}
                        onClick={() => {
                          if (selectedFsicRows.length === 0) {
                            setToast({
                              open: true,
                              title: "No Rows Selected",
                              message: "Highlight rows first before filtering.",
                            });
                            return;
                          }
                          setFsicFilterMode("selected");
                          setFsicMenuOpen(false);
                        }}
                      >
                        Highlighted
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </th>

            <th style={{ ...S.th, width: "10%" }}>Date</th>
            <th style={{ ...S.th, width: "25%" }}>Generate</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={8} style={S.empty}>
                {fsicFilterMode === "selected"
                  ? "No selected rows to show"
                  : "No records found"}
              </td>
            </tr>
          ) : (
            visibleRows.map(({ row: r, originalIndex }, visibleIndex) => {
              const isActive = activeId && r.id === activeId;
              const isFsicSelected = selectedFsicRows.includes(originalIndex);

              return (
                <tr
                  key={r.id || originalIndex}
                  ref={isActive ? activeRowRef : null}
                  style={{
                    ...S.row,
                    background: isActive
                      ? "#ffe4e6"
                      : visibleIndex % 2 === 0
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
                        visibleIndex % 2 === 0 ? "#fff" : "#fafafa";
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

                  <td
                    data-fsic-cell="true"
                    style={{
                      ...S.td,
                      ...S.fsicCell,
                      ...(isFsicSelected ? S.fsicCellSelected : {}),
                    }}
                    onClick={(e) => handleFsicCellClick(originalIndex, e)}
                    title="Click / Ctrl+Click / Shift+Click then paste"
                  >
                    <div style={wrap}>{r.fsicNo || "-"}</div>
                  </td>

                  <td style={S.td}>
                    <div style={wrap}>{r.dateInspected || "-"}</div>
                  </td>

                  <td style={S.actionsTd}>
                    <div
                      style={S.selectWrap}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        defaultValue=""
                        style={S.select}
                        onChange={(e) => handleGenerateChange(e.target.value, r, e)}
                      >
                        <option value="" disabled>
                          Select template
                        </option>
                        <option value="owner">Renew Owner PDF</option>
                        <option value="bfp">Renew BFP PDF</option>
                        <option value="owner-new">New Owner PDF</option>
                        <option value="bfp-new">New BFP PDF</option>
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