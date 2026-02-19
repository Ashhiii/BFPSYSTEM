import React, { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function AddDocument({ onSaved }) {
  const initial = useMemo(
    () => ({
      fsicAppNo: "",
      ownerName: "",
      establishmentName: "",

      businessAddress: "",
      contactNumber: "",

      ioNumber: "",
      ioDate: "",

      nfsiNumber: "",
      nfsiDate: "",

      inspectors: "",
      teamLeader: "",

      chiefName: "",
      marshalName: "",
    }),
    []
  );

  const UPPER_KEYS = useMemo(
    () =>
      new Set([
        "fsicAppNo",
        "ownerName",
        "establishmentName",
        "businessAddress",
        "contactNumber",
        "ioNumber",
        "nfsiNumber",
        "inspectors",
        "teamLeader",
        "chiefName",
        "marshalName",
      ]),
    []
  );

  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const change = (e) => {
    const { name, value } = e.target;
    const v = UPPER_KEYS.has(name) ? String(value ?? "").toUpperCase() : value;
    setForm((p) => ({ ...p, [name]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.fsicAppNo.trim() || !form.ownerName.trim()) {
      setMsg("❌ PLEASE FILL IN FSIC APP NO AND OWNER.");
      return;
    }

    try {
      setLoading(true);

      // ✅ SAVE TO FIRESTORE
      await addDoc(collection(db, "documents"), {
        ...form,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(initial);
      setMsg("✅ DOCUMENT ADDED SUCCESSFULLY");
      onSaved?.();
    } catch (err) {
      setMsg("❌ FIRESTORE ERROR (CHECK RULES).");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  };

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

  const label = { fontSize: 12, fontWeight: 950, color: "#334155", textTransform: "uppercase" };

  const req = {
    fontSize: 11,
    fontWeight: 950,
    color: "#dc2626",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "4px 8px",
    borderRadius: 999,
    textTransform: "uppercase",
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
    textTransform: "uppercase",
  };

  const hint = { marginTop: 8, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" };

  const btn = (primary = false) => ({
    padding: "9px 14px",
    borderRadius: 12,
    border: primary ? "1px solid #2563eb" : "1px solid #e5e7eb",
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#0f172a",
    fontWeight: 950,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
    textTransform: "uppercase",
  });

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950, color: "#0f172a", textTransform: "uppercase" }}>
            Add Document
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 6, textTransform: "uppercase" }}>
            Fill in details (FSIC + Owner required).
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btn(false)} onClick={() => setForm(initial)} disabled={loading}>
            Clear
          </button>
          <button type="submit" form="docForm" style={btn(true)} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <form id="docForm" onSubmit={submit} style={formGrid}>
        <div style={field}>
          <div style={labelRow}>
            <div style={label}>FSIC App No</div>
            <div style={req}>Required</div>
          </div>
          <input name="fsicAppNo" value={form.fsicAppNo} onChange={change} style={input} placeholder="2026-00123" />
          <div style={hint}>Use the official FSIC application number.</div>
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>Owner</div>
            <div style={req}>Required</div>
          </div>
          <input name="ownerName" value={form.ownerName} onChange={change} style={input} placeholder="Owner name" />
          <div style={hint}>Person/representative responsible for the establishment.</div>
        </div>

        <div style={{ ...field, ...full }}>
          <div style={labelRow}>
            <div style={label}>Establishment</div>
          </div>
          <input name="establishmentName" value={form.establishmentName} onChange={change} style={input} placeholder="Establishment name" />
          <div style={hint}>Business name / building / place inspected.</div>
        </div>

        <div style={{ ...field, ...full }}>
          <div style={labelRow}>
            <div style={label}>Business Address</div>
          </div>
          <input name="businessAddress" value={form.businessAddress} onChange={change} style={input} placeholder="Full address" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>Contact Number</div>
          </div>
          <input name="contactNumber" value={form.contactNumber} onChange={change} style={input} placeholder="09XXXXXXXXX" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>IO Number</div>
          </div>
          <input name="ioNumber" value={form.ioNumber} onChange={change} style={input} placeholder="IO NO" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>IO Date</div>
          </div>
          <input name="ioDate" value={form.ioDate} onChange={change} style={{ ...input, textTransform: "none" }} type="date" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>NFSI Number</div>
          </div>
          <input name="nfsiNumber" value={form.nfsiNumber} onChange={change} style={input} placeholder="NFSI NO" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>NFSI Date</div>
          </div>
          <input name="nfsiDate" value={form.nfsiDate} onChange={change} style={{ ...input, textTransform: "none" }} type="date" />
        </div>

        <div style={{ ...field, ...full }}>
          <div style={labelRow}>
            <div style={label}>Inspectors</div>
          </div>
          <input name="inspectors" value={form.inspectors} onChange={change} style={input} placeholder="INSPECTOR NAMES" />
        </div>

        <div style={{ ...field, ...full }}>
          <div style={labelRow}>
            <div style={label}>Team Leader</div>
          </div>
          <input name="teamLeader" value={form.teamLeader} onChange={change} style={input} placeholder="TEAM LEADER" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>Chief</div>
          </div>
          <input name="chiefName" value={form.chiefName} onChange={change} style={input} placeholder="CHIEF NAME" />
        </div>

        <div style={field}>
          <div style={labelRow}>
            <div style={label}>Marshal</div>
          </div>
          <input name="marshalName" value={form.marshalName} onChange={change} style={input} placeholder="MARSHAL NAME" />
        </div>

        {msg && (
          <div
            style={{
              ...full,
              padding: "10px 12px",
              borderRadius: 12,
              border: msg.includes("✅") ? "1px solid #bbf7d0" : "1px solid #fecaca",
              background: msg.includes("✅") ? "#f0fdf4" : "#fef2f2",
              color: msg.includes("✅") ? "#166534" : "#991b1b",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
