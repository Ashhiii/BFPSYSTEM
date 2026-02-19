import React, { useEffect, useMemo, useState } from "react";
import {
  doc as fsDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase"; // ✅ adjust path
import RenewRecordPanel from "./RenewRecordPanel.jsx";

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
  onUpdated,
}) {
  const [mode, setMode] = useState("view"); // view | edit | renew
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

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
    danger: "#dc2626",
  };

  useEffect(() => {
    setMode("view");
    setSaving(false);
    if (!record) return;

    const init = {};
    FIELDS.forEach((f) => (init[f.key] = record?.[f.key] ?? ""));
    init.teamLeader = record?.teamLeader ?? "";
    setForm(init);
  }, [record]);

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

  // Determine which collection this record belongs to
  // If you opened this page from Renewed screen => collection is "renewed"
  // If from Records screen => collection is "records"
  const collectionName = useMemo(() => {
    const s = String(source || "").toLowerCase();
    if (s.includes("renew")) return "renewed";
    if (s.includes("archive")) return "archive"; // (if you implement archive in firestore)
    return "records";
  }, [source]);

  const saveEdit = async () => {
    if (!record?.id) return;

    try {
      setSaving(true);

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = form[f.key] ?? ""));
      payload.teamLeader = form.teamLeader ?? "";
      payload.updatedAt = serverTimestamp();

      // update in same collection where record came from
      const ref = fsDoc(db, collectionName, String(record.id));
      await updateDoc(ref, payload);

      setMode("view");
      onUpdated?.({ ...record, ...payload });
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
            <button style={btn("primary")} onClick={() => setMode("edit")}>
              Edit
            </button>
          )}

          {isArchive && mode === "view" && (
            <button style={btn("gold")} onClick={() => setMode("renew")}>
              Renew
            </button>
          )}

          {mode === "edit" && (
            <>
              <button style={btn("gold")} onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button style={btn("danger")} onClick={() => setMode("view")} disabled={saving}>
                Cancel
              </button>
            </>
          )}

          {mode === "renew" && (
            <button style={btn("danger")} onClick={() => setMode("view")} disabled={saving}>
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
                <td style={valueTd}>
                  {mode === "edit" ? (
                    <input
                      name={f.key}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
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

            <tr>
              <td style={labelTd}>Team Leader</td>
              <td style={valueTd}>
                {mode === "edit" ? (
                  <input
                    name="teamLeader"
                    value={form.teamLeader ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, teamLeader: e.target.value }))}
                    style={inputStyle}
                    autoComplete="off"
                    placeholder="Team Leader"
                  />
                ) : (
                  (record?.teamLeader ?? "") || "-"
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {mode === "renew" && (
          <RenewRecordPanel
            record={record}
            source={source}
            onCancel={() => setMode("view")}
            onRenewSaved={(payload) => {
              setMode("view");
              onRenewSaved?.(payload);
            }}
          />
        )}
      </div>
    </div>
  );
}
