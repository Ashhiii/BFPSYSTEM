import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopRightToast from "../../components/TopRightToast";

const normalizeText = (value) => String(value || "").trim().toUpperCase();

const normalizeDuplicateKey = (value) => normalizeText(value);

const parseToDate = (value) => {
  if (!value) return null;

  if (typeof value === "object" && value?.toDate) {
    const dt = value.toDate();
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const s = String(value).trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const getStartOfDay = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
};

const getEndOfDay = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

const isNatureNTC = (value) => normalizeText(value).includes("NTC");
const isNatureClosed = (value) => normalizeText(value).includes("CLOSED");

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
};

const getFirstExistingValue = (row, keys = []) => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row || {}, key)) continue;
    return row?.[key];
  }
  return undefined;
};

const getRemarksValue = (row) => {
  return getFirstExistingValue(row, ["remarks", "remark", "Remarks", "Remark"]);
};

const getMissingTemplateFields = (row) => {
  const requiredFields = [
    { label: "Height", keys: ["height", "buildingHeight"] },
    { label: "High Rise", keys: ["highRise", "highrise"] },
    { label: "No. of Storey", keys: ["noOfStorey", "noOfStoreys", "numberOfStorey"] },
    { label: "FSMR", keys: ["fsmr"] },
    { label: "Type of Occupancy", keys: ["typeOfOccupancy", "occupancyType"] },
    {label: "Defects", keys: ["defects"]},
  ];

  return requiredFields
    .filter((field) => isEmptyValue(getFirstExistingValue(row, field.keys)))
    .map((field) => field.label);
};

const REMARK_OPTIONS = [
  { value: "", label: "All" },
  { value: "FSIC", label: "FSIC" },
  { value: "TRANSFERRED", label: "TRANSFERRED" },
  { value: "CLOSED", label: "CLOSED" },
  { value: "CAN'T BE LOCATED", label: "CAN'T BE LOCATED" },
  { value: "REFUSED", label: "REFUSED" },
  { value: "NTC", label: "NTC" },
  { value: "NTCV", label: "NTCV" },
  { value: "ON AFFIDAVIT", label: "ON AFFIDAVIT" },
  { value: "ABATEMENT", label: "ABATEMENT" },
  { value: "CLOSURE", label: "CLOSURE" },
];

const matchesRemarksFilter = (remarksValue, filter) => {
  if (!filter || filter === "ALL") return true;

  const text = normalizeText(remarksValue);
  const normalizedFilter = normalizeText(filter);

  return text.includes(normalizedFilter);
};

