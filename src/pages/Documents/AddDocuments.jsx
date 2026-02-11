import React, { useMemo, useState } from "react";

export default function AddDocument({ onSaved }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const initial = useMemo(
    () => ({
      fsicAppNo: "",
      ownerName: "",
      establishmentName: "",
    }),
    []
  );

  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const change = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const clearForm = () => {
    if (loading) return;
    setForm(initial);
    setMsg("");
  };

  const focusOn = (e) => {
    e.target.style.borderColor = "#2563eb";
    e.target.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.15)";
  };

  const focusOff = (e) => {
    e.target.style.borderColor = "#cbd5e1";
    e.target.style.boxShadow = "none";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.fsicAppNo || !form.ownerName || !form.establishmentName) {
      setMsg("Please fill in FSIC App No, Owner, and Establishment.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to add document");
      }

      setForm(initial);
      setMsg("✅ Document added successfully");
      onSaved?.();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STYLES ================= */

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  };

  const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  };

  const title = { fontSize: 16, fontWeight: 950, color: "#0f172a" };
  const subtitle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    marginTop: 6,
  };

  const actionsTop = { display: "flex", gap: 8, alignItems: "center" };

  const btn = (type = "primary") => ({
    padding: "9px 14px",
    borderRadius: 12,
    border: type === "primary" ? "1px solid #2563eb" : "1px solid #e5e7eb",
    background: type === "primary" ? "#2563eb" : "#fff",
    color: type === "primary" ? "#fff" : "#0f172a",
    fontWeight: 950,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
  });

  const formGrid = {
    marginTop: 16,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  };

  const full = { gridColumn: "1 / -1" };

  const field = {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    paddingRight: 35,
  };

  const labelRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };

  const label = { fontSize: 12, fontWeight: 950, color: "#334155" };

  const req = {
    fontSize: 11,
    fontWeight: 950,
    color: "#dc2626",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "4px 8px",
    borderRadius: 999,
  };

  const input = {
    width: "100%",
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    background: "#fff",
    transition: "box-shadow 120ms ease, border-color 120ms ease",
  };

  const hint = {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
  };

  const msgBox = (ok) => ({
    ...full,
    padding: "10px 12px",
    borderRadius: 12,
    border: ok ? "1px solid #bbf7d0" : "1px solid #fecaca",
    background: ok ? "#f0fdf4" : "#fef2f2",
    color: ok ? "#166534" : "#991b1b",
    fontSize: 12,
    fontWeight: 900,
  });

  return (
    <div style={card}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <div style={title}>Add Document</div>
          <div style={subtitle}>Fill in the document details</div>
        </div>

        {/* TOP BUTTONS */}
        <div style={actionsTop}>
          <button
            type="button"
            style={btn("ghost")}
            onClick={clearForm}
            disabled={loading}
          >
            Clear
          </button>
          <button
            type="submit"
            form="docForm"
            style={btn("primary")}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* FORM */}
      <form id="docForm" onSubmit={submit} style={formGrid}>
        <div style={field}>
          <div style={labelRow}>
            <div style={label}>FSIC App No</div>
            <div style={req}>Required</div>
          </div>
          <input
            name="fsicAppNo"
            value={form.fsicAppNo}
            onChange={change}
            style={input}
            placeholder="2026-00123"
            onFocus={focusOn}
            onBlur={focusOff}
            disabled={loading}
          />
          <div style={hint}>Use the official FSIC application number.</div>
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>Owner</div>
            <div style={req}>Required</div>
          </div>
          <input
            name="ownerName"
            value={form.ownerName}
            onChange={change}
            style={input}
            placeholder="Owner name"
            onFocus={focusOn}
            onBlur={focusOff}
            disabled={loading}
          />
          <div style={hint}>
            Person/representative responsible for the establishment.
          </div>
        </div>

        <div style={{ ...field, ...full }}>
          <div style={labelRow}>
            <div style={label}>Establishment</div>
            <div style={req}>Required</div>
          </div>
          <input
            name="establishmentName"
            value={form.establishmentName}
            onChange={change}
            style={input}
            placeholder="Establishment name"
            onFocus={focusOn}
            onBlur={focusOff}
            disabled={loading}
          />
          <div style={hint}>Business name / building / place inspected.</div>
        </div>

        {msg && <div style={msgBox(msg.includes("✅"))}>{msg}</div>}
      </form>
    </div>
  );
}
