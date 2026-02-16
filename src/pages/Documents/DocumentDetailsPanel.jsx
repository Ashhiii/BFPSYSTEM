import React, { useEffect, useMemo, useState } from "react";

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
  { key: "inspectors", label: "Inspectors" },
  { key: "teamLeader", label: "Team Leader" },
  { key: "chiefName", label: "Chief" },
  { key: "marshalName", label: "Marshal" },
];

export default function DocumentDetailsPanel({ doc, onUpdated }) {
  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

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
    danger: "#dc2626",
  };

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

  const panel = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.bg,
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 520, // 🔥 taason para dili nipis tan-awon
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
    padding: "14px 12px", // 🔥 more height per row
    borderBottom: `1px solid ${C.border}`,
    fontWeight: 850,
    fontSize: 13,
    verticalAlign: "top",
  };

  const labelTd = {
    ...baseTd,
    fontWeight: 950,
    width: 160,
    color: C.primaryDark,
    background: "#fff",
  };

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

  const save = async () => {
    if (!doc?.id) return;

    try {
      setSaving(true);

      // ✅ send ALL fields
      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = form[f.key] ?? ""));

      const res = await fetch(`${API}/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Update failed");
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Update failed");
      }

      setEditing(false);
      onUpdated?.(data.data);
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

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
            Doc ID: {doc.id}
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
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={inputStyle}
                      autoComplete="off"
                      placeholder={f.label}
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
            Tip: After editing, generate PDF again.
          </div>
        ) : null}
      </div>
    </div>
  );
}
