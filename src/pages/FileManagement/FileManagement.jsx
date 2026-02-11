import React, { useEffect, useMemo, useState } from "react";

export default function FileManagement({ refresh, setRefresh }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [tab, setTab] = useState("records");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  // Archive
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  /* 🔥 BFP COLOR PALETTE */
  const C = {
    primary: "#b91c1c", // Fire Red
    primaryDark: "#7f1d1d",
    accent: "#f59e0b", // Gold
    bg: "#ffffff",
    softBg: "#fef2f2",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    danger: "#dc2626",
  };

  // tab -> backend scope
  const scopeByTab = {
    records: "current",
    documents: "documents",
    renewed: "renewed",
    archive: "archive",
  };
  const scope = scopeByTab[tab] || "current";

  const normalizeItems = (items) =>
    (items || []).map((x) => {
      const d = x?.data && typeof x.data === "object" ? x.data : {};
      return { ...x, ...d };
    });

  const loadMonths = async () => {
    try {
      const res = await fetch(`${API}/archive/months`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.months || [];
      setMonths(list);

      if (!selectedMonth && list.length) setSelectedMonth(list[0]);
    } catch (e) {
      console.error(e);
      setMonths([]);
    }
  };

  const load = async () => {
    try {
      // If archive tab but no month chosen yet
      if (tab === "archive" && !selectedMonth) {
        setRows([]);
        return;
      }

      const url = `${API}/manager/items?scope=${encodeURIComponent(
        scope
      )}&month=${encodeURIComponent(tab === "archive" ? selectedMonth : "")}`;

      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];
        setRows(normalizeItems(items));
        return;
      }

      // Fallback: old archive endpoint style (optional)
      if (tab === "archive") {
        const res2 = await fetch(
          `${API}/archive/${encodeURIComponent(selectedMonth)}`
        );
        if (res2.ok) {
          const data2 = await res2.json();
          const items2 = Array.isArray(data2) ? data2 : data2?.items || [];
          setRows(normalizeItems(items2));
          return;
        }
      }

      setRows([]);
    } catch (e) {
      console.error(e);
      setRows([]);
    }
  };

  // load months only when switching to archive tab
  useEffect(() => {
    if (tab === "archive") loadMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // reload whenever scope/tab/refresh/month changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, refresh, selectedMonth]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter((r) => {
      return (
        (r.fsicAppNo || "").toLowerCase().includes(q) ||
        (r.ownerName || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        (r.businessAddress || "").toLowerCase().includes(q) ||
        (r.entityKey || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const deleteRow = async (r) => {
    if (!window.confirm("Delete this item?")) return;

    let url = "";
    if (scope === "current") url = `${API}/records/${r.id}`;
    else if (scope === "documents") url = `${API}/documents/${r.id}`;
    else if (scope === "renewed") url = `${API}/records/renewed/${r.id}`;
    else if (scope === "archive") {
      url = `${API}/archive/${encodeURIComponent(selectedMonth)}/${r.id}`;
    }

    if (!url) return alert("No delete route for this scope.");

    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        return alert(data?.message || "Delete failed");
      }

      setRefresh((p) => !p);
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  /* ===================== STYLES ===================== */

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
      {/* HEADER + TABS */}
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
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.muted,
              marginTop: 6,
            }}
          >
            Deletion only — choose what you want to manage.
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: C.muted,
              marginTop: 6,
            }}
          >
            Scope:{" "}
            <span style={{ color: C.primaryDark }}>
              {tab === "records"
                ? "Records"
                : tab === "documents"
                ? "Documents"
                : tab === "renewed"
                ? "Renewed"
                : "Archive"}
            </span>
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
          <button style={tabBtn(tab === "archive")} onClick={() => setTab("archive")}>
            🗃️ Archive
          </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div style={card}>
        {/* SEARCH + MONTH PICKER */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Search FSIC / Owner / Establishment / Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 240,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              outline: "none",
              fontWeight: 900,
              color: C.text,
            }}
          />

          {tab === "archive" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                fontWeight: 950,
                minWidth: 220,
                color: C.text,
              }}
            >
              {months.length === 0 ? (
                <option value="">No months</option>
              ) : (
                months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              )}
            </select>
          )}
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
                    {tab === "archive" && !selectedMonth
                      ? "Select a month to view archive."
                      : "No data found."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${scope}-${tab === "archive" ? selectedMonth : "x"}-${r.id}`}>
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
