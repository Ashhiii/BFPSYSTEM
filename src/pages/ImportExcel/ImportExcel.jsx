import React, { useState } from "react";
import { HiOutlineUpload, HiOutlineDocumentText } from "react-icons/hi";

export default function ImportExcel({ setRefresh }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const pick = (e) => {
    setMsg("");
    const f = e.target.files?.[0];
    if (!f) return;

    const ok =
      f.name.toLowerCase().endsWith(".xlsx") ||
      f.name.toLowerCase().endsWith(".xls");

    if (!ok) {
      setFile(null);
      setMsg("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    setFile(f);
  };

  const upload = async () => {
    if (!file) return setMsg("Choose an Excel file first.");
    setUploading(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API}/import/excel`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Import failed.");
      }

      setMsg(`✅ Imported: ${data.imported || 0} record(s).`);
      setFile(null);
      setRefresh?.((p) => !p);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const S = {
    wrap: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    },
    title: { fontSize: 18, fontWeight: 950, color: "#0f172a", textTransform: "uppercase" },
    sub: { fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 6, textTransform: "uppercase" },

    card: {
      marginTop: 14,
      border: "1px dashed #cbd5e1",
      borderRadius: 16,
      padding: 18,
      background: "#f8fafc",
      display: "grid",
      gap: 12,
    },

    row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },

    pickBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 950,
      textTransform: "uppercase",
    },

    primary: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 950,
      textTransform: "uppercase",
      opacity: uploading ? 0.7 : 1,
    },

    fileName: { fontWeight: 900, color: "#111827" },
    hint: { fontSize: 12, fontWeight: 700, color: "#64748b" },

    msg: (ok) => ({
      padding: "10px 12px",
      borderRadius: 12,
      border: ok ? "1px solid #86efac" : "1px solid #fecdd3",
      background: ok ? "#f0fdf4" : "#fff1f2",
      color: ok ? "#166534" : "#9f1239",
      fontWeight: 900,
      textTransform: "none",
    }),
  };

  const okMsg = msg.startsWith("✅");

  return (
    <div style={S.wrap}>
      <div>
        <div style={S.title}>Import Excel</div>
        <div style={S.sub}>Upload .xlsx/.xls to add records in bulk.</div>
      </div>

      <div style={S.card}>
        <div style={S.row}>
          <label style={S.pickBtn}>
            <HiOutlineDocumentText size={18} />
            Choose Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={pick}
              style={{ display: "none" }}
            />
          </label>

          <button style={S.primary} onClick={upload} disabled={uploading || !file}>
            <HiOutlineUpload size={18} />
            {uploading ? "Uploading..." : "Upload & Import"}
          </button>
        </div>

        <div style={S.hint}>
          {file ? (
            <>
              Selected: <span style={S.fileName}>{file.name}</span>
            </>
          ) : (
            "Tip: Make sure your Excel columns match your record fields (FSIC App No, Owner, etc.)."
          )}
        </div>

        {msg && <div style={S.msg(okMsg)}>{msg}</div>}
      </div>
    </div>
  );
}