export default function RecordsTable({
  records = [],
  onRowClick,
  apiBase,
  activeId,
  onBulkUpdate,
  onVisibleCountChange,
  onAutoSave,
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

    ntcText: "#ffffff",
    ntcBorder: "#dc2626",
    ntcRowBg: "#d13737",

    closedText: "#ff1616",
    closedBorder: "#ff1616",

    duplicateText: "#d97706",
    duplicateBorder: "#f59e0b",
    duplicateBadgeBg: "#fff7ed",
    duplicateBadgeText: "#c2410c",

    warningText: "#d97706",
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
      background: "transparent",
    },

    row: {
      cursor: "pointer",
      transition: "background .15s ease, box-shadow .15s ease",
    },

    actionsTd: {
      padding: "10px",
      borderBottom: `1px solid ${C.border}`,
      textAlign: "left",
      background: "transparent",
    },

    generateRowWrap: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
    },

    warningIcon: {
      width: 12,
      minWidth: 32,
      height: 32,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      color: C.warningText,
      fontSize: 14,
      fontWeight: 700,
      cursor: "help",
      flexShrink: 0,
    },

    ntcWarningIcon: {
      width: 12,
      minWidth: 32,
      height: 32,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      color: C.ntcText,
      fontSize: 14,
      fontWeight: 700,
      cursor: "help",
      flexShrink: 0,
    },

    closedWarningIcon: {
      width: 12,
      minWidth: 32,
      height: 32,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      color: C.closedText,
      fontSize: 14,
      fontWeight: 700,
      cursor: "help",
      flexShrink: 0,
    },

    selectWrap: {
      position: "relative",
      width: "100%",
      maxWidth: 180,
      flex: 1,
      minWidth: 0,
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

    ntcSelect: {
      width: "100%",
      padding: "8px 34px 8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 800,
      border: `1px solid ${C.border}`,
      background: "#d86a6a",
      color: "#fff",
      outline: "none",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      boxSizing: "border-box",
      lineHeight: 1.2,
    },

    closedSelect: {
      width: "100%",
      padding: "8px 34px 8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 800,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.closedText,
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

    ntcSelectArrow: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      fontSize: 10,
      color: C.ntcText,
      fontWeight: 900,
    },

    closedSelectArrow: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      fontSize: 10,
      color: C.closedText,
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
      background: "transparent",
    },

    fsicCellSelected: {
      background: C.selectedBg,
      boxShadow: `inset 0 0 0 2px ${C.selectedBorder}`,
      color: C.selectedText,
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
      width: 230,
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      boxShadow: "0 12px 28px rgba(0,0,0,.12)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
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

    popupActions: {
      padding: 10,
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      background: "#fff",
    },

    popupActionBtn: {
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
      borderRadius: 8,
      padding: "8px 10px",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
    },

    ntcTd: {
      background: C.ntcRowBg,
      color: C.ntcText,
      borderBottom: `1px solid ${C.border}`,
    },

    closedTd: {
      background: "transparent",
      color: C.closedText,
      borderBottom: `1px solid ${C.border}`,
    },

    ntcGenerateTd: {
      padding: "10px",
      textAlign: "left",
      background: C.ntcRowBg,
      color: C.ntcText,
      borderBottom: `1px solid ${C.border}`,
    },

    closedGenerateTd: {
      padding: "10px",
      textAlign: "left",
      background: "transparent",
      color: C.closedText,
      borderBottom: `1px solid ${C.border}`,
    },

    dateFilterBody: {
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      background: "#fff",
    },

    dateFilterLabel: {
      fontSize: 11,
      fontWeight: 800,
      color: C.primaryDark,
      marginBottom: 4,
      display: "block",
    },

    dateInput: {
      width: "100%",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "8px 10px",
      fontSize: 12,
      fontWeight: 700,
      color: C.text,
      outline: "none",
      boxSizing: "border-box",
      background: "#fff",
    },

    dateFilterHint: {
      fontSize: 11,
      fontWeight: 700,
      color: C.muted,
      lineHeight: 1.3,
    },

    duplicateBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      padding: "4px 8px",
      borderRadius: 999,
      background: C.duplicateBadgeBg,
      color: C.duplicateBadgeText,
      fontSize: 11,
      fontWeight: 900,
      border: `1px solid ${C.duplicateBorder}`,
      maxWidth: "100%",
    },

    duplicateHint: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: 800,
      color: C.duplicateText,
      lineHeight: 1.35,
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
  };

  const activeRowRef = useRef(null);
  const containerRef = useRef(null);
  const fsicMenuRef = useRef(null);
  const dateMenuRef = useRef(null);
  const remarksMenuRef = useRef(null);

  const [selectedFsicRows, setSelectedFsicRows] = useState([]);
  const [lastSelectedFsicId, setLastSelectedFsicId] = useState(null);

  const [fsicFilterMode, setFsicFilterMode] = useState("all");
  const [fsicMenuOpen, setFsicMenuOpen] = useState(false);

  const [remarksFilter, setRemarksFilter] = useState("ALL");
  const [remarksMenuOpen, setRemarksMenuOpen] = useState(false);

  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [undoStack, setUndoStack] = useState([]);

  const recordIds = useMemo(() => records.map((r) => r?.id), [records]);

  const duplicateMap = useMemo(() => {
    const fieldConfig = [
      { key: "fsicAppNo", label: "FSIC App No" },
      { key: "fsicNo", label: "FSIC No" },
      { key: "ioNumber", label: "IO Number" },
      { key: "ntcNumber", label: "NTC Number" },
      { key: "nfsiNumber", label: "NFSI Number" },
    ];

    const counters = {};

    fieldConfig.forEach(({ key }) => {
      counters[key] = new Map();
    });

    records.forEach((row) => {
      fieldConfig.forEach(({ key }) => {
        const normalized = normalizeDuplicateKey(row?.[key]);
        if (!normalized) return;
        const current = counters[key].get(normalized) || 0;
        counters[key].set(normalized, current + 1);
      });
    });

    const result = {};

    records.forEach((row) => {
      const rowWarnings = [];

      fieldConfig.forEach(({ key, label }) => {
        const normalized = normalizeDuplicateKey(row?.[key]);
        if (!normalized) return;

        const count = counters[key].get(normalized) || 0;
        if (count > 1) {
          rowWarnings.push({
            key,
            label,
            value: row?.[key],
            count,
          });
        }
      });

      result[row?.id] = rowWarnings;
    });

    return result;
  }, [records]);

  const getIndexById = useCallback(
    (id) => recordIds.findIndex((x) => x === id),
    [recordIds]
  );

  const pushUndoSnapshot = useCallback(() => {
    setUndoStack((prev) => [...prev, records]);
  }, [records]);

  const saveUpdatedRows = useCallback(
    async (updatedRecords, changedRowIds) => {
      if (typeof onAutoSave !== "function") return;

      const changedRows = updatedRecords.filter((row) => changedRowIds.includes(row?.id));
      await onAutoSave(changedRows, updatedRecords);
    },
    [onAutoSave]
  );

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

    if (url) window.open(url, "_blank");
    e.target.value = "";
  };

  const sortedSelectedFsicRows = useMemo(() => {
    return [...selectedFsicRows].sort((a, b) => getIndexById(a) - getIndexById(b));
  }, [selectedFsicRows, getIndexById]);

  const visibleRows = useMemo(() => {
    let baseRows =
      fsicFilterMode === "selected"
        ? sortedSelectedFsicRows
            .map((selectedId) => {
              const originalIndex = records.findIndex((row) => row?.id === selectedId);
              return {
                row: records[originalIndex],
                originalIndex,
              };
            })
            .filter((item) => item.row)
        : records.map((row, originalIndex) => ({
            row,
            originalIndex,
          }));

    baseRows = baseRows.filter(({ row }) => {
      const remarksValue = getRemarksValue(row);
      return matchesRemarksFilter(remarksValue, remarksFilter);
    });

    const fromDate = dateFrom ? getStartOfDay(parseToDate(dateFrom)) : null;
    const toDate = dateTo ? getEndOfDay(parseToDate(dateTo)) : null;

    baseRows = baseRows.filter(({ row }) => {
      const inspectedDate = parseToDate(row?.dateInspected);

      if (fromDate && (!inspectedDate || inspectedDate < fromDate)) return false;
      if (toDate && (!inspectedDate || inspectedDate > toDate)) return false;

      return true;
    });

    const hasDateSort = !!fromDate || !!toDate;

    if (hasDateSort) {
      baseRows.sort((a, b) => {
        const dateA = parseToDate(a.row?.dateInspected);
        const dateB = parseToDate(b.row?.dateInspected);

        if (!dateA && !dateB) return a.originalIndex - b.originalIndex;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const diff = dateA.getTime() - dateB.getTime();
        if (diff !== 0) return diff;

        return a.originalIndex - b.originalIndex;
      });
    }

    return baseRows;
  }, [records, fsicFilterMode, sortedSelectedFsicRows, remarksFilter, dateFrom, dateTo]);

  const visibleRowIds = useMemo(
    () => visibleRows.map((item) => item?.row?.id).filter(Boolean),
    [visibleRows]
  );

