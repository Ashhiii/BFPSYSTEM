import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "react-router-dom";

import TopRightToast from "../components/TopRightToast";
import AddTabs from "../components/AddTabs";

/** ✅ Format "YYYY-MM-DD" => "January 2, 2026" */
const formatDateLong = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyy_mm_dd);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
};

/** ✅ add 1 year to "YYYY-MM-DD" (handles leap year) */
const addYearsYMD = (yyyy_mm_dd, years = 1) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return "";

  const dt = new Date(y, m - 1, d);
  const targetYear = y + years;
  dt.setFullYear(targetYear);

  if (m === 2 && d === 29 && dt.getMonth() === 2) {
    return `${targetYear}-02-28`;
  }

  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

// ✅ Convert to YYYY-MM-DD for <input type="date">
const toInputDate = (v) => {
  if (!v) return "";

  if (v?.toDate) {
    const d = v.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
    const d = new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return "";
};

const INITIAL_FORM = {
  appno: "",
  fsicAppNo: "",
  fsicNo: "",

  chiefName: "",
  chiefPosition: "",
  marshalPosition: "",
  marshalName: "",


  natureOfInspection: "",

  ownerName: "",
  establishmentName: "",
  businessAddress: "",
  contactNumber: "",
  dateInspected: "",

  ioNumber: "",
  ioDate: "",

  ntcNumber: "",
  ntcDate: "",

  nfsiNumber: "",
  nfsiDate: "",

  teamLeader: "",
  teamLeaderSerial: "",

  inspector1: "",
  inspector1Serial: "",
  inspector2: "",
  inspector2Serial: "",
  inspector3: "",
  inspector3Serial: "",
  inspector4: "",
  inspector4Serial: "",
  inspector5: "",
  inspector5Serial: "",

  inspectors: "",

  fsicValidity: "",
  defects: "",

  occupancyType: "",
  buildingDesc: "",
  floorArea: "",
  buildingHeight: "",
  storeyCount: "",
  highRise: "",
  fsmr: "",
  remarks: "",

  orNumber: "",
  orAmount: "",
  orDate: "",
};

const UPPER_KEYS = new Set([
  "fsicAppNo",
  "fsicNo",
  "chiefName",
  "chiefPosition",
  "marshalName",
  "marshalPosition",
  "natureOfInspection",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",
  "ioNumber",
  "ntcNumber",
  "nfsiNumber",
  "fsicValidity",
  "defects",
  "occupancyType",
  "buildingDesc",
  "floorArea",
  "buildingHeight",
  "storeyCount",
  "highRise",
  "fsmr",
  "remarks",
  "orNumber",
  "orAmount",
]);

const NATURE_SUGGESTIONS = [
  "ANNUAL",
  "RENEW",
  "NEW",
  "RE-INSPECTION",
  "GOVERNMENT",
];

const OCCUPANCY_OPTIONS = [
  "ASSEMBLY",
  "EDUCATIONAL",
  "DAY CARE",
  "HEALTH CARE",
  "RESIDENTIAL BOARD AND CARE",
  "DETENTION & CORRECTIONAL",
  "HOTEL",
  "DORMITORIES",
  "APARTMENT BUILDINGS",
  "LODGING & ROOMING HOUSE",
  "SINGLE & TWO FAMILY DWELLING UNIT",
  "MERCANTILE",
  "BUSINESS",
  "INDUSTRIAL",
  "STORAGE",
  "SPECIAL STRUCTURES",
  "NON-STRUCTURAL (E.G., VEHICLE USED AS ROLLING STORE, ETC.)",
];

const HIGH_RISE_CHOICES = ["YES", "NO"];
const FSMR_CHOICES = ["YES", "NO"];
const REMARKS_CHOICES = ["FSIC", "TRANSFERRED", "CLOSED", "CAN'T BE LOCATED", "REFUSED", "NTC"];

const DUPLICATE_CHECK_FIELDS = {
  fsicNo: "FSIC No",
  ioNumber: "IO Number",
  ntcNumber: "NTC Number",
  nfsiNumber: "NFSI Number",
};

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No", placeholder: "2026-00123", required: true, type: "text", span: 1 },
  { key: "ownerName", label: "Owner", placeholder: "Owner name", required: true, type: "text", span: 1 },
  { key: "establishmentName", label: "Establishment", placeholder: "Establishment name", required: false, type: "text", span: 2 },

  { key: "fsicNo", label: "FSIC NO", placeholder: "FSIC NO", required: false, type: "text", span: 1 },
  { key: "natureOfInspection", label: "Nature of Inspection", placeholder: "ANNUAL / RENEW / NEW / RE-INSPECTION", required: false, type: "text", span: 1 },

  { key: "businessAddress", label: "Business Address", placeholder: "Full address", required: false, type: "text", span: 2 },

  { key: "contactNumber", label: "Contact Number", placeholder: "09xxxxxxxxx", required: false, type: "tel", span: 1 },
  { key: "dateInspected", label: "Date Inspected", placeholder: "", required: false, type: "date", span: 1 },

  { key: "ioNumber", label: "IO Number", placeholder: "IO no", required: false, type: "text", span: 1 },
  { key: "ioDate", label: "IO Date", placeholder: "", required: false, type: "date", span: 1 },

  { key: "ntcNumber", label: "NTC Number", placeholder: "NTC no", required: false, type: "text", span: 1 },
  { key: "ntcDate", label: "NTC Date", placeholder: "", required: false, type: "date", span: 1 },

  { key: "nfsiNumber", label: "NFSI Number", placeholder: "NFSI no", required: false, type: "text", span: 1 },
  { key: "nfsiDate", label: "NFSI Date", placeholder: "", required: false, type: "date", span: 1 },

  { key: "teamLeader", label: "Team Leader", placeholder: "Team leader", required: false, type: "text", span: 1 },
  { key: "teamLeaderSerial", label: "Team Leader Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector1", label: "Inspector 1", placeholder: "Inspector 1", required: false, type: "text", span: 1 },
  { key: "inspector1Serial", label: "Inspector 1 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector2", label: "Inspector 2", placeholder: "Inspector 2", required: false, type: "text", span: 1 },
  { key: "inspector2Serial", label: "Inspector 2 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector3", label: "Inspector 3", placeholder: "Inspector 3", required: false, type: "text", span: 1 },
  { key: "inspector3Serial", label: "Inspector 3 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector4", label: "Inspector 4", placeholder: "Inspector 4", required: false, type: "text", span: 1 },
  { key: "inspector4Serial", label: "Inspector 4 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector5", label: "Inspector 5", placeholder: "Inspector 5", required: false, type: "text", span: 1 },
  { key: "inspector5Serial", label: "Inspector 5 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspectors", label: "Inspectors (combined)", placeholder: "Auto Inspectors", required: false, type: "text", span: 2 },

  { key: "fsicValidity", label: "FSIC Validity", placeholder: "Auto (based on Date Inspected)", required: false, type: "text", span: 1 },
  { key: "defects", label: "Defects / Violations", placeholder: "List defects", required: false, type: "text", span: 1 },

  { key: "occupancyType", label: "Type of Occupancy", required: false, type: "select", span: 1 },
  { key: "buildingDesc", label: "Building Description", placeholder: "Description", required: false, type: "text", span: 1 },
  { key: "floorArea", label: "Floor Area", placeholder: "120 SQM", required: false, type: "text", span: 1 },
  { key: "buildingHeight", label: "Building Height", placeholder: "10 M", required: false, type: "text", span: 1 },

  { key: "storeyCount", label: "Storey Count", placeholder: "2", required: false, type: "number", span: 1 },
  { key: "highRise", label: "High Rise", placeholder: "YES / NO", required: false, type: "select", span: 1 },

  { key: "fsmr", label: "FSMR", placeholder: "FSMR", required: false, type: "select", span: 1 },
  { key: "remarks", label: "Remarks", placeholder: "Remarks", required: false, type: "select", span: 1 },

  { key: "orNumber", label: "OR Number", placeholder: "OR no", required: false, type: "text", span: 1 },
  { key: "orAmount", label: "OR Amount", placeholder: "0.00", required: false, type: "number", span: 1 },
  { key: "orDate", label: "OR Date", placeholder: "", required: false, type: "date", span: 2 },

  { key: "chiefName", label: "Chief, Fire Safety Enforcement Section", placeholder: "Chief name", required: false, type: "text", span: 1 },
  { key: "chiefPosition", label: "Chief Position", placeholder: "Chief, Fire Prevention Branch", required: false, type: "text", span: 1 },
  { key: "marshalName", label: "District Fire Marshal", placeholder: "Marshal name", required: false, type: "text", span: 1 },
  { key: "marshalPosition", label: "Marshal Position", placeholder: "District Fire Marshal", required: false, type: "text", span: 1 },
];

