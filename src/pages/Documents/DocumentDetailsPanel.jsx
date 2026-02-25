// DocumentDetailsPanel.jsx (FULL UPDATED)
// ✅ edits Chief/Marshal + inspectors 1/2/3 + serial + TL serial + NTC fields
// ✅ saves back to Firestore records/{id}

import React, { useEffect, useMemo, useState } from "react";
import { doc as fsDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No" },
  { key: "ownerName", label: "Owner" },
  { key: "establishmentName", label: "Establishment" },
  { key: "businessAddress", label: "Address" },
  { key: "contactNumber", label: "Contact Number" },

  // IO / NFSI
  { key: "ioDate", label: "IO Date" },
  { key: "ioNumber", label: "IO Number" },
  { key: "nfsiNumber", label: "NFSI Number" },
  { key: "nfsiDate", label: "NFSI Date" },

  // ✅ ADD: NTC
  { key: "ntcNumber", label: "NTC Number" },
  { key: "ntcDate", label: "NTC Date" },

  // ✅ Team Leader + Serial
  { key: "teamLeader", label: "Team Leader" },
  { key: "teamLeaderSerial", label: "Team Leader Serial" },

  // ✅ Inspectors 1/2/3 + Serial
  { key: "inspector1", label: "Inspector 1" },
  { key: "inspector1Serial", label: "Inspector 1 Serial" },

  { key: "inspector2", label: "Inspector 2" },
  { key: "inspector2Serial", label: "Inspector 2 Serial" },

  { key: "inspector3", label: "Inspector 3" },
  { key: "inspector3Serial", label: "Inspector 3 Serial" },

  // keep combined if you still use it
  { key: "inspectors", label: "Inspectors (Combined)" },

  // Signatories
  { key: "chiefName", label: "Chief" },
  { key: "marshalName", label: "Marshal" },
];

const CAPS_KEYS = new Set([
  "fsicAppNo",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",

  "ioNumber",
  "nfsiNumber",

  // ✅ NTC
  "ntcNumber",

  // ✅ TL / Inspectors
  "teamLeader",
  "teamLeaderSerial",
  "inspector1",
  "inspector1Serial",
  "inspector2",
  "inspector2Serial",
  "inspector3",
  "inspector3Serial",
  "inspectors",

  "chiefName",
  "marshalName",
]);

const DATE_KEYS = new Set([
  "ioDate",
  "nfsiDate",
  // ✅ NTC date
  "ntcDate",
]);

const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  softBg: "#fef2f2",
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  danger: "#dc2626",
};

export default function DocumentDetailsPanel({ doc, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setEditing(false);
    setSaving(false);
    if (!doc) return;

    const init = {};
    FIELDS.forEach((f) => (init[f.key] = doc?.[f.key] ?? ""));
    setForm(init);
  }, [doc]);

  const title = useMemo(() => {
    return doc?.establishmentName || doc?.fsicAppNo || "Document";
  }, [doc]);

  const inputStyle = (k) => ({
    width: "100%",
    padding: "9px 10px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    outline: "none",
    fontSize: 13,
    color: C.text,
    background: "#fff",
    boxSizing: "border-box",
    fontWeight: 850,
    textTransform: CAPS_KEYS.has(k) ? "uppercase" : "none",
  });

  const setField = (k, v) => {
    const next = CAPS_KEYS.has(k) ? String(v ?? "").toUpperCase() : v;
    setForm((p) => ({ ...p, [k]: next }));
  };

  const btn = (variant) => {
    const common = {
      padding: "10px 12px",
      borderRadius: 12,
      fontWeight: 950,
      cursor: "pointer",
      whiteSpace: "nowrap",
      opacity: saving ? 0.7 : 1,
    };
    if (variant === "primary")
      return { ...common, border: `1px solid ${C.primary}`, background: C.primary, color: "#fff" };
    if (variant === "gold")
      return { ...common, border: `1px solid ${C.gold}`, background: C.gold, color: "#111827" };
    if (variant === "danger")
      return { ...common, border: `1px solid ${C.danger}`, background: C.softBg, color: C.danger };
    return common;
  };

  const save = async () => {
    if (!doc?.id) return;

    try {
      setSaving(true);

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = form[f.key] ?? ""));

      // ✅ SAVE BACK TO records/{id}
      const ref = fsDoc(db, "records", String(doc.id));
      await setDoc(
        ref,
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const updated = { ...doc, ...payload };
      setEditing(false);
      onUpdated?.(updated);
    } catch (e) {
      console.error("update record (documents view) error:", e);
      alert(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const panel = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.bg,
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 520,
  };

  const head = {
    padding: 12,
    borderBottom: `1px solid ${C.border}`,
    background: C.softBg,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  };

  const body = { flex: 1, overflowY: "auto", padding: 12 };

  const baseTd = {
    padding: "14px 12px",
    borderBottom: `1px solid ${C.border}`,
    fontWeight: 850,
    fontSize: 13,
    verticalAlign: "top",
  };

  const labelTd = { ...baseTd, fontWeight: 950, width: 180, color: C.primaryDark, background: "#fff" };
  const valueTd = { ...baseTd, color: C.text, background: "#fff" };

  if (!doc) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>Documents</span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800 }}>
          Click a row to show details here.
        </div>
      </div>
    );
  }

  return (
    <div style={panel}>
      <div style={head}>
        <div>
          <div style={{ fontWeight: 950, color: C.primaryDark }}>{title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 800, marginTop: 4 }}>
            Record ID: {doc.id}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!editing ? (
            <button style={btn("primary")} onClick={() => setEditing(true)}>
              Edit
            </button>
          ) : (
            <>
              <button style={btn("gold")} onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button style={btn("danger")} onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div style={body}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f.key}>
                <td style={labelTd}>{f.label}</td>
                <td style={valueTd}>
                  {editing ? (
                    <input
                      name={f.key}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      style={inputStyle(f.key)}
                      autoComplete="off"
                      placeholder={f.label}
                      type={DATE_KEYS.has(f.key) ? "date" : "text"}
                    />
                  ) : (
                    (doc?.[f.key] ?? "") || "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!editing ? (
          <div style={{ marginTop: 12, color: C.muted, fontWeight: 850 }}>
            Tip: After editing Inspectors/Serials + Chief/Marshal, generate PDF again.
          </div>
        ) : null}
      </div>
    </div>
  );
}