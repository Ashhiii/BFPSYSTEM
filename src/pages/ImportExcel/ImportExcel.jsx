import React, { useMemo, useRef, useState } from "react";
import {
  HiOutlineUpload,
  HiOutlineDocumentText,
  HiOutlineCloudUpload,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

import * as XLSX from "xlsx";
import {
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc as fsDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

function UploadBox({ title, sub, onDone, variant = "records" }) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const okMsg = msg.startsWith("✅");

  const C = useMemo(() => {
    const base = {
      bg: "#ffffff",
      border: "#e5e7eb",
      text: "#0f172a",
      muted: "#64748b",
      soft: "#f8fafc",
      shadow: "0 18px 45px rgba(2,6,23,0.08)",
      red: "#b91c1c",
      redDark: "#7f1d1d",
      gold: "#f59e0b",
      blue: "#2563eb",
      green: "#16a34a",
      rose: "#e11d48",
    };

    if (variant === "documents") return { ...base, accent: base.blue, accentDark: "#1d4ed8" };
    return { ...base, accent: base.red, accentDark: base.redDark };
  }, [variant]);

  const isExcel = (f) => {
    const name = String(f?.name || "").toLowerCase();
    return name.endsWith(".xlsx") || name.endsWith(".xls");
  };

  const setPickedFile = (f) => {
    setMsg("");
    if (!f) return;

    if (!isExcel(f)) {
      setFile(null);
      setMsg("❌ Please select an Excel file (.xlsx or .xls).");
      return;
    }

    setFile(f);
    setMsg("");
  };

  const pick = (e) => {
    const f = e.target.files?.[0];
    setPickedFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    setPickedFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drag) setDrag(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
  };

  // ✅ Map excel row headers -> firestore fields
  const normalizeRow = (r) => {
    const get = (...keys) => {
      for (const k of keys) {
        const v = r?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
      return "";
    };

    return {
      fsicAppNo: get("fsicAppNo", "FSIC App No", "FSIC"),
      ownerName: get("ownerName", "Owner"),
      establishmentName: get("establishmentName", "Establishment"),
      businessAddress: get("businessAddress", "Address"),
      contactNumber: get("contactNumber", "Contact"),
      natureOfInspection: get("natureOfInspection", "Inspection"),
      dateInspected: get("dateInspected", "Date Inspected"),
      ioNumber: get("ioNumber", "IO No", "IO Number"),
      ioDate: get("ioDate", "IO Date"),
      nfsiNumber: get("nfsiNumber", "NFSI No", "NFSI Number"),
      nfsiDate: get("nfsiDate", "NFSI Date"),
      inspectors: get("inspectors", "Inspectors"),
      teamLeader: get("teamLeader", "Team Leader"),
      chiefName: get("chiefName", "Chief"),
      marshalName: get("marshalName", "Marshal"),
      occupancyType: get("occupancyType", "Occupancy"),
      buildingDesc: get("buildingDesc", "Building Desc"),
      floorArea: get("floorArea", "Floor Area"),
      buildingHeight: get("buildingHeight", "Height"),
      storeyCount: get("storeyCount", "Storey"),
      highRise: get("highRise", "High Rise"),
      fsmr: get("fsmr", "FSMR"),
      remarks: get("remarks", "Remarks"),
      orNumber: get("orNumber", "OR No"),
      orAmount: get("orAmount", "OR Amount"),
      orDate: get("orDate", "OR Date"),
    };
  };

  const upload = async () => {
    if (!file) return setMsg("❌ Choose an Excel file first.");

    setUploading(true);
    setMsg("");

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames?.[0];
      if (!sheetName) throw new Error("No sheet found in Excel.");

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!Array.isArray(rows) || rows.length === 0) {
        setMsg("❌ Empty sheet (no rows).");
        setUploading(false);
        return;
      }

      const colName = variant === "documents" ? "documents" : "records";

      let imported = 0;
      let skipped = 0;

      // ✅ batch for speed (max 500 writes per batch)
      let batch = writeBatch(db);
      let ops = 0;

      const commitIfNeeded = async () => {
        if (ops >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      };

      for (const r of rows) {
        const data = normalizeRow(r);

        // ✅ required fields
        if (!data.fsicAppNo || !data.ownerName || !data.establishmentName) {
          skipped++;
          continue;
        }

        const ref = fsDoc(collection(db, colName)); // auto id
        batch.set(ref, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          importSource: "excel",
        });

        imported++;
        ops++;
        await commitIfNeeded();
      }

      if (ops > 0) await batch.commit();

      setMsg(`✅ Imported: ${imported} row(s). Skipped: ${skipped}`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onDone?.();
    } catch (e) {
      setMsg(`❌ ${e.message || "Import failed"}`);
    } finally {
      setUploading(false);
    }
  };

  const S = {
    wrap: {
      flex: 1,
      minWidth: 320,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      background: C.bg,
      boxShadow: C.shadow,
      overflow: "hidden",
      transform: drag ? "translateY(-2px)" : "translateY(0px)",
      transition: "transform .18s ease, box-shadow .18s ease",
    },

    head: {
      padding: "14px 14px 12px",
      background:
        "linear-gradient(135deg, rgba(185,28,28,.14), rgba(245,158,11,.10), rgba(37,99,235,.06))",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid rgba(0,0,0,.08)`,
      background: "rgba(255,255,255,.75)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      fontWeight: 950,
      color: C.text,
      letterSpacing: 0.2,
      textTransform: "uppercase",
      fontSize: 12,
    },

    title: {
      fontSize: 15,
      fontWeight: 950,
      color: C.text,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    sub: { fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 4 },

    body: { padding: 14 },

    drop: {
      borderRadius: 18,
      border: drag ? `2px dashed ${C.accent}` : "2px dashed #cbd5e1",
      background: drag ? "rgba(37,99,235,.06)" : C.soft,
      padding: 16,
      display: "grid",
      gap: 12,
      transition: "border .18s ease, background .18s ease",
    },

    dropTop: { display: "flex", alignItems: "center", gap: 12 },

    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      background: `linear-gradient(180deg, ${C.accent}, ${C.accentDark})`,
      boxShadow: "0 14px 28px rgba(2,6,23,0.20)",
      color: "#fff",
      flexShrink: 0,
    },

    dropText: { display: "grid", gap: 2 },
    dropMain: { fontWeight: 950, color: C.text, fontSize: 13 },
    dropHint: { fontWeight: 800, color: C.muted, fontSize: 12 },

    actions: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: 2,
    },

    pickBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      background: "#fff",
      cursor: "pointer",
      fontWeight: 950,
      textTransform: "uppercase",
      transition: "transform .12s ease, box-shadow .12s ease",
      boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
    },

    primary: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 14,
      border: `1px solid ${C.accent}`,
      background: `linear-gradient(180deg, ${C.accent}, ${C.accentDark})`,
      color: "#fff",
      cursor: uploading || !file ? "not-allowed" : "pointer",
      fontWeight: 950,
      textTransform: "uppercase",
      opacity: uploading || !file ? 0.65 : 1,
      transition: "transform .12s ease, opacity .12s ease",
      boxShadow: `0 16px 34px rgba(2,6,23,0.18)`,
    },

    fileCard: {
      marginTop: 10,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      background: "#fff",
      padding: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    fileLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
    fileIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: C.soft,
      display: "grid",
      placeItems: "center",
      color: C.text,
      flexShrink: 0,
    },

    fileName: {
      fontWeight: 950,
      color: C.text,
      fontSize: 13,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: 260,
    },
    fileMeta: { fontWeight: 800, color: C.muted, fontSize: 12, marginTop: 2 },

    xBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: "#fff",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      transition: "transform .12s ease",
    },

    msg: (ok) => ({
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 14,
      border: ok ? "1px solid #86efac" : "1px solid #fecdd3",
      background: ok ? "#f0fdf4" : "#fff1f2",
      color: ok ? "#166534" : "#9f1239",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }),

    barWrap: {
      height: 8,
      background: "rgba(2,6,23,0.08)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 10,
    },
    bar: {
      height: "100%",
      width: uploading ? "78%" : okMsg ? "100%" : "0%",
      transition: "width .35s ease",
      background: okMsg
        ? "linear-gradient(90deg, #16a34a, #22c55e)"
        : `linear-gradient(90deg, ${C.accent}, ${C.gold})`,
    },
  };

  return (
    <div style={S.wrap} onDragOver={onDragOver} onDrop={onDrop} onDragLeave={onDragLeave}>
      <div style={S.head}>
        <div>
          <div style={S.title}>{title}</div>
          <div style={S.sub}>{sub}</div>
        </div>

        <div style={S.badge} title="Excel Import">
          <HiOutlineDocumentText size={18} />
          Excel
        </div>
      </div>

      <div style={S.body}>
        <div style={S.drop}>
          <div style={S.dropTop}>
            <div style={S.iconCircle}>
              <HiOutlineCloudUpload size={22} />
            </div>

            <div style={S.dropText}>
              <div style={S.dropMain}>Drag & drop Excel here, or choose a file</div>
              <div style={S.dropHint}>Only .xlsx / .xls accepted</div>
            </div>
          </div>

          <div style={S.actions}>
            <label style={S.pickBtn}>
              <HiOutlineDocumentText size={18} />
              Choose Excel
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={pick}
                style={{ display: "none" }}
              />
            </label>

            <button style={S.primary} onClick={upload} disabled={uploading || !file}>
              <HiOutlineUpload size={18} />
              {uploading ? "Importing..." : "Import to Firestore"}
            </button>
          </div>

          {file ? (
            <div style={S.fileCard}>
              <div style={S.fileLeft}>
                <div style={S.fileIcon}>
                  <HiOutlineDocumentText size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={S.fileName}>{file.name}</div>
                  <div style={S.fileMeta}>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>

              <button style={S.xBtn} onClick={clearFile} title="Remove selected file">
                <HiOutlineX size={18} />
              </button>
            </div>
          ) : null}

          {msg && (
            <div style={S.msg(okMsg)}>
              {okMsg ? (
                <HiOutlineCheckCircle size={18} />
              ) : (
                <HiOutlineExclamationCircle size={18} />
              )}
              <span>{msg}</span>
            </div>
          )}

          <div style={S.barWrap}>
            <div style={S.bar} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImportExcel({ setRefresh }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <UploadBox
        title="Import to Records"
        sub="Upload Excel → mo-sulod sa Records"
        variant="records"
        onDone={() => setRefresh?.((p) => !p)}
      />

      <UploadBox
        title="Import to Documents"
        sub="Upload Excel → mo-sulod sa Documents"
        variant="documents"
        onDone={() => setRefresh?.((p) => !p)}
      />
    </div>
  );
}