export default function AddRecord({ setRefresh }) {
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [duplicateErrors, setDuplicateErrors] = useState({});

  const topRef = useRef(null);
  const fieldRefs = useRef({});

  const scrollToTop = () => {
    if (topRef.current?.scrollIntoView) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToField = (fieldKey) => {
    const el = fieldRefs.current[fieldKey];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (el?.focus) el.focus();
      }, 250);
    } else {
      scrollToTop();
    }
  };

  const [history, setHistory] = useState(() => ({
    natureOfInspection: [...NATURE_SUGGESTIONS],
  }));

  const requiredKeys = useMemo(
    () => FIELDS.filter((f) => f.required).map((f) => f.key),
    []
  );

  const missingRequired = useMemo(() => {
    const miss = {};
    for (const k of requiredKeys) {
      const v = (form[k] ?? "").toString().trim();
      if (!v) miss[k] = true;
    }
    return miss;
  }, [form, requiredKeys]);

  const combineInspectors = (state) => {
    return [
      state.inspector1,
      state.inspector2,
      state.inspector3,
      state.inspector4,
      state.inspector5,
    ]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", ");
  };

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;

    setForm(() => {
      const next = { ...INITIAL_FORM, ...prefill };

      next.dateInspected = toInputDate(next.dateInspected);
      next.ioDate = toInputDate(next.ioDate);
      next.ntcDate = toInputDate(next.ntcDate);
      next.nfsiDate = toInputDate(next.nfsiDate);
      next.orDate = toInputDate(next.orDate);

      next.inspectors = combineInspectors(next);

      if (next.dateInspected) {
        const untilYMD = addYearsYMD(next.dateInspected, 1);
        next.fsicValidity = untilYMD ? `${formatDateLong(untilYMD)}` : "";
      } else {
        next.fsicValidity = "";
      }

      return next;
    });

    setTouched({});
    setDuplicateErrors({});
    scrollToTop();
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const styles = {
    wrap: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 14,
      paddingBottom: 30,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: 950,
      color: "#0f172a",
      textTransform: "uppercase",
    },
    sub: {
      fontSize: 12,
      fontWeight: 700,
      color: "#64748b",
      marginTop: 6,
    },
    grid: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
    },
    card: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: 14,
    },
    cardTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: 900,
      color: "#0f172a",
      textTransform: "uppercase",
    },
    reqPill: {
      fontSize: 11,
      fontWeight: 900,
      color: "#dc2626",
      background: "#fff1f2",
      border: "1px solid #fecdd3",
      padding: "4px 10px",
      borderRadius: 999,
      lineHeight: 1,
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #cbd5e1",
      outline: "none",
      fontSize: 13,
      fontWeight: 800,
      background: "#fff",
      boxSizing: "border-box",
      textTransform: "none",
    },
    errorText: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: 800,
      color: "#dc2626",
    },
    footerBar: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    },
    footerLeft: {
      marginRight: "auto",
      fontSize: 12,
      fontWeight: 800,
      color: "#64748b",
    },
    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 950,
    },
    primary: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 950,
    },
  };

  const pushHistory = (fieldKey, rawValue) => {
    const v = String(rawValue ?? "").trim();
    if (!v) return;

    if (
      fieldKey === "inspectors" ||
      fieldKey === "fsicValidity" ||
      fieldKey === "occupancyType"
    )
      return;

    setHistory((prev) => {
      const cur = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const next = [v, ...cur.filter((x) => String(x) !== v)].slice(0, 10);

      if (fieldKey === "natureOfInspection") {
        const merged = [...NATURE_SUGGESTIONS, ...next].filter(
          (x, i, arr) => arr.indexOf(x) === i
        );
        return { ...prev, [fieldKey]: merged.slice(0, 10) };
      }

      return { ...prev, [fieldKey]: next };
    });
  };

  const checkDuplicateField = async (fieldKey, value) => {
    const cleanValue = String(value ?? "").trim();

    if (!DUPLICATE_CHECK_FIELDS[fieldKey]) return false;

    if (!cleanValue) {
      setDuplicateErrors((prev) => ({
        ...prev,
        [fieldKey]: "",
      }));
      return false;
    }

    try {
      const q = query(
        collection(db, "records"),
        where(fieldKey, "==", cleanValue),
        limit(1)
      );

      const snap = await getDocs(q);
      const exists = !snap.empty;

      setDuplicateErrors((prev) => ({
        ...prev,
        [fieldKey]: exists
          ? `This ${DUPLICATE_CHECK_FIELDS[fieldKey]} already exists.`
          : "",
      }));

      return exists;
    } catch (error) {
      console.error(`Duplicate check failed for ${fieldKey}:`, error);
      return false;
    }
  };

  const checkAllDuplicates = async () => {
    const keys = Object.keys(DUPLICATE_CHECK_FIELDS);
    const foundErrors = {};

    const results = await Promise.all(
      keys.map(async (key) => {
        const value = String(form[key] ?? "").trim();

        if (!value) {
          foundErrors[key] = "";
          return { key, exists: false };
        }

        const q = query(
          collection(db, "records"),
          where(key, "==", value),
          limit(1)
        );

        const snap = await getDocs(q);
        const exists = !snap.empty;

        foundErrors[key] = exists
          ? `This ${DUPLICATE_CHECK_FIELDS[key]} already exists.`
          : "";

        return { key, exists };
      })
    );

    setDuplicateErrors((prev) => ({
      ...prev,
      ...foundErrors,
    }));

    return results;
  };

  const onBlur = async (k) => {
    setTouched((p) => ({ ...p, [k]: true }));
    pushHistory(k, form[k]);

    if (DUPLICATE_CHECK_FIELDS[k]) {
      await checkDuplicateField(k, form[k]);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "dateInspected") {
      const untilYMD = addYearsYMD(value, 1);
      const validityText = untilYMD ? `${formatDateLong(untilYMD)}` : "";

      setForm((p) => ({
        ...p,
        dateInspected: value,
        fsicValidity: validityText,
      }));
      return;
    }

    const v = UPPER_KEYS.has(name) ? String(value ?? "").toUpperCase() : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: v };

      if (name.startsWith("inspector") && !name.toLowerCase().includes("serial")) {
        updated.inspectors = combineInspectors(updated);
      }

      return updated;
    });

    if (DUPLICATE_CHECK_FIELDS[name]) {
      setDuplicateErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const cleanPayload = (data) => {
  const { id, docId, _id, ...rest } = data;

  // remove undefined values
  Object.keys(rest).forEach((key) => {
    if (rest[key] === undefined) {
      delete rest[key];
    }
  });

  return rest;
};

const buildPayload = (state = {}) => {
  const payload = { ...state };

  payload.dateInspected = formatDateLong(state?.dateInspected);
  payload.ioDate = formatDateLong(state?.ioDate);
  payload.nfsiDate = formatDateLong(state?.nfsiDate);
  payload.orDate = formatDateLong(state?.orDate);
  payload.ntcDate = formatDateLong(state?.ntcDate);

  payload.createdAt = serverTimestamp();
  payload.updatedAt = serverTimestamp();

  // IMPORTANT CLEANUP
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  return payload;
};

  const submit = async () => {
    const firstRequiredError = requiredKeys.find(
      (key) => !String(form[key] ?? "").trim()
    );

    if (firstRequiredError) {
      setTouched((p) => {
        const next = { ...p };
        requiredKeys.forEach((key) => {
          next[key] = true;
        });
        return next;
      });

      scrollToField(firstRequiredError);
      return;
    }

    Object.keys(form).forEach((k) => pushHistory(k, form[k]));

    setSaving(true);
    try {
      const duplicateResults = await checkAllDuplicates();
      const hasDuplicate = duplicateResults.some((item) => item.exists);

      if (hasDuplicate) {
        const firstDuplicateField = duplicateResults.find(
          (item) => item.exists
        )?.key;

        if (firstDuplicateField) {
          scrollToField(firstDuplicateField);
        } else {
          scrollToTop();
        }

        return;
      }

      const withCombined = {
        ...form,
        inspectors: combineInspectors(form),
      };

    const payload = buildPayload(cleanPayload(withCombined));
    await addDoc(collection(db, "records"), payload);

      setToastOpen(true);
      setForm(INITIAL_FORM);
      setTouched({});
      setDuplicateErrors({});
      setRefresh?.((p) => !p);

      scrollToTop();
    } catch (e) {
      console.error(e);
      alert("Firestore error. Check rules / permissions.");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyDuplicateError = Object.values(duplicateErrors).some(Boolean);

  return (
    <>
      <div style={styles.wrap}>
        <div ref={topRef} />

        <AddTabs />

        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>Add Record</div>
            <div style={styles.sub}>
              Type normally—suggestions will appear from your recent inputs.
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {FIELDS.map((f) => {
            const showError = f.required && touched[f.key] && missingRequired[f.key];
            const duplicateError = duplicateErrors[f.key];
            const isValidity = f.key === "fsicValidity";
            const isCombinedInspectors = f.key === "inspectors";

            const dlId = `dl_${f.key}`;
            const hasDatalist =
              f.type !== "date" &&
              f.type !== "file" &&
              f.type !== "select" &&
              f.key !== "inspectors" &&
              f.key !== "fsicValidity" &&
              f.key !== "occupancyType";

            return (
              <div
                key={f.key}
                style={{
                  ...styles.card,
                  gridColumn: f.span === 2 ? "1 / -1" : "auto",
                  border:
                    showError || duplicateError
                      ? "1px solid #fecdd3"
                      : styles.card.border,
                }}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardLabel}>{f.label}</div>
                  {f.required && <div style={styles.reqPill}>Required</div>}
                </div>

                {f.type === "select" ? (
                  <>
                    <select
                      ref={(el) => {
                        fieldRefs.current[f.key] = el;
                      }}
                      name={f.key}
                      value={form[f.key] ?? ""}
                      onChange={onChange}
                      onBlur={() => onBlur(f.key)}
                      style={{
                        ...styles.input,
                        border:
                          showError || duplicateError
                            ? "1px solid #dc2626"
                            : styles.input.border,
                        textTransform: UPPER_KEYS.has(f.key) ? "uppercase" : "none",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">-- SELECT --</option>
                      {(
                        f.key === "occupancyType"
                          ? OCCUPANCY_OPTIONS
                          : f.key === "highRise"
                          ? HIGH_RISE_CHOICES
                          : f.key === "fsmr"
                          ? FSMR_CHOICES
                          : f.key === "remarks"
                          ? REMARKS_CHOICES
                          : []
                      ).map((opt) => (
                        <option key={`${f.key}-${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {showError && (
                      <div style={styles.errorText}>This field is required.</div>
                    )}

                    {duplicateError && (
                      <div style={styles.errorText}>{duplicateError}</div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      ref={(el) => {
                        fieldRefs.current[f.key] = el;
                      }}
                      name={f.key}
                      value={form[f.key] ?? ""}
                      onChange={onChange}
                      onBlur={() => onBlur(f.key)}
                      type={f.type || "text"}
                      placeholder={f.placeholder || ""}
                      autoComplete="off"
                      readOnly={isValidity || isCombinedInspectors}
                      list={hasDatalist ? dlId : undefined}
                      style={{
                        ...styles.input,
                        border:
                          showError || duplicateError
                            ? "1px solid #dc2626"
                            : styles.input.border,
                        textTransform:
                          f.type === "date"
                            ? "none"
                            : UPPER_KEYS.has(f.key)
                            ? "uppercase"
                            : "none",
                        background:
                          isValidity || isCombinedInspectors
                            ? "#f1f5f9"
                            : styles.input.background,
                        cursor:
                          isValidity || isCombinedInspectors
                            ? "not-allowed"
                            : "text",
                      }}
                    />

                    {hasDatalist && (
                      <datalist id={dlId}>
                        {(history[f.key] || []).map((opt) => (
                          <option key={`${f.key}-${opt}`} value={opt} />
                        ))}
                      </datalist>
                    )}

                    {showError && (
                      <div style={styles.errorText}>This field is required.</div>
                    )}

                    {duplicateError && (
                      <div style={styles.errorText}>{duplicateError}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.footerBar}>
          <div style={styles.footerLeft}>
            {Object.keys(missingRequired).length > 0
              ? "Please fill required fields before saving."
              : hasAnyDuplicateError
              ? "Please fix duplicate entries before saving."
              : "Ready to save."}
          </div>

          <button
            style={styles.btn}
            onClick={() => {
              setForm(INITIAL_FORM);
              setTouched({});
              setDuplicateErrors({});
              scrollToTop();
            }}
            disabled={saving}
          >
            Clear
          </button>

          <button
            style={styles.primary}
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>

      <TopRightToast
        C={{
          border: "rgba(226,232,240,1)",
          text: "#0f172a",
          muted: "#64748b",
        }}
        open={toastOpen}
        title="Added to Records"
        message="Record saved successfully."
        autoCloseMs={1600}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}