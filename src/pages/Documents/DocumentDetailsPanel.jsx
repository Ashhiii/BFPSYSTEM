import React, { useEffect, useMemo, useState } from "react";
import { doc as fsDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No" },
  { key: "ownerName", label: "Owner" },
  { key: "establishmentName", label: "Establishment" },
  { key: "businessAddress", label: "Address" },
  { key: "contactNumber", label: "Contact Number" },

  { key: "ioDate", label: "IO Date" },
  { key: "ioNumber", label: "IO Number" },
  { key: "nfsiNumber", label: "NFSI Number" },
  { key: "nfsiDate", label: "NFSI Date" },

  { key: "ntcNumber", label: "NTC Number" },
  { key: "ntcDate", label: "NTC Date" },

  { key: "teamLeader", label: "Team Leader" },
  { key: "teamLeaderSerial", label: "Team Leader Serial" },

  { key: "inspector1", label: "Inspector 1" },
  { key: "inspector1Serial", label: "Inspector 1 Serial" },

  { key: "inspector2", label: "Inspector 2" },
  { key: "inspector2Serial", label: "Inspector 2 Serial" },

  { key: "inspector3", label: "Inspector 3" },
  { key: "inspector3Serial", label: "Inspector 3 Serial" },

  // ✅ combined auto
  { key: "inspectors", label: "Inspectors (Combined)" },

  { key: "chiefName", label: "Chief" },
  { key: "marshalName", label: "Marshal" },
];

// ✅ ONLY fields you really want ALWAYS UPPERCASE
const CAPS_KEYS = new Set([
  "fsicAppNo",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",
  "ioNumber",
  "nfsiNumber",
  "ntcNumber",
  "chiefName",
  "marshalName",
]);

// ✅ Keep EXACT casing as typed (no auto-caps) — same as Records
const NO_CAPS_KEYS = new Set([
  "teamLeader",
  "teamLeaderSerial",
  "inspector1",
  "inspector1Serial",
  "inspector2",
  "inspector2Serial",
  "inspector3",
  "inspector3Serial",
  "inspectors", // combined (auto)
]);

const DATE_KEYS = new Set(["ioDate", "nfsiDate", "ntcDate"]);

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

/** ✅ Convert whatever value -> YYYY-MM-DD for <input type="date"> */
const toInputDate = (v) => {
  if (!v) return "";

  // Firestore Timestamp
  if (v?.toDate) {
    const d = v.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // already YYYY-MM-DD
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // ISO / parseable date string (includes "January 2, 2026")
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
    const d = new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return "";
};

// ✅ Combine inspector 1/2/3 -> string (auto)
const combineInspectors = (a, b, c) => {
  return [a, b, c]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
};

export default function DocumentDetailsPanel({ doc, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setEditing(false);
    setSaving(false);
    if (!doc) return;

    // ✅ init form (normalize dates + auto combine inspectors)
    const init = {};
    FIELDS.forEach((f) => {
      const raw = doc?.[f.key] ?? "";
      init[f.key] = DATE_KEYS.has(f.key) ? toInputDate(raw) : raw;
    });

    // ✅ auto compute inspectors combined
    init.inspectors = combineInspectors(init.inspector1, init.inspector2, init.inspector3);

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
    textTransform: CAPS_KEYS.has(k) && !NO_CAPS_KEYS.has(k) ? "uppercase" : "none",
  });

  // ✅ same behavior as Records:
  // - TL/Inspectors keep exact casing
  // - auto-combine inspectors when any inspector changes
  const setField = (k, v) => {
    setForm((p) => {
      const next = { ...p };

      // keep exact casing for name fields
      if (NO_CAPS_KEYS.has(k)) next[k] = String(v ?? "");
      else next[k] = CAPS_KEYS.has(k) ? String(v ?? "").toUpperCase() : String(v ?? "");

      // ✅ inspector changes -> auto combined inspectors
      if (k === "inspector1" || k === "inspector2" || k === "inspector3") {
        next.inspectors = combineInspectors(next.inspector1, next.inspector2, next.inspector3);
      }

      return next;
    });
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

      // ✅ ensure combined inspectors correct before saving
      const ensured = { ...form };
      ensured.inspectors = combineInspectors(
        ensured.inspector1,
        ensured.inspector2,
        ensured.inspector3
      );

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = ensured[f.key] ?? ""));

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
    padding: "12px 10px",
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

  // ✅ group fields into pairs: [ [f1,f2], [f3,f4], ... ]
  const pairs = FIELDS.reduce((rows, f, idx) => {
    if (idx % 2 === 0) rows.push([f]);
    else rows[rows.length - 1].push(f);
    return rows;
  }, []);

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
            {pairs.map((pair, rowIndex) => (
              <tr key={rowIndex}>
                {pair.map((f) => (
                  <React.Fragment key={f.key}>
                    <td style={labelTd}>{f.label}</td>
                    <td style={valueTd}>
                      {editing ? (
                        <input
                          name={f.key}
                          value={form[f.key] ?? ""}
                          onChange={(e) => setField(f.key, e.target.value)}
                          style={{
                            ...inputStyle(f.key),
                            ...(f.key === "inspectors"
                              ? { background: "#f3f4f6", cursor: "not-allowed" }
                              : null),
                          }}
                          autoComplete="off"
                          placeholder={f.label}
                          type={DATE_KEYS.has(f.key) ? "date" : "text"}
                          readOnly={f.key === "inspectors"} // ✅ AUTO
                        />
                      ) : (
                        (doc?.[f.key] ?? "") || "-"
                      )}
                    </td>
                  </React.Fragment>
                ))}

                {/* ✅ if odd, fill empty cells */}
                {pair.length === 1 && (
                  <>
                    <td style={labelTd}></td>
                    <td style={valueTd}></td>
                  </>
                )}
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