// ✅ AddRecord.jsx (FULL) — NTC + Team Leader/Inspectors 1-3 + Serials
// ✅ FIXED: Team Leader & Inspectors keep EXACT casing (small/caps) as typed
import React, { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import TopRightToast from "../components/TopRightToast"; // adjust path

/**
 * ✅ Format "YYYY-MM-DD" => "January 2, 2026"
 */
const formatDateLong = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyy_mm_dd);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
};

/**
 * ✅ add 1 year to "YYYY-MM-DD" (handles leap year)
 */
const addYearsYMD = (yyyy_mm_dd, years = 1) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return "";

  const dt = new Date(y, m - 1, d);
  const targetYear = y + years;
  dt.setFullYear(targetYear);

  // clamp Feb 29 -> Feb 28 if needed
  if (m === 2 && d === 29 && dt.getMonth() === 2) {
    return `${targetYear}-02-28`;
  }

  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

const INITIAL_FORM = {
  appno: "",
  fsicAppNo: "",
  chiefName: "",
  marshalName: "",
  natureOfInspection: "",
  ownerName: "",
  establishmentName: "",
  businessAddress: "",
  contactNumber: "",
  dateInspected: "",

  ioNumber: "",
  ioDate: "",

  // ✅ NTC
  ntcNumber: "",
  ntcDate: "",

  nfsiNumber: "",
  nfsiDate: "",

  // ✅ REINSPECTION TO: Team Leader + Inspectors 1/2/3 + serials
  teamLeader: "",
  teamLeaderSerial: "",

  inspector1: "",
  inspector1Serial: "",
  inspector2: "",
  inspector2Serial: "",
  inspector3: "",
  inspector3Serial: "",

  // optional combined inspectors
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

/**
 * ✅ ONLY THESE FIELDS WILL BE AUTO-UPPERCASED
 * Names (teamLeader/inspectors1-3) are intentionally NOT included.
 */
const UPPER_KEYS = new Set([
  "appno",
  "fsicAppNo",
  "chiefName",
  "marshalName",
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
  // optional combined inspectors (if you want it uppercase)
  "inspectors",
]);

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No", placeholder: "2026-00123", required: true, type: "text", span: 1 },
  { key: "ownerName", label: "Owner", placeholder: "Owner name", required: true, type: "text", span: 1 },
  { key: "establishmentName", label: "Establishment", placeholder: "Establishment name", required: false, type: "text", span: 2 },

  { key: "appno", label: "Application No.", placeholder: "App no", required: false, type: "text", span: 1 },
  { key: "natureOfInspection", label: "Nature of Inspection", placeholder: "Annual / New / Re-inspection", required: false, type: "text", span: 1 },

  { key: "businessAddress", label: "Business Address", placeholder: "Full address", required: false, type: "text", span: 2 },

  { key: "contactNumber", label: "Contact Number", placeholder: "09xxxxxxxxx", required: false, type: "tel", span: 1 },
  { key: "dateInspected", label: "Date Inspected", placeholder: "", required: false, type: "date", span: 1 },

  { key: "ioNumber", label: "IO Number", placeholder: "IO no", required: false, type: "text", span: 1 },
  { key: "ioDate", label: "IO Date", placeholder: "", required: false, type: "date", span: 1 },

  { key: "ntcNumber", label: "NTC Number", placeholder: "NTC no", required: false, type: "text", span: 1 },
  { key: "ntcDate", label: "NTC Date", placeholder: "", required: false, type: "date", span: 1 },

  { key: "nfsiNumber", label: "NFSI Number", placeholder: "NFSI no", required: false, type: "text", span: 1 },
  { key: "nfsiDate", label: "NFSI Date", placeholder: "", required: false, type: "date", span: 1 },

  // ✅ Reinspection "TO"
  { key: "teamLeader", label: "Team Leader", placeholder: "Team leader", required: false, type: "text", span: 1 },
  { key: "teamLeaderSerial", label: "Team Leader Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector1", label: "Inspector 1", placeholder: "Inspector 1", required: false, type: "text", span: 1 },
  { key: "inspector1Serial", label: "Inspector 1 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector2", label: "Inspector 2", placeholder: "Inspector 2", required: false, type: "text", span: 1 },
  { key: "inspector2Serial", label: "Inspector 2 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  { key: "inspector3", label: "Inspector 3", placeholder: "Inspector 3", required: false, type: "text", span: 1 },
  { key: "inspector3Serial", label: "Inspector 3 Serial", placeholder: "Serial no", required: false, type: "text", span: 1 },

  // optional: combined inspectors field
  { key: "inspectors", label: "Inspectors (combined)", placeholder: "Inspector names", required: false, type: "text", span: 2 },

  { key: "fsicValidity", label: "FSIC Validity", placeholder: "Auto (based on Date Inspected)", required: false, type: "text", span: 1 },
  { key: "defects", label: "Defects / Violations", placeholder: "List defects", required: false, type: "text", span: 1 },

  { key: "occupancyType", label: "Occupancy Type", placeholder: "Occupancy", required: false, type: "text", span: 1 },
  { key: "buildingDesc", label: "Building Description", placeholder: "Description", required: false, type: "text", span: 1 },

  { key: "floorArea", label: "Floor Area", placeholder: "120 SQM", required: false, type: "text", span: 1 },
  { key: "buildingHeight", label: "Building Height", placeholder: "10 M", required: false, type: "text", span: 1 },

  { key: "storeyCount", label: "Storey Count", placeholder: "2", required: false, type: "number", span: 1 },
  { key: "highRise", label: "High Rise", placeholder: "YES / NO", required: false, type: "text", span: 1 },

  { key: "fsmr", label: "FSMR", placeholder: "FSMR", required: false, type: "text", span: 1 },
  { key: "remarks", label: "Remarks", placeholder: "Remarks", required: false, type: "text", span: 1 },

  { key: "orNumber", label: "OR Number", placeholder: "OR no", required: false, type: "text", span: 1 },
  { key: "orAmount", label: "OR Amount", placeholder: "0.00", required: false, type: "number", span: 1 },
  { key: "orDate", label: "OR Date", placeholder: "", required: false, type: "date", span: 2 },

  { key: "chiefName", label: "Chief, Fire Safety Enforcement Section", placeholder: "Chief name", required: false, type: "text", span: 1 },
  { key: "marshalName", label: "District Fire Marshal", placeholder: "Marshal name", required: false, type: "text", span: 1 },
];

export default function AddRecord({ setRefresh }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [toastOpen, setToastOpen] = useState(false);

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

  const buildPayload = () => {
    const payload = { ...form };

    // ✅ Store long dates for PDF/template
    payload.dateInspected = formatDateLong(form.dateInspected);
    payload.ioDate = formatDateLong(form.ioDate);
    payload.nfsiDate = formatDateLong(form.nfsiDate);
    payload.orDate = formatDateLong(form.orDate);
    payload.ntcDate = formatDateLong(form.ntcDate);

    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();
    return payload;
  };

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
    title: { fontSize: 18, fontWeight: 950, color: "#0f172a", textTransform: "uppercase" },
    sub: { fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 6 },

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

    // ✅ IMPORTANT: default is NOT uppercase anymore
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

    // ✅ Only uppercase selected fields; others keep exact casing
    const v = UPPER_KEYS.has(name) ? String(value ?? "").toUpperCase() : value;
    setForm((p) => ({ ...p, [name]: v }));
  };

  const onBlur = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const submit = async () => {
    if (!form.fsicAppNo?.trim() || !form.ownerName?.trim()) {
      setTouched((p) => ({ ...p, fsicAppNo: true, ownerName: true }));
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      await addDoc(collection(db, "records"), payload);

      setToastOpen(true);
      setForm(INITIAL_FORM);
      setTouched({});
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error(e);
      alert("Firestore error. Check rules / permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={styles.wrap}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>Add Record</div>
            <div style={styles.sub}>Fill up the fields then save.</div>
          </div>
        </div>

        <div style={styles.grid}>
          {FIELDS.map((f) => {
            const showError = f.required && touched[f.key] && missingRequired[f.key];
            const isValidity = f.key === "fsicValidity";

            return (
              <div
                key={f.key}
                style={{
                  ...styles.card,
                  gridColumn: f.span === 2 ? "1 / -1" : "auto",
                  border: showError ? "1px solid #fecdd3" : styles.card.border,
                  opacity: isValidity ? 0.98 : 1,
                }}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardLabel}>{f.label}</div>
                  {f.required && <div style={styles.reqPill}>Required</div>}
                </div>

                <input
                  name={f.key}
                  value={form[f.key] ?? ""}
                  onChange={onChange}
                  onBlur={() => onBlur(f.key)}
                  type={f.type || "text"}
                  placeholder={f.placeholder || ""}
                  autoComplete="off"
                  readOnly={isValidity}
                  style={{
                    ...styles.input,
                    border: showError ? "1px solid #dc2626" : styles.input.border,

                    // ✅ IMPORTANT: dates no transform; uppercase ONLY if in UPPER_KEYS
                    textTransform:
                      f.type === "date"
                        ? "none"
                        : UPPER_KEYS.has(f.key)
                        ? "uppercase"
                        : "none",

                    background: isValidity ? "#f8fafc" : styles.input.background,
                    cursor: isValidity ? "not-allowed" : "text",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={styles.footerBar}>
          <div style={styles.footerLeft}>
            {Object.keys(missingRequired).length > 0
              ? "Please fill required fields before saving."
              : "Ready to save."}
          </div>

          <button
            style={styles.btn}
            onClick={() => {
              setForm(INITIAL_FORM);
              setTouched({});
            }}
            disabled={saving}
          >
            Clear
          </button>

          <button style={styles.primary} onClick={submit} disabled={saving}>
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