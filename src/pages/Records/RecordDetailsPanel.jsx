import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const FIELDS = [
  { key: "no", label: "No" },
  { key: "fsicAppNo", label: "FSIC App No" },
  { key: "natureOfInspection", label: "Inspection" },
  { key: "ownerName", label: "Owner" },
  { key: "establishmentName", label: "Establishment" },
  { key: "businessAddress", label: "Address" },
  { key: "contactNumber", label: "Contact" },
  { key: "dateInspected", label: "Date Inspected" },
  { key: "ioNumber", label: "IO No" },
  { key: "ioDate", label: "IO Date" },
  { key: "nfsiNumber", label: "NFSI No" },
  { key: "nfsiDate", label: "NFSI Date" },
  { key: "ntcNumber", label: "NTC No" },
  { key: "ntcDate", label: "NTC Date" },
  { key: "fsicValidity", label: "FSIC Validity" },
  { key: "defects", label: "Defects" },
  { key: "teamLeader", label: "Team Leader" },
  { key: "teamLeaderSerial", label: "Team Leader Serial" },
  { key: "inspector1", label: "Inspector 1" },
  { key: "inspector1Serial", label: "Inspector 1 Serial" },

  { key: "inspector2", label: "Inspector 2" },
  { key: "inspector2Serial", label: "Inspector 2 Serial" },

  { key: "inspector3", label: "Inspector 3" },
  { key: "inspector3Serial", label: "Inspector 3 Serial" },

  // (keep your old inspectors field if you still use it)
  { key: "inspectors", label: "Inspectors (Combined)" },
  { key: "inspectors", label: "Inspectors" },
  { key: "occupancyType", label: "Occupancy" },
  { key: "buildingDesc", label: "Building Desc" },
  { key: "floorArea", label: "Floor Area" },
  { key: "buildingHeight", label: "Height" },
  { key: "storeyCount", label: "Storey" },
  { key: "highRise", label: "High Rise" },
  { key: "fsmr", label: "FSMR" },
  { key: "remarks", label: "Remarks" },
  { key: "orNumber", label: "OR No" },
  { key: "orAmount", label: "OR Amount" },
  { key: "orDate", label: "OR Date" },
  { key: "chiefName", label: "Chief" },
  { key: "marshalName", label: "Marshal" },
];

const CAPS_KEYS = new Set([
  "fsicAppNo",
  "natureOfInspection",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",

  "ioNumber",
  "nfsiNumber",

  // ✅ ADD: NTC
  "ntcNumber",

  "fsicValidity",
  "defects",

  // ✅ ADD: TL + Inspectors
  "teamLeader",
  "teamLeaderSerial",

  "inspector1",
  "inspector1Serial",
  "inspector2",
  "inspector2Serial",
  "inspector3",
  "inspector3Serial",

  "inspectors",
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
  "chiefName",
  "marshalName",
]);

const DATE_KEYS = new Set([
  "dateInspected",
  "ioDate",
  "nfsiDate",

  // ✅ ADD: NTC DATE
  "ntcDate",

  "orDate",
]);

export default function RecordDetailsPanel({
  styles,
  record,
  source,
  isArchive,
  onRenewSaved,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [renewedRecord, setRenewedRecord] = useState(null);

  const entityKey = useMemo(() => record?.entityKey || "", [record]);

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    gold: "#f59e0b",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    green: "#16a34a",
    danger: "#dc2626",
  };

  useEffect(() => {
    setEditing(false);
    setRenewing(false);
    setSaving(false);
    setRenewedRecord(null);
    if (!record) return;

    const init = {};
    FIELDS.forEach((f) => (init[f.key] = record?.[f.key] ?? ""));
    setForm(init);

    // ✅ load latest renewed (renewals/{entityKey})
    if (!entityKey) return;
    getDoc(doc(db, "renewals", entityKey))
      .then((snap) => setRenewedRecord(snap.exists() ? snap.data()?.record || null : null))
      .catch(() => setRenewedRecord(null));
  }, [record, entityKey]);

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

  // ✅ Save edit
  const saveEdit = async () => {
    if (!record?.id) return alert("Missing record.id (cannot save).");

    try {
      setSaving(true);

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = form[f.key] ?? ""));
      payload.teamLeader = form.teamLeader ?? "";
      payload.updatedAt = serverTimestamp();

      const targetCol = isArchive
        ? doc(db, "archives", String(source || "").replace("Archive: ", ""), "records", record.id)
        : doc(db, "records", record.id);

      // if source string is not clean, just fallback to archive month from record.month if you store it
      // For safety, when archive mode, prefer passing month separately; but we'll keep it simple:
      await setDoc(targetCol, payload, { merge: true });

      // return merged object for UI
      const merged = { ...record, ...payload };
      setEditing(false);
      onUpdated?.({ ...merged, id: record.id });
    } catch (e) {
      alert(`❌ SAVE ERROR: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Save renew (writes renewals/{entityKey})
  const saveRenew = async () => {
    if (!record) return;
    if (!entityKey) return alert("Missing entityKey");

    try {
      setSaving(true);

      const newRecord = {
        ...record,
        ...form,
        entityKey,
        source: source || "unknown",
        renewedFromId: record?.id || "",
        renewedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "renewals", entityKey),
        { record: newRecord, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setRenewedRecord(newRecord);
      setRenewing(false);
      onRenewSaved?.({ oldId: record.id, newRecord });
    } catch (e) {
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

  const baseTd =
    styles?.td ||
    ({
      padding: "14px 12px",
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      verticalAlign: "top",
    });

  const labelTd = { ...baseTd, fontWeight: 950, width: 160, color: C.primaryDark, background: "#fff" };
  const valueTd = { ...baseTd, color: C.text, background: "#fff" };

  if (!record) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>{source}</span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800 }}>
          Click a row to show details here.
        </div>
      </div>
    );
  }

  const title = record.establishmentName || record.fsicAppNo || "Record";
  const mode = editing ? "edit" : renewing ? "renew" : "view";

  return (
    <div style={panel}>
      <div style={head}>
        <div>
          <div style={{ fontWeight: 950, color: C.primaryDark }}>{title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 800, marginTop: 4 }}>
            {source} {entityKey ? `• ${entityKey}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mode === "view" && (
            <>
              <button style={btn("primary")} onClick={() => setEditing(true)}>Edit</button>

              {isArchive && (
                <button
                  style={btn("gold")}
                  onClick={() => { setRenewing(true); setEditing(false); }}
                >
                  Renew
                </button>
              )}
            </>
          )}

          {mode === "edit" && (
            <>
              <button style={btn("gold")} onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button style={btn("danger")} onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
            </>
          )}

          {mode === "renew" && (
            <>
              <button style={btn("gold")} onClick={saveRenew} disabled={saving}>
                {saving ? "Saving..." : "Save Renew"}
              </button>
              <button style={btn("danger")} onClick={() => setRenewing(false)} disabled={saving}>
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
                  {mode === "edit" || mode === "renew" ? (
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
                    (record?.[f.key] ?? "") || "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {mode === "view" && (
          <>
            {renewedRecord ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  border: `1px dashed ${C.primary}`,
                  borderRadius: 12,
                  background: C.softBg,
                  color: C.primaryDark,
                  fontWeight: 900,
                }}
              >
                ✅ Latest renewed version exists for this record.
              </div>
            ) : (
              <div style={{ marginTop: 12, color: C.muted, fontWeight: 850 }}>
                No renewed version yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
