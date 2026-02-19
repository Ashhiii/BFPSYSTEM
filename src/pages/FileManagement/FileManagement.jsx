import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase";

/* 🔥 BFP COLOR PALETTE */
const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  accent: "#f59e0b",
  bg: "#ffffff",
  softBg: "#fef2f2",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  danger: "#dc2626",
};

export default function FileManagement({ refresh, setRefresh }) {
  const [tab, setTab] = useState("records");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  /* ================= LOAD DATA ================= */

  const load = async () => {
    try {
      let colName = "records";

      if (tab === "documents") colName = "documents";
      if (tab === "renewed") colName = "renewals";

      const qy = query(collection(db, colName), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);

      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setRows(items);
    } catch (e) {
      console.error(e);
      setRows([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [tab, refresh]);

  /* ================= SEARCH ================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter((r) => {
      return (
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  /* ================= DELETE ================= */

  const deleteRow = async (r) => {
    if (!window.confirm("Delete this item permanently?")) return;

    try {
      let colName = "records";
      if (tab === "documents") colName = "documents";
      if (tab === "renewed") colName = "renewals";

      await deleteDoc(doc(db, colName, r.id));

      setRows((prev) => prev.filter((x) => x.id !== r.id));
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  /* ================= STYLES ================= */

  const tabBtn = (active) => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? C.primary : C.bg,
    color: active ? "#fff" : C.text,
    cursor: "pointer",
    fontWeight: 900,
    transition: "0.15s",
  });

  const th = {
    textAlign: "left",
    padding: 10,
    fontSize: 12,
    fontWeight: 950,
    color: C.primaryDark,
    borderBottom: `2px solid ${C.primary}`,
    background: C.bg,
    whiteSpace: "nowrap",
  };

  const td = {
    padding: 10,
    fontSize: 13,
    fontWeight: 800,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "top",
  };

  const card = {
    background: C.bg,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: 14,
  };

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          background: C.softBg,
          border: `1px solid ${C.primary}`,
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: C.primaryDark }}>
            File Management
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 6 }}>
            Deletion only — Firestore direct
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "records")} onClick={() => setTab("records")}>
            📄 Records
          </button>
          <button style={tabBtn(tab === "documents")} onClick={() => setTab("documents")}>
            📁 Documents
          </button>
          <button style={tabBtn(tab === "renewed")} onClick={() => setTab("renewed")}>
            ♻️ Renewed
          </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div style={card}>
        {/* SEARCH */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              outline: "none",
              fontWeight: 900,
              color: C.text,
            }}
          />
        </div>

        {/* TABLE */}
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>FSIC</th>
                <th style={th}>Owner</th>
                <th style={th}>Establishment</th>
                <th style={th}>Address</th>
                <th style={th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td style={{ ...td, textAlign: "center", color: C.muted }} colSpan={5}>
                    No data found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.fsicAppNo || "-"}</td>
                    <td style={td}>{r.ownerName || r.title || "-"}</td>
                    <td style={td}>{r.establishmentName || "-"}</td>
                    <td style={td}>{r.businessAddress || "-"}</td>
                    <td style={td}>
                      <button
                        onClick={() => deleteRow(r)}
                        style={{
                          border: `1px solid ${C.danger}`,
                          background: "#fff",
                          color: C.danger,
                          borderRadius: 10,
                          padding: "6px 10px",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
