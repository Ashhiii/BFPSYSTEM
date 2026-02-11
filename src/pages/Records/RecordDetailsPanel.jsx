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
];

export default function RecordDetailsPanel({
  styles,
  record,
  source,
  isArchive,
  onRenewSaved,
}) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [editing, setEditing] = useState(false);
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
    setRenewedRecord(null);
    if (!record) return;

    const init = {};
    FIELDS.forEach((f) => (init[f.key] = record[f.key] ?? ""));
    init.teamLeader = record.teamLeader ?? "";
    setForm(init);

    if (!entityKey) return;

    fetch(`${API}/records/renewed/${encodeURIComponent(entityKey)}`)
      .then((r) => r.json())
      .then((d) => setRenewedRecord(d?.record || null))
      .catch(() => setRenewedRecord(null));
  }, [record, entityKey, API]);

  /* ===================== BFP THEME PANEL STYLES ===================== */

  const panel = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.bg,
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 300,
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

  const body = {
    flex: 1,
    overflowY: "auto",
    padding: 12,
  };

  const baseTd =
    styles?.td ||
    ({
      padding: 10,
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
    });

  const labelTd = {
    ...baseTd,
    fontWeight: 950,
    width: 160,
    color: C.primaryDark,
    background: "#fff",
  };

  const valueTd = {
    ...baseTd,
    color: C.text,
    background: "#fff",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    outline: "none",
    fontSize: 14,
    color: C.text,
    background: "#fff",
    boxSizing: "border-box",
    fontWeight: 800,
  };

  const renewBtn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const cancelBtn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.danger}`,
    background: C.softBg,
    color: C.danger,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const saveBtn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.gold}`,
    background: C.gold,
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const saveRenew = async () => {
    if (!record) return;
    if (!entityKey) return alert("Missing entityKey");

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
      console.log("Non-JSON:", text);
      return alert("Renew failed. Check backend terminal.");
    }

    if (!res.ok || !data.success) return alert(data.message || "Renew failed");

    setRenewedRecord(data.newRecord);
    setEditing(false);
    onRenewSaved?.({ oldId: record.id, newRecord: data.newRecord });
  };

  if (!record) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>
            {source}
          </span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800 }}>
          Click a row to show details here.
        </div>
      </div>
    );
  }

  const title = record.establishmentName || record.fsicAppNo || "Record";

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
          {isArchive && !editing && (
            <button style={renewBtn} onClick={() => setEditing(true)}>
              Renew
            </button>
          )}
          {editing && (
            <button style={cancelBtn} onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div style={body}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f.key}>
                <td style={labelTd}>{f.label}</td>
                <td style={valueTd}>{record?.[f.key] || "-"}</td>
              </tr>
            ))}

            {record.teamLeader ? (
              <tr>
                <td style={labelTd}>Team Leader</td>
                <td style={valueTd}>{record.teamLeader}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

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

        {editing && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 950, marginBottom: 8, color: C.primaryDark }}>
              Renew / Edit Fields
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 950,
                      color: C.primaryDark,
                      marginBottom: 5,
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    name={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    style={inputStyle}
                    autoComplete="off"
                  />
                </div>
              ))}

              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 950,
                    color: C.primaryDark,
                    marginBottom: 5,
                  }}
                >
                  Team Leader (Renewed)
                </div>
                <input
                  name="teamLeader"
                  value={form.teamLeader ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, teamLeader: e.target.value }))
                  }
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={saveBtn} onClick={saveRenew}>
                Save Renew
              </button>
              <button style={cancelBtn} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
