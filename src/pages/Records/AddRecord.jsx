import React, { useState } from "react";

const INITIAL_FORM = {
  no: "",
  fsicAppNo: "",
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

export default function AddRecord({ setRefresh }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    fontWeight: 800,
    background: "#fff",
    boxSizing: "border-box",
  };

  const label = {
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
    marginBottom: 6,
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 950,
  };

  const primary = {
    ...btn,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#fff",
  };

  const submit = async () => {
    if (!form.ownerName || !form.establishmentName) {
      return alert("Required: ownerName and establishmentName");
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

      setRefresh?.((p) => !p);
    } catch (e) {
      console.error(e);
      alert("Server error. Check backend terminal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
            Add Record
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              marginTop: 6,
            }}
          >
            Fill up the fields then save.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={btn}
            onClick={() => setForm(INITIAL_FORM)}
            disabled={saving}
          >
            Clear
          </button>
          <button style={primary} onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {Object.keys(INITIAL_FORM).map((k) => (
          <div key={k}>
            <div style={label}>{k}</div>
            <input
              style={input}
              value={form[k] ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, [k]: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", fontWeight: 800 }}>
        Required: <b>ownerName</b>, <b>establishmentName</b>
      </div>
    </div>
  );
}