const applyPasteValuesToField = useCallback(
  async (text, rowIds, fieldName) => {
    const values = String(text || "")
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter((v) => v !== "");

    if (!values.length) return;

    const updated = [...records];
    const changedIds = [];

    pushUndoSnapshot();

    if (values.length === 1) {
      rowIds.forEach((rowId) => {
        const rowIndex = updated.findIndex((row) => row?.id === rowId);
        if (rowIndex === -1) return;

        const nextValue = values[0];

        updated[rowIndex] = {
          ...updated[rowIndex],
          [fieldName]: nextValue,
          ...(fieldName === "fsicNo" ? { FSIC_NUMBER: nextValue } : {}),
          ...(fieldName === "fsicAppNo" ? { FSIC_APP_NO: nextValue } : {}),
        };

        changedIds.push(rowId);
      });
    } else {
      rowIds.forEach((rowId, i) => {
        const rowIndex = updated.findIndex((row) => row?.id === rowId);
        if (rowIndex === -1) return;
        if (i >= values.length) return;

        const nextValue = values[i];

        updated[rowIndex] = {
          ...updated[rowIndex],
          [fieldName]: nextValue,
          ...(fieldName === "fsicNo" ? { FSIC_NUMBER: nextValue } : {}),
          ...(fieldName === "fsicAppNo" ? { FSIC_APP_NO: nextValue } : {}),
        };

        changedIds.push(rowId);
      });
    }

    onBulkUpdate(updated);

    try {
      await saveUpdatedRows(updated, changedIds);
      setToast({
        open: true,
        title: "Auto-saved",
        message: `${changedIds.length} row(s) saved successfully.`,
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
      setToast({
        open: true,
        title: "Auto-save failed",
        message: "Failed to save changes to the database.",
      });
    }
  },
  [onBulkUpdate, pushUndoSnapshot, records, saveUpdatedRows]
);

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId, fsicFilterMode, remarksFilter, dateFrom, dateTo]);

  useEffect(() => {
    onVisibleCountChange?.(visibleRows.length);
  }, [visibleRows.length, onVisibleCountChange]);

  const clearSelection = () => {
    setSelectedFsicRows([]);
    setLastSelectedFsicId(null);
  };

  const handleRangeSelection = useCallback((rowId, prev, lastSelectedId, isCtrl, orderedIds) => {
    if (!orderedIds?.length) return [rowId];

    const currentIndex = orderedIds.indexOf(rowId);
    const lastIndex = lastSelectedId ? orderedIds.indexOf(lastSelectedId) : -1;

    if (currentIndex === -1) return [rowId];
    if (lastIndex === -1) {
      return isCtrl ? Array.from(new Set([...prev, rowId])) : [rowId];
    }

    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
    const rangeIds = orderedIds.slice(start, end + 1);

    if (isCtrl) {
      return Array.from(new Set([...prev, ...rangeIds]));
    }

    return rangeIds;
  }, []);

  const handleFsicCellClick = (rowId, e) => {
    e.stopPropagation();

    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    setSelectedFsicRows((prev) => {
      let next = [...prev];

      if (isShift) {
        next = handleRangeSelection(rowId, prev, lastSelectedFsicId, isCtrl, visibleRowIds);
      } else if (isCtrl) {
        if (next.includes(rowId)) {
          next = next.filter((id) => id !== rowId);
        } else {
          next.push(rowId);
        }
      } else {
        next = [rowId];
      }

      return next;
    });

    setLastSelectedFsicId(rowId);
  };

  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      if (!selectedFsicRows.length) return;
      if (typeof onBulkUpdate !== "function") return;

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const isContentEditable = activeEl?.isContentEditable;

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        isContentEditable
      ) {
        return;
      }

      const text = e.clipboardData?.getData("text");
      if (!text) return;

      e.preventDefault();
      await applyPasteValuesToField(text, selectedFsicRows, "fsicNo");
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [selectedFsicRows, onBulkUpdate, applyPasteValuesToField]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (undoStack.length && typeof onBulkUpdate === "function") {
          e.preventDefault();
          const last = undoStack[undoStack.length - 1];
          setUndoStack((prev) => prev.slice(0, -1));
          onBulkUpdate(last);
          return;
        }
      }

      if (selectedFsicRows.length && (e.key === "Delete" || e.key === "Backspace")) {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();
        const isContentEditable = activeEl?.isContentEditable;

        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          isContentEditable
        ) {
          return;
        }

        e.preventDefault();

        const updated = [...records];
        pushUndoSnapshot();

      selectedFsicRows.forEach((rowId) => {
        const rowIndex = updated.findIndex((row) => row?.id === rowId);
        if (rowIndex !== -1 && updated[rowIndex]) {
          updated[rowIndex] = {
            ...updated[rowIndex],
            fsicNo: "",
            FSIC_NUMBER: "",
          };
          changedIds.push(rowId);
        }
      });

        if (typeof onBulkUpdate === "function") {
          onBulkUpdate(updated);

          saveUpdatedRows(updated, [...selectedFsicRows])
            .then(() => {
              setToast({
                open: true,
                title: "Auto-saved",
                message: `${selectedFsicRows.length} row(s) saved successfully.`,
              });
            })
            .catch((err) => {
              console.error("Auto-save failed:", err);
              setToast({
                open: true,
                title: "Auto-save failed",
                message: "Failed to save changes to the database.",
              });
            });
        }
      }

      if (e.key === "Escape") {
        clearSelection();
        setFsicMenuOpen(false);
        setDateMenuOpen(false);
        setRemarksMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedFsicRows,
    records,
    onBulkUpdate,
    undoStack,
    pushUndoSnapshot,
    saveUpdatedRows,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fsicMenuRef.current && !fsicMenuRef.current.contains(e.target)) {
        setFsicMenuOpen(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setDateMenuOpen(false);
      }
      if (remarksMenuRef.current && !remarksMenuRef.current.contains(e.target)) {
        setRemarksMenuOpen(false);
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
        const clickedInsideFsicHeader = e.target.closest?.("[data-fsic-header-filter='true']");
        const clickedInsideDateHeader = e.target.closest?.("[data-date-header-filter='true']");
        const clickedInsideRemarksHeader = e.target.closest?.("[data-remarks-header-filter='true']");

        if (
          !clickedInsideFsicCell &&
          !clickedInsideFsicHeader &&
          !clickedInsideDateHeader &&
          !clickedInsideRemarksHeader
        ) {
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

      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "12%" }}>FSIC App No</th>
            <th style={{ ...S.th, width: "15%" }}>Nature</th>
            <th style={{ ...S.th, width: "12%" }}>IO No</th>
            <th style={{ ...S.th, width: "18%" }}>Owner</th>

            <th style={{ ...S.th, width: "16%" }}>
              <div style={S.headerFilterWrap}>
                <span style={{ ...wrap, fontWeight: 900 }}>Remarks</span>

                <div
                  ref={remarksMenuRef}
                  style={S.headerFilterRight}
                  data-remarks-header-filter="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    style={S.headerArrowBtn}
                    onClick={() => {
                      setRemarksMenuOpen((prev) => !prev);
                      setFsicMenuOpen(false);
                      setDateMenuOpen(false);
                    }}
                    title="Filter Remarks"
                  >
                    ▼
                  </button>

                  {remarksMenuOpen && (
                    <div style={S.headerDropdown}>
                      {REMARK_OPTIONS.map((opt, index) => {
                        const value = opt.value || "ALL";
                        const isActive = remarksFilter === value;

                        return (
                          <button
                            key={value || index}
                            type="button"
                            style={{
                              ...S.headerDropdownBtn,
                              ...(isActive ? S.headerDropdownBtnActive : {}),
                              borderBottom:
                                index === REMARK_OPTIONS.length - 1
                                  ? "none"
                                  : `1px solid ${C.border}`,
                            }}
                            onClick={() => {
                              setRemarksFilter(value);
                              setRemarksMenuOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </th>

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
                    onClick={() => {
                      setFsicMenuOpen((prev) => !prev);
                      setDateMenuOpen(false);
                      setRemarksMenuOpen(false);
                    }}
                    title="Filter FSIC rows"
                  >
                    ▼
                  </button>

                  {fsicMenuOpen && (
                    <div style={{ ...S.headerDropdown, width: 150 }}>
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
                          ...(fsicFilterMode === "selected" ? S.headerDropdownBtnActive : {}),
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

            <th style={{ ...S.th, width: "10%" }}>
              <div style={S.headerFilterWrap}>
                <span style={{ ...wrap, fontWeight: 900 }}>Date</span>

                <div
                  ref={dateMenuRef}
                  style={S.headerFilterRight}
                  data-date-header-filter="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    style={S.headerArrowBtn}
                    onClick={() => {
                      setDateMenuOpen((prev) => !prev);
                      setFsicMenuOpen(false);
                      setRemarksMenuOpen(false);
                    }}
                    title="Date menu"
                  >
                    ▼
                  </button>

                  {dateMenuOpen && (
                    <div style={{ ...S.headerDropdown, width: 230 }}>
                      <div style={S.dateFilterBody}>
                        <div>
                          <label style={S.dateFilterLabel}>From</label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={S.dateInput}
                          />
                        </div>

                        <div>
                          <label style={S.dateFilterLabel}>To</label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={S.dateInput}
                          />
                        </div>

                        <div style={S.dateFilterHint}>
                          Leave one side blank if single-ended range lang imong gusto.
                        </div>
                      </div>

                      <div style={S.popupActions}>
                        <button
                          type="button"
                          style={S.popupActionBtn}
                          onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                          }}
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          style={S.popupActionBtn}
                          onClick={() => {
                            setDateMenuOpen(false);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </th>

            <th style={{ ...S.th, width: "24%" }}>Generate</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={8} style={S.empty}>
                No records found
              </td>
            </tr>
          ) : (
            visibleRows.map(({ row: r, originalIndex }, visibleIndex) => {
              const isActive = activeId && r.id === activeId;
              const isFsicSelected = selectedFsicRows.includes(r.id);
              const isNTC = isNatureNTC(r.natureOfInspection);
              const isClosed = isNatureClosed(r.natureOfInspection);
              const duplicateWarnings = duplicateMap[r.id] || [];
              const hasDuplicate = duplicateWarnings.length > 0;

              const remarksValue = getRemarksValue(r);
              const hasRemarks = !isEmptyValue(remarksValue);

              const missingFields = getMissingTemplateFields(r);
              const shouldShowMissingWarning = !hasRemarks && missingFields.length > 0;

              const duplicateSummary = duplicateWarnings
                .map((item) => `${item.label}: ${item.value}`)
                .join(" • ");

              const baseRowBg = isActive
                ? "#ffe4e6"
                : isNTC
                ? C.ntcRowBg
                : visibleIndex % 2 === 0
                ? "#fff"
                : "#fafafa";

              return (
                <tr
                  key={r.id || originalIndex}
                  ref={isActive ? activeRowRef : null}
                  style={{
                    ...S.row,
                    background: baseRowBg,
                    color: isNTC
                      ? C.ntcText
                      : isClosed
                      ? C.closedText
                      : hasDuplicate
                      ? C.duplicateText
                      : C.text,
                    boxShadow: isActive
                      ? "inset 0 0 0 2px #b91c1c"
                      : isNTC
                      ? `inset 4px 0 0 0 ${C.ntcBorder}`
                      : isClosed
                      ? `inset 4px 0 0 0 ${C.closedBorder}`
                      : hasDuplicate
                      ? `inset 4px 0 0 0 ${C.duplicateBorder}`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isNTC ? C.ntcRowBg : "#fff7f7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = baseRowBg;
                    }
                  }}
                  onClick={() => onRowClick?.(r)}
                >
                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{r.fsicAppNo || "-"}</div>
                    {hasDuplicate && <div style={S.duplicateBadge}>⚠ Duplicate record</div>}
                  </td>

                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{r.natureOfInspection || "-"}</div>
                    {hasDuplicate && <div style={S.duplicateHint}>{duplicateSummary}</div>}
                  </td>

                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{r.ioNumber || "-"}</div>
                  </td>

                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{r.ownerName || "-"}</div>
                  </td>

                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{remarksValue || "-"}</div>
                  </td>

                  <td
                    data-fsic-cell="true"
                    style={{
                      ...S.td,
                      ...S.fsicCell,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                      ...(isFsicSelected ? S.fsicCellSelected : {}),
                      ...(hasDuplicate && !isNTC && !isClosed
                        ? {
                            boxShadow: isFsicSelected
                              ? `inset 0 0 0 2px ${C.selectedBorder}`
                              : "none",
                            color: isFsicSelected ? C.selectedText : C.duplicateText,
                          }
                        : {}),
                    }}
                    onClick={(e) => handleFsicCellClick(r.id, e)}
                    title="Click / Ctrl+Click / Shift+Click then paste FSIC No"
                  >
                    <div style={wrap}>{r.fsicNo || "-"}</div>
                  </td>

                  <td
                    style={{
                      ...S.td,
                      ...(isNTC ? S.ntcTd : {}),
                      ...(isClosed ? S.closedTd : {}),
                    }}
                  >
                    <div style={wrap}>{r.dateInspected || "-"}</div>
                  </td>

                  <td
                    style={
                      isNTC
                        ? S.ntcGenerateTd
                        : isClosed
                        ? S.closedGenerateTd
                        : S.actionsTd
                    }
                  >
                    <div style={S.generateRowWrap} onClick={(e) => e.stopPropagation()}>
                      <div style={S.selectWrap}>
                        <select
                          defaultValue=""
                          style={
                            isNTC
                              ? S.ntcSelect
                              : isClosed
                              ? S.closedSelect
                              : S.select
                          }
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

                        <span
                          style={
                            isNTC
                              ? S.ntcSelectArrow
                              : isClosed
                              ? S.closedSelectArrow
                              : S.selectArrow
                          }
                        >
                          ▼
                        </span>
                      </div>

                      {shouldShowMissingWarning && (
                        <span
                          style={
                            isNTC
                              ? S.ntcWarningIcon
                              : isClosed
                              ? S.closedWarningIcon
                              : S.warningIcon
                          }
                          title={`Missing fields:\n${missingFields.join("\n")}`}
                        >
                          ⚠
                        </span>
                      )}
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