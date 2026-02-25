// src/pages/ImportExcel/ImportExcel.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import * as XLSX from "xlsx";
import {
  collection,
  writeBatch,
  serverTimestamp,
  doc as fsDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function ImportExcelFullScreen({ setRefresh, onClose }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const ok = msg.startsWith("✅");

  // ✅ YOUR COLOR CODING
  const C = useMemo(
    () => ({
      primary: "#b91c1c",
      primaryDark: "#7f1d1d",
      softBg: "#fef2f2",
      border: "#e5e7eb",
      text: "#111827",
      muted: "#6b7280",
      ownerBg: "#fff7ed",
      ownerBorder: "#fb923c",
      bfpBg: "#fef2f2",
      dashed: "#d1d5db",
      shadow: "0 10px 25px rgba(0,0,0,.06)",
    }),
    []
  );

  const S = useMemo(
    () => ({
      page: {
        width: "100%",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        overflow: "hidden",
      },

      body: {
        flex: 1,
        padding: 18,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        minHeight: 0,
        background:
          "radial-gradient(circle at 15% 10%, rgba(185,28,28,.06), transparent 35%), radial-gradient(circle at 85% 30%, rgba(251,146,60,.10), transparent 40%), #fff",
      },

      wrap: {
        width: "min(1500px, 96vw)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 0,
      },

      drop: {
        width: "100%",
        height: "calc(100vh - 70px - 36px)",
        minHeight: 360,
        maxHeight: 550,
        borderRadius: 18,
        border: `2px dashed ${drag ? C.primary : C.dashed}`,
        background: drag ? C.softBg : "#fff",
        boxShadow: C.shadow,
        display: "grid",
        placeItems: "center",
        padding: 0,
        cursor: "pointer",
        transition: "0.15s",
        overflow: "hidden",
      },

      hero: {
        textAlign: "center",
        display: "grid",
        gap: 8,
        placeItems: "center",
        maxWidth: 620,
      },

      art: {
        width: 240,
        height: 132,
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        background:
          "radial-gradient(circle at 30% 30%, rgba(185,28,28,.18), transparent 55%), radial-gradient(circle at 70% 50%, rgba(251,146,60,.18), transparent 60%), #f8fafc",
        display: "grid",
        placeItems: "center",
        marginBottom: 10,
      },

      folders: { display: "flex", gap: 12 },
      folder: (bg, borderColor, textColor) => ({
        width: 58,
        height: 46,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: bg,
        display: "grid",
        placeItems: "center",
        fontWeight: 950,
        fontSize: 12,
        color: textColor,
        boxShadow: "0 10px 18px rgba(2,6,23,0.08)",
      }),

      main: { fontSize: 16, fontWeight: 950, color: C.text },
      link: { color: C.primary, cursor: "pointer", textDecoration: "underline" },
      sub: { fontSize: 12, fontWeight: 800, color: C.muted },

      hint: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: 900,
        color: C.muted,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      },

      fileCard: {
        marginTop: 12,
        width: "min(720px, 100%)",
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "#fff",
        boxShadow: "0 12px 24px rgba(0,0,0,.05)",
      },

      fileLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
      fIcon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        background: C.bfpBg,
        display: "grid",
        placeItems: "center",
        color: C.primaryDark,
      },

      fName: {
        fontWeight: 950,
        fontSize: 13,
        color: C.text,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 520,
      },
      fMeta: { marginTop: 3, fontWeight: 800, color: C.muted, fontSize: 12 },

      remove: {
        padding: "8px 10px",
        borderRadius: 12,
        border: `1px solid ${C.ownerBorder}`,
        background: C.ownerBg,
        cursor: "pointer",
        fontWeight: 950,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        color: "#9a3412",
      },

      msg: {
        marginTop: 12,
        width: "min(720px, 100%)",
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${ok ? "#86efac" : "#fecdd3"}`,
        background: ok ? "#f0fdf4" : "#fff1f2",
        color: ok ? "#166534" : "#9f1239",
        fontWeight: 950,
        display: "flex",
        gap: 8,
        alignItems: "center",
      },

      barWrap: {
        marginTop: 10,
        width: "min(720px, 100%)",
        height: 8,
        borderRadius: 999,
        background: "#e5e7eb",
        overflow: "hidden",
      },
      bar: {
        height: "100%",
        width: uploading ? "72%" : ok ? "100%" : "0%",
        transition: "0.35s",
        background: ok
          ? "linear-gradient(90deg,#16a34a,#22c55e)"
          : `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
      },

      footer: {
        height: 80,
        flexShrink: 0,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        gap: 12,
        background: "#fff",
      },

      fInfo: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: C.muted,
        fontWeight: 800,
        fontSize: 12,
      },

      actions: { display: "flex", gap: 10, alignItems: "center" },

      btn: {
        padding: "10px 16px",
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        background: "#fff",
        cursor: "pointer",
        fontWeight: 950,
        minWidth: 110,
      },

      primary: {
        padding: "10px 16px",
        borderRadius: 12,
        border: `1px solid ${C.primary}`,
        background: `linear-gradient(180deg, ${C.primary}, ${C.primaryDark})`,
        color: "#fff",
        cursor: uploading || !file ? "not-allowed" : "pointer",
        opacity: uploading || !file ? 0.65 : 1,
        fontWeight: 980,
        minWidth: 110,
        boxShadow: "0 12px 24px rgba(185,28,28,0.18)",
      },
    }),
    [C, drag, uploading, file, ok]
  );

  const isExcel = (f) => {
    const n = String(f?.name || "").toLowerCase();
    return n.endsWith(".xlsx") || n.endsWith(".xls");
  };

  const pick = (f) => {
    setMsg("");
    if (!f) return;
    if (!isExcel(f)) {
      setFile(null);
      setMsg("❌ Please select an Excel file (.xlsx or .xls).");
      return;
    }
    setFile(f);
  };

  const clear = () => {
    setFile(null);
    setMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ================== ROBUST EXCEL HELPERS ================== */

  const normKey = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[_-]/g, "")
      .replace(/\./g, "");

  const excelDateToISO = (v) => {
    if (v == null || v === "") return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") {
      const dt = new Date(Math.round((v - 25569) * 86400 * 1000));
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    return String(v).trim();
  };

  const normalizeRow = (r) => {
    const headerMap = {};
    for (const k of Object.keys(r || {})) headerMap[normKey(k)] = r[k];

    const get = (...variants) => {
      for (const v of variants) {
        const val = headerMap[normKey(v)];
        if (val !== undefined && val !== null && String(val).trim() !== "")
          return String(val).trim();
      }
      return "";
    };

    return {
      fsicAppNo: get(
        "fsicappno",
        "fsicapp#",
        "fsicno",
        "fsicnumber",
        "fsic",
        "fsic app no",
        "fsic app no."
      ),
      ownerName: get("ownername", "owner", "ownersname", "taxpayer"),
      establishmentName: get(
        "establishmentname",
        "establishment",
        "tradename",
        "nameofestablishment"
      ),
      businessAddress: get("businessaddress", "address", "business address", "bussinessaddress"),
      contactNumber: get("contactnumber", "contact", "mobile", "contact no", "contact #"),
      natureOfInspection: get("natureofinspection", "inspection", "nature"),
      dateInspected: excelDateToISO(get("dateinspected", "date inspected", "date")),

      ioNumber: get("ionumber", "io no", "io#", "io"),
      ioDate: excelDateToISO(get("iodate", "io date")),

      nfsiNumber: get("nfsinumber", "nfsi no", "nfsi#", "nfsi"),
      nfsiDate: excelDateToISO(get("nfsidate", "nfsi date")),

      inspectors: get("inspectors", "inspector"),
      teamLeader: get("teamleader", "team leader"),

      chiefName: get("chiefname", "chief"),
      marshalName: get("marshalname", "marshal"),

      remarks: get("remarks", "remark"),

      orNumber: get("ornumber", "or no", "or#"),
      orAmount: get("oramount", "or amount"),
      orDate: excelDateToISO(get("ordate", "or date")),
    };
  };

  const looksLikeTrashRow = (data) => {
    const joined = [
      data.fsicAppNo,
      data.ownerName,
      data.establishmentName,
      data.businessAddress,
      data.remarks,
    ]
      .join(" ")
      .toLowerCase();

    return (
      joined.includes("exit") ||
      joined.includes("end") ||
      joined.includes("prepared by") ||
      joined.includes("signature") ||
      joined.includes("noted by") ||
      joined.includes("total") ||
      joined.includes("grand total") ||
      joined.includes("summary")
    );
  };

  const isValidFsic = (v) => {
    const s = String(v || "").trim();
    // adjust if needed (example: 2026-00123)
    return /^\d{4}-\d{3,}$/i.test(s) || s.length >= 4;
  };

  /* ================== UPLOAD ================== */

  const uploadExcel = async () => {
    if (!file) return setMsg("❌ Choose an Excel file first.");
    setUploading(true);
    setMsg("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const name = wb.SheetNames?.[0];
      if (!name) throw new Error("No sheet found in Excel.");

      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
      if (!rows.length) throw new Error("Empty sheet (no rows).");

      let imported = 0,
        skipped = 0;
      let batch = writeBatch(db),
        ops = 0;

      const commitIfNeeded = async () => {
        if (ops >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      };

      for (const r of rows) {
        const data = normalizeRow(r);

        // skip totally empty row
        const anyValue = Object.values(data).some(
          (x) => String(x ?? "").trim() !== ""
        );
        if (!anyValue) {
          skipped++;
          continue;
        }

        // skip footer/trash rows like EXIT/END/etc
        if (looksLikeTrashRow(data)) {
          skipped++;
          continue;
        }

        // required fields
        if (!data.fsicAppNo || !data.ownerName || !data.establishmentName) {
          skipped++;
          continue;
        }

        // optional FSIC validation
        if (!isValidFsic(data.fsicAppNo)) {
          skipped++;
          continue;
        }

        const ref = fsDoc(collection(db, "records"));
        batch.set(ref, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          importSource: "excel",
          sheetName: name,
        });

        imported++;
        ops++;
        await commitIfNeeded();
      }

      if (ops) await batch.commit();

      setMsg(`✅ Imported: ${imported} row(s). Skipped: ${skipped}.`);
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error(e);
      setMsg(`❌ ${e?.message || "Import failed"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.body}>
        <div style={S.wrap}>
          <div
            style={S.drop}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDrag(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer?.files?.[0]);
            }}
          >
            <div style={S.hero}>
              <div style={S.art}>
                <div style={S.folders}>
                  <div style={S.folder(C.bfpBg, C.primary, C.primaryDark)}>
                    FILE
                  </div>
                  <div style={S.folder(C.ownerBg, C.ownerBorder, "#9a3412")}>
                    XLSX
                  </div>
                </div>
              </div>

              <div style={S.main}>
                Drag & Drop or{" "}
                <span
                  style={S.link}
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Select
                </span>{" "}
                files to upload
              </div>

              <div style={S.sub}>Supported formats: .xlsx, .xls (Excel)</div>

              <div style={S.hint}>
                <HiOutlineCloudUpload size={18} /> Import will go to Firestore:{" "}
                <b>records</b>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => pick(e.target.files?.[0])}
                style={{ display: "none" }}
              />

              {file ? (
                <>
                  <div style={S.fileCard}>
                    <div style={S.fileLeft}>
                      <div style={S.fIcon}>
                        <HiOutlineDocumentText size={22} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.fName}>{file.name}</div>
                        <div style={S.fMeta}>
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB •
                          Ready
                        </div>
                      </div>
                    </div>

                    <button
                      style={S.remove}
                      onClick={(e) => {
                        e.stopPropagation();
                        clear();
                      }}
                      disabled={uploading}
                    >
                      <HiOutlineTrash size={18} /> Remove
                    </button>
                  </div>

                  {msg ? (
                    <div style={S.msg}>
                      {ok ? (
                        <HiOutlineCheckCircle size={18} />
                      ) : (
                        <HiOutlineExclamationCircle size={18} />
                      )}
                      <span>{msg}</span>
                    </div>
                  ) : null}

                  <div style={S.barWrap}>
                    <div style={S.bar} />
                  </div>
                </>
              ) : msg ? (
                <div style={S.msg}>
                  <HiOutlineExclamationCircle size={18} />
                  <span>{msg}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <div style={S.fInfo}>
          <HiOutlineInformationCircle size={18} />
          Duplicate detection depends on your Excel content (FSIC/AppNo).
        </div>

        <div style={S.actions}>
          <button
            style={S.btn}
            onClick={() => {
              clear();
              onClose?.();
            }}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            style={S.primary}
            onClick={uploadExcel}
            disabled={uploading || !file}
          >
            {uploading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}