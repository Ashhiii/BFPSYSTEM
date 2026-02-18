import React, { useEffect, useMemo, useState } from "react";

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
  { key: "fsicValidity", label: "FSIC Validity" },
  { key: "defects", label: "Defects" },
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

// ✅ uppercase-save only for these keys
const UPPER_KEYS = new Set([
  "no",
  "fsicAppNo",
  "natureOfInspection",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",
  "ioNumber",
  "nfsiNumber",
  "fsicValidity",
  "defects",
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
  "chiefName",
  "marshalName",
]);

export default function RecordDetailsPanel({
  styles,
  record,
  source,
  isArchive,
  onRenewSaved,
  onUpdated,
}) {
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
    /\/+$/,
    ""
  );

  const [editing, setEditing] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [renewedRecord, setRenewedRecord] = useState(null);

  const entityKey = useMemo(() => record?.entityKey || "", [record]);

  /* 🔥 BFP COLORS */
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
    init.teamLeader = record?.teamLeader ?? "";
    setForm(init);

    if (!entityKey) return;

    fetch(`${API}/records/renewed/${encodeURIComponent(entityKey)}`)
      .then((r) => r.json())
      .then((d) => setRenewedRecord(d?.record || null))
      .catch(() => setRenewedRecord(null));
  }, [record, entityKey, API]);

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

  const caps = { textTransform: "uppercase" };

  const baseTd =
    styles?.td ||
    ({
      padding: "14px 12px",
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      verticalAlign: "top",
    });

  const labelTd = {
    ...baseTd,
    ...caps,
    fontWeight: 950,
    width: 160,
    color: C.primaryDark,
    background: "#fff",
  };

  const valueTd = { ...baseTd, ...caps, color: C.text, background: "#fff" };

  const inputStyle = {
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
    textTransform: "uppercase",
  };

  const btn = (variant) => {
    const common = {
      padding: "10px 12px",
      borderRadius: 12,
      fontWeight: 950,
      cursor: saving ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      opacity: saving ? 0.7 : 1,
    };
    if (variant === "primary")
      return {
        ...common,
        border: `1px solid ${C.primary}`,
        background: C.primary,
        color: "#fff",
      };
    if (variant === "gold")
      return {
        ...common,
        border: `1px solid ${C.gold}`,
        background: C.gold,
        color: "#111827",
      };
    if (variant === "danger")
      return {
        ...common,
        border: `1px solid ${C.danger}`,
        background: C.softBg,
        color: C.danger,
      };
    return common;
  };

  const onFieldChange = (key, value) => {
    const v = UPPER_KEYS.has(key) ? String(value ?? "").toUpperCase() : value;
    setForm((p) => ({ ...p, [key]: v }));
  };

  // ✅ EDIT CURRENT RECORD (needs PUT /records/:id)
  const saveEdit = async () => {
    if (!record?.id) return alert("Missing record.id (cannot save).");

    try {
      setSaving(true);

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = form[f.key] ?? ""));
      payload.teamLeader = form.teamLeader ?? "";

      const url = `${API}/records/${record.id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Backend returned non-JSON. Status ${res.status}`);
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Save failed. Status ${res.status}`);
      }

      setEditing(false);
      onUpdated?.(data.data); // ✅ updates table immediately (Records.jsx handles it)
    } catch (e) {
      alert(`❌ SAVE ERROR: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ✅ RENEW (creates renewed record)
  const saveRenew = async () => {
    if (!record) return;
    if (!entityKey) return alert("Missing entityKey");

    try {
      setSaving(true);

      const res = await fetch(`${API}/records/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityKey,
          source,
          oldRecord: record,
          updatedRecord: form,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Renew failed (non-JSON response).");
      }

      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Renew failed");

      setRenewedRecord(data.newRecord);
      setRenewing(false);
      onRenewSaved?.({ oldId: record.id, newRecord: data.newRecord });
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!record) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark, ...caps }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800, ...caps }}>
            {source}
          </span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800, ...caps }}>
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
          <div style={{ fontWeight: 950, color: C.primaryDark, ...caps }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 800,
              marginTop: 4,
              ...caps,
            }}
          >
            {source} {entityKey ? `• ${entityKey}` : ""}
          </div>
        </div>

        {/* ✅ Buttons like Documents */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mode === "view" && (
            <>
              {/* ✅ Edit only for CURRENT (not archive) */}
              {!isArchive && (
                <button style={btn("primary")} onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}

              {/* ✅ Renew only for ARCHIVE */}
              {isArchive && (
                <button
                  style={btn("gold")}
                  onClick={() => {
                    setRenewing(true);
                    setEditing(false);
                  }}
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
              <button
                style={btn("danger")}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}

          {mode === "renew" && (
            <>
              <button style={btn("gold")} onClick={saveRenew} disabled={saving}>
                {saving ? "Saving..." : "Save Renew"}
              </button>
              <button
                style={btn("danger")}
                onClick={() => setRenewing(false)}
                disabled={saving}
              >
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
                      onChange={(e) => onFieldChange(f.key, e.target.value)}
                      style={inputStyle}
                      autoComplete="off"
                      placeholder={f.label}
                    />
                  ) : (
                    (record?.[f.key] ?? "") || "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Renew status (view mode only) */}
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
                  ...caps,
                }}
              >
                ✅ Latest renewed version exists for this record.
              </div>
            ) : (
              <div style={{ marginTop: 12, color: C.muted, fontWeight: 850, ...caps }}>
                No renewed version yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
