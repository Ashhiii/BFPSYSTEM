import React, { useMemo, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import TopRightToast from "../components/TopRightToast";
import AddTabs from "../components/AddTabs";

const INITIAL_FORM = {
  clearanceType: "",
  recordId: "",
  fsicNumber: "",
  fsicAppNo: "",
  ownerName: "",
  establishmentName: "",
  businessAddress: "",
  contactNumber: "",
  orNumber: "",
  orAmount: "",
  orDate: "",
  chiefName: "",
  chiefPosition: "",
  marshalName: "",
  plateNumber: "",
};

const UPPER_KEYS = new Set([
  "recordId",
  "fsicNumber",
  "fsicAppNo",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",
  "orNumber",
  "orAmount",
  "chiefName",
  "chiefPosition",
  "marshalName",
  "plateNumber",
]);

const CLEARANCE_TYPES = [
  "Conveyance",
  "Business Permit",
  "Occupancy Permit",
  "Fireworks Display",
  "Installation Clearance",
  "Storage Permit",
  "Other",
];

const FIELDS = [
  { key: "clearanceType", label: "Clearance Type", type: "select", required: true, span: 1 },
  { key: "recordId", label: "Record ID", type: "text", placeholder: "Record ID", required: false, span: 1 },

  { key: "fsicNumber", label: "FSIC Number", type: "text", placeholder: "FSIC Number", required: false, span: 1 },
  { key: "fsicAppNo", label: "FSIC App No.", type: "text", placeholder: "FSIC App No.", required: true, span: 1 },

  { key: "ownerName", label: "Owner Name", type: "text", placeholder: "Owner Name", required: true, span: 1 },
  { key: "establishmentName", label: "Establishment Name", type: "text", placeholder: "Establishment Name", required: true, span: 1 },

  { key: "businessAddress", label: "Business Address", type: "text", placeholder: "Business Address", required: false, span: 2 },

  { key: "contactNumber", label: "Contact Number", type: "text", placeholder: "Contact Number", required: false, span: 1 },
  { key: "orNumber", label: "OR Number", type: "text", placeholder: "OR Number", required: false, span: 1 },

  { key: "orAmount", label: "OR Amount", type: "number", placeholder: "0.00", required: false, span: 1 },
  { key: "orDate", label: "OR Date", type: "date", placeholder: "", required: false, span: 1 },

  { key: "chiefName", label: "Chief Name", type: "text", placeholder: "Chief Name", required: false, span: 1 },
  { key: "chiefPosition", label: "Chief Position", type: "text", placeholder: "Chief Position", required: false, span: 1 },

  { key: "marshalName", label: "Marshal Name", type: "text", placeholder: "Marshal Name", required: false, span: 1 },
  { key: "plateNumber", label: "Plate Number", type: "text", placeholder: "Plate Number", required: false, span: 1 },
];

export default function AddClearance({ setRefresh }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [toastOpen, setToastOpen] = useState(false);

  const topRef = useRef(null);

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

  const scrollToTop = () => {
    if (topRef.current?.scrollIntoView) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

  const onBlur = (k) => {
    setTouched((p) => ({ ...p, [k]: true }));
  };

  const onChange = (e) => {
    const { name, value, tagName } = e.target;

    const finalValue =
      tagName === "SELECT"
        ? value
        : UPPER_KEYS.has(name)
        ? String(value ?? "").toUpperCase()
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const submit = async () => {
    if (
      !form.clearanceType?.trim() ||
      !form.fsicAppNo?.trim() ||
      !form.ownerName?.trim() ||
      !form.establishmentName?.trim()
    ) {
      setTouched((p) => ({
        ...p,
        clearanceType: true,
        fsicAppNo: true,
        ownerName: true,
        establishmentName: true,
      }));
      scrollToTop();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "clearances"), payload);

      setToastOpen(true);
      setForm(INITIAL_FORM);
      setTouched({});
      setRefresh?.((p) => !p);

      scrollToTop();
    } catch (error) {
      console.error(error);
      alert("Firestore error. Check rules / permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={styles.wrap}>
        <div ref={topRef} />

        <AddTabs />

        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>Add Clearance</div>
            <div style={styles.sub}>Fill out the clearance details below.</div>
          </div>
        </div>

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

                {f.type === "select" ? (
                  <select
                    name={f.key}
                    value={form[f.key] ?? ""}
                    onChange={onChange}
                    onBlur={() => onBlur(f.key)}
                    style={{
                      ...styles.input,
                      border: showError ? "1px solid #dc2626" : styles.input.border,
                      cursor: "pointer",
                    }}
                  >
                    <option value="">-- SELECT --</option>
                    {CLEARANCE_TYPES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={f.key}
                    value={form[f.key] ?? ""}
                    onChange={onChange}
                    onBlur={() => onBlur(f.key)}
                    type={f.type || "text"}
                    placeholder={f.placeholder || ""}
                    autoComplete="off"
                    style={{
                      ...styles.input,
                      border: showError ? "1px solid #dc2626" : styles.input.border,
                      textTransform:
                        f.type === "date"
                          ? "none"
                          : UPPER_KEYS.has(f.key)
                          ? "uppercase"
                          : "none",
                    }}
                  />
                )}
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
            type="button"
            style={styles.btn}
            onClick={() => {
              setForm(INITIAL_FORM);
              setTouched({});
              scrollToTop();
            }}
            disabled={saving}
          >
            Clear
          </button>

          <button type="button" style={styles.primary} onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save Clearance"}
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
        title="Added to Clearances"
        message="Clearance saved successfully."
        autoCloseMs={1600}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}