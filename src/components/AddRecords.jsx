import React, { useMemo, useState } from "react";

/**
 * ✅ Backend keys (same as your server expects)
 */
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
  nfsiNumber: "",
  nfsiDate: "",
  fsicValidity: "",
  defects: "",
  inspectors: "",
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
 * ✅ Field UI config (label/placeholder/help/required/layout)
 * - span: 1 (half) or 2 (full width)
 */
const FIELDS = [
  {
    key: "fsicAppNo",
    label: "FSIC App No",
    placeholder: "2026-00123",
    help: "Use the official FSIC application number.",
    required: true,
    type: "text",
    span: 1,
  },
  {
    key: "ownerName",
    label: "Owner",
    placeholder: "Owner name",
    help: "Person/representative responsible for the establishment.",
    required: true,
    type: "text",
    span: 1,
  },
  {
    key: "establishmentName",
    label: "Establishment",
    placeholder: "Establishment name",
    help: "Business name / building / place inspected.",
    required: false, // if you want required, set true
    type: "text",
    span: 2,
  },

  // ---- the rest (same UI style) ----
  { key: "appno", label: "Application No.", placeholder: "App no", help: "", required: false, type: "text", span: 1 },
  { key: "natureOfInspection", label: "Nature of Inspection", placeholder: "e.g. Annual / New / Re-inspection", help: "", required: false, type: "text", span: 1 },

  { key: "businessAddress", label: "Business Address", placeholder: "Full address", help: "", required: false, type: "text", span: 2 },

  { key: "contactNumber", label: "Contact Number", placeholder: "09xxxxxxxxx", help: "", required: false, type: "tel", span: 1 },
  { key: "dateInspected", label: "Date Inspected", placeholder: "", help: "", required: false, type: "date", span: 1 },

  { key: "ioNumber", label: "IO Number", placeholder: "IO no", help: "Inspection Order number.", required: false, type: "text", span: 1 },
  { key: "ioDate", label: "IO Date", placeholder: "", help: "", required: false, type: "date", span: 1 },

  { key: "nfsiNumber", label: "NFSI Number", placeholder: "NFSI no", help: "", required: false, type: "text", span: 1 },
  { key: "nfsiDate", label: "NFSI Date", placeholder: "", help: "", required: false, type: "date", span: 1 },

  { key: "fsicValidity", label: "FSIC Validity", placeholder: "Validity", help: "", required: false, type: "text", span: 1 },
  { key: "defects", label: "Defects / Violations", placeholder: "List defects", help: "", required: false, type: "text", span: 1 },

  { key: "inspectors", label: "Inspectors", placeholder: "Inspector names", help: "", required: false, type: "text", span: 2 },

  { key: "occupancyType", label: "Occupancy Type", placeholder: "Occupancy", help: "", required: false, type: "text", span: 1 },
  { key: "buildingDesc", label: "Building Description", placeholder: "Description", help: "", required: false, type: "text", span: 1 },

  { key: "floorArea", label: "Floor Area", placeholder: "e.g. 120 sqm", help: "", required: false, type: "text", span: 1 },
  { key: "buildingHeight", label: "Building Height", placeholder: "e.g. 10 m", help: "", required: false, type: "text", span: 1 },

  { key: "storeyCount", label: "Storey Count", placeholder: "e.g. 2", help: "", required: false, type: "number", span: 1 },
  { key: "highRise", label: "High Rise", placeholder: "YES / NO", help: "", required: false, type: "text", span: 1 },

  { key: "fsmr", label: "FSMR", placeholder: "FSMR", help: "", required: false, type: "text", span: 1 },
  { key: "remarks", label: "Remarks", placeholder: "Remarks", help: "", required: false, type: "text", span: 1 },

  { key: "orNumber", label: "OR Number", placeholder: "OR no", help: "", required: false, type: "text", span: 1 },
  { key: "orAmount", label: "OR Amount", placeholder: "0.00", help: "", required: false, type: "number", span: 1 },
  { key: "orDate", label: "OR Date", placeholder: "", help: "", required: false, type: "date", span: 2 },
  {
  key: "chiefName",
  label: "Chief, Fire Safety Enforcement Section",
  placeholder: "Chief name",
  required: false,
  type: "text",
  span: 1,
},
{
  key: "marshalName",
  label: "District Fire Marshal",
  placeholder: "Marshal name",
  required: false,
  type: "text",
  span: 1,
},

];

export default function AddRecord({ setRefresh }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});

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

  const styles = {
    wrap: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
    },
    title: { fontSize: 18, fontWeight: 950, color: "#0f172a" },
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
    cardLabel: { fontSize: 13, fontWeight: 900, color: "#0f172a" },

    reqPill: {
      fontSize: 11,
      fontWeight: 900,
      color: "#dc2626",
      background: "#fff1f2",
      border: "1px solid #fecdd3",
      padding: "4px 10px",
      borderRadius: 999,
      lineHeight: 1,
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
    },
    help: { marginTop: 8, fontSize: 11.5, color: "#64748b", fontWeight: 700 },
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onBlur = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const submit = async () => {
    // ✅ required: fsicAppNo + ownerName
    if (!form.fsicAppNo?.trim() || !form.ownerName?.trim()) {
      setTouched((p) => ({ ...p, fsicAppNo: true, ownerName: true }));
      return alert("Required: FSIC App No and Owner");
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Non-JSON:", text);
      }

      if (!res.ok || data.success === false) {
        return alert(data.message || "Failed to add record");
      }

      alert("Record added!");
      setForm(INITIAL_FORM);
      setTouched({});
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error(e);
      alert("Server error. Check backend terminal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Add Record</div>
          <div style={styles.sub}>Fill up the fields then save.</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
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

      {/* Cards */}
      <div style={styles.grid}>
        {FIELDS.map((f) => {
          const showError = f.required && touched[f.key] && missingRequired[f.key];

          return (
            <div
              key={f.key}
              style={{
                ...styles.card,
                gridColumn: f.span === 2 ? "1 / -1" : "auto",
                border: showError ? "1px solid #fecdd3" : styles.card.border,
              }}
            >
              <div style={styles.cardTop}>
                <div style={styles.cardLabel}>{f.label}</div>
                {f.required && <div style={styles.reqPill}>Required</div>}
              </div>

              <input
                name={f.key} // ✅ backend key
                value={form[f.key] ?? ""}
                onChange={onChange}
                onBlur={() => onBlur(f.key)}
                type={f.type || "text"}
                placeholder={f.placeholder || ""}
                autoComplete="off"
                style={{
                  ...styles.input,
                  border: showError ? "1px solid #dc2626" : styles.input.border,
                }}
              />

              {!!f.help && <div style={styles.help}>{f.help}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
