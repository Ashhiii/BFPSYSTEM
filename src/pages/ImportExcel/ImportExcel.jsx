// src/pages/ImportExcel/ImportExcel.jsx  ✅ FULL FIXED (header detection + date year + strict mapping + FSIC fallback)
//
// Fixes:
// ✅ Strong header row detection (avoids title rows -> wrong assignment)
// ✅ Date parser: only converts REAL excel serial dates + supports YYYYMMDD + string formats
// ✅ “Awaton” gyud ang cell values; if empty in file -> empty in Firestore
// ✅ NEW: if FSIC APPLICATION NO is empty, fallback to IO Number / App No so rows won’t all be skipped
// ✅ Still same UI/design

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

  // ✅ COLOR CODING
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

  /* ================== NORMALIZERS (AWATON gyud) ================== */

  const normKey = (s) =>
    String(s ?? "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");

  const toText = (v) => (v == null ? "" : String(v).trim());

  // ✅ DATE: strict conversion (prevents wrong year)
  const excelDateToISO = (v) => {
    if (v == null || v === "") return "";

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

      const m1 = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
      if (m1) {
        let a = Number(m1[1]);
        let b = Number(m1[2]);
        let y = Number(m1[3]);
        if (y < 100) y = 2000 + y;

        let month = a,
          day = b;
        if (a > 12) {
          day = a;
          month = b;
        }

        return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }

      const t = Date.parse(s);
      if (Number.isFinite(t)) {
        const dt = new Date(t);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }

      return s;
    }

    if (v instanceof Date && !isNaN(v.getTime())) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, "0");
      const d = String(v.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    if (typeof v === "number" && Number.isFinite(v)) {
      // YYYYMMDD
      if (v >= 19000101 && v <= 21001231) {
        const s = String(Math.trunc(v));
        const y = s.slice(0, 4);
        const m = s.slice(4, 6);
        const d = s.slice(6, 8);
        if (
          Number(m) >= 1 &&
          Number(m) <= 12 &&
          Number(d) >= 1 &&
          Number(d) <= 31
        ) {
          return `${y}-${m}-${d}`;
        }
      }

      // Excel serial
      if (v >= 20000 && v <= 60000) {
        const d = XLSX.SSF?.parse_date_code?.(v);
        if (d && d.y && d.m && d.d) {
          return `${String(d.y).padStart(4, "0")}-${String(d.m).padStart(
            2,
            "0"
          )}-${String(d.d).padStart(2, "0")}`;
        }
      }

      return String(v);
    }

    return String(v);
  };

  /* ================== HEADER DETECTION ================== */

  const findHeaderRowIndex = (aoa, maxScan = 35) => {
    const limit = Math.min(maxScan, aoa.length);

    for (let i = 0; i < limit; i++) {
      const row = (aoa[i] || []).map((c) => String(c ?? "").trim());
      const normalized = row.map(normKey);

      const nonEmptyCount = normalized.filter(Boolean).length;

      const hasFsic = normalized.some((x) => x.includes("fsic"));
      const hasOwner = normalized.some(
        (x) => x.includes("owner") || x.includes("taxpayer")
      );
      const hasEstab = normalized.some(
        (x) => x.includes("establishment") || x.includes("tradename")
      );
      const hasAddress = normalized.some((x) => x.includes("address"));

      const looksHeader =
        hasFsic && nonEmptyCount >= 4 && (hasOwner || hasEstab || hasAddress);
      if (looksHeader) return i;
    }

    return -1;
  };

  const mapRow = (headers, row) => {
    const o = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      const nk = normKey(key);
      if (!nk) continue;
      o[key] = row?.[c] ?? "";
    }
    return o;
  };

  const aoaToObjects = (aoa) => {
    const headerIdx = findHeaderRowIndex(aoa);
    if (headerIdx === -1) {
      const [h = [], ...rest] = aoa;
      return {
        headerIdx: 0,
        headers: h,
        objects: rest.map((r) => mapRow(h, r)),
      };
    }
    const headers = aoa[headerIdx] || [];
    const dataRows = aoa.slice(headerIdx + 1);
    return {
      headerIdx,
      headers,
      objects: dataRows.map((r) => mapRow(headers, r)),
    };
  };

  /* ================== STRICT normalizeRow ================== */

  const normalizeRow = (r) => {
    const headerMap = {};
    for (const k of Object.keys(r || {})) headerMap[normKey(k)] = r[k];

    const get = (...variants) => {
      for (const v of variants) {
        const key = normKey(v);
        const val = headerMap[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return val; // raw
        }
      }
      return "";
    };

    const getByIncludes = (must1, must2) => {
      const a = normKey(must1);
      const b = normKey(must2);
      const keys = Object.keys(headerMap);
      for (const k of keys) {
        const nk = normKey(k);
        if (nk.includes(a) && nk.includes(b)) {
          const val = headerMap[k];
          if (val !== undefined && val !== null && String(val).trim() !== "")
            return val;
        }
      }
      return "";
    };

    const fsicRaw =
      get(
        "fsicappno",
        "fsicapp#",
        "fsicno",
        "fsicnumber",
        "fsic",
        "fsic app no",
        "fsic application no",
        "fsic_application_no",
        "fsic_app_no",
        "fsic_number"
      ) ||
      getByIncludes("fsic", "app") ||
      getByIncludes("fsic", "no");

    const ownerRaw =
      get(
        "ownername",
        "ownersname",
        "owner",
        "taxpayer",
        "nameoftaxpayer",
        "nameoftheowner",
        "owners name",
        "owner's name",
        "name of owner"
      ) || "";

    const estabRaw =
      get(
        "establishmentname",
        "nameofestablishment",
        "establishment",
        "tradename",
        "trade name",
        "businessname",
        "name of establishment",
        "establishment_name"
      ) || "";

    const addrRaw =
      get(
        "businessaddress",
        "business address",
        "bussinessaddress",
        "address",
        "completeaddress",
        "addresscomplete",
        "location",
        "business_address",
        "bussiness_address"
      ) || "";

    const dateInspectedRaw = get(
      "dateinspected",
      "date inspected",
      "date",
      "date_inspected"
    );
    const ioDateRaw = get("iodate", "io date", "io_date");
    const nfsiDateRaw = get("nfsidate", "nfsi date", "nfsi_date");
    const ntcDateRaw = get("ntcdate", "ntc date", "ntc_date");
    const orDateRaw = get("ordate", "or date", "or_date");
    const fsicValidityRaw = get(
      "fsicvalidity",
      "validity",
      "fsic validity",
      "fsic_validity"
    );

    return {
      fsicAppNo: toText(fsicRaw),
      ownerName: toText(ownerRaw),
      establishmentName: toText(estabRaw),
      businessAddress: toText(addrRaw),

      appno: toText(get("appno", "applicationno", "application#", "application number")),
      contactNumber: toText(get("contactnumber", "contact", "mobile", "contact no", "contact #")),
      natureOfInspection: toText(get("natureofinspection", "inspection", "nature")),
      dateInspected: excelDateToISO(dateInspectedRaw),

      ioNumber: toText(get("ionumber", "io no", "io#", "io", "io_number")),
      ioDate: excelDateToISO(ioDateRaw),

      nfsiNumber: toText(get("nfsinumber", "nfsi no", "nfsi#", "nfsi", "nfsi_number")),
      nfsiDate: excelDateToISO(nfsiDateRaw),

      ntcNumber: toText(get("ntcnumber", "ntc no", "ntc#", "ntc", "ntc_number")),
      ntcDate: excelDateToISO(ntcDateRaw),

      fsicValidity: excelDateToISO(fsicValidityRaw),
      defects: toText(get("defects", "violations", "defect")),
      remarks: toText(get("remarks", "remark")),

      orNumber: toText(get("ornumber", "or no", "or#", "or_number")),
      orAmount: toText(get("oramount", "or amount", "or_amount")),
      orDate: excelDateToISO(orDateRaw),

      inspectors: toText(get("inspectors", "inspector", "inspectorscombined", "inspector(s)")),
      teamLeader: toText(get("teamleader", "team leader", "team_leader")),
      teamLeaderSerial: toText(get("teamleaderserial", "team leader serial", "team_leader_serial")),

      inspector1: toText(get("inspector1", "inspector 1", "inspector_1")),
      inspector1Serial: toText(get("inspector1serial", "inspector 1 serial", "inspector_1_serial")),

      inspector2: toText(get("inspector2", "inspector 2", "inspector_2")),
      inspector2Serial: toText(get("inspector2serial", "inspector 2 serial", "inspector_2_serial")),

      inspector3: toText(get("inspector3", "inspector 3", "inspector_3")),
      inspector3Serial: toText(get("inspector3serial", "inspector 3 serial", "inspector_3_serial")),

      chiefName: toText(get("chiefname", "chief")),
      marshalName: toText(get("marshalname", "marshal")),
    };
  };

  // ✅ safer trash checker (no "mendoza" -> "end" false positive)
  const looksLikeTrashRow = (data) => {
    const txt = [data.remarks, data.ownerName, data.establishmentName]
      .join(" ")
      .toLowerCase();

    const badPhrases = ["prepared by", "signature", "noted by", "grand total", "summary"];
    if (badPhrases.some((p) => txt.includes(p))) return true;

    const remarks = String(data.remarks || "").toLowerCase();
    if (/\b(exit|end)\b/.test(remarks)) return true;

    return false;
  };

  // ✅ allow short ids (IO/appno) but still reject empty
  const isValidId = (v) => String(v || "").trim().length >= 2;

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

      const ws = wb.Sheets[name];

      const aoa = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!aoa.length) throw new Error("Empty sheet (no rows).");

      const { headerIdx, headers, objects } = aoaToObjects(aoa);

      if (!objects.length) {
        throw new Error(`No data rows found after header row (line ${headerIdx + 1}).`);
      }

      console.log("HEADER ROW LINE:", headerIdx + 1);
      console.log("HEADERS:", headers);
      console.log("SAMPLE RAW OBJ:", objects[0]);
      console.log("SAMPLE NORMALIZED:", normalizeRow(objects[0]));

      let imported = 0,
        skipped = 0;

      let reasonNoId = 0,
        reasonTrash = 0,
        reasonEmpty = 0;

      let batch = writeBatch(db),
        ops = 0;

      const commitIfNeeded = async () => {
        if (ops >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      };

      for (const r of objects) {
        const data = normalizeRow(r);

        // skip totally empty row
        const anyValue = Object.values(data).some(
          (x) => String(x ?? "").trim() !== ""
        );
        if (!anyValue) {
          skipped++;
          reasonEmpty++;
          continue;
        }

        // skip footer rows
        if (looksLikeTrashRow(data)) {
          skipped++;
          reasonTrash++;
          continue;
        }

        // ✅ NEW: FSIC fallback if blank (PER DAY INSPECTION LOGBOOK usually has no FSIC)
        if (!data.fsicAppNo || !isValidId(data.fsicAppNo)) {
          const fallback = data.ioNumber || data.appno;
          if (fallback && isValidId(fallback)) {
            data.fsicAppNo = String(fallback).trim();
            data.importIdSource = data.ioNumber ? "ioNumber" : "appno";
          } else {
            data.importIdSource = "missing";
          }
        } else {
          data.importIdSource = "fsicAppNo";
        }

        // ✅ require at least one identifier (FSIC or fallback)
        if (!data.fsicAppNo || !isValidId(data.fsicAppNo)) {
          skipped++;
          reasonNoId++;
          continue;
        }

        const ref = fsDoc(collection(db, "records"));
        batch.set(ref, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          importSource: "excel",
          sheetName: name,
          headerRowLine: headerIdx + 1,
        });

        imported++;
        ops++;
        await commitIfNeeded();
      }

      if (ops) await batch.commit();

      setMsg(
        `✅ Imported: ${imported} row(s). Skipped: ${skipped}. (No ID: ${reasonNoId}, Trash: ${reasonTrash}, Empty: ${reasonEmpty})`
      );
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
                  <div style={S.folder(C.bfpBg, C.primary, C.primaryDark)}>FILE</div>
                  <div style={S.folder(C.ownerBg, C.ownerBorder, "#9a3412")}>XLSX</div>
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
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
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
          Import is strict: it reads only what exists in Excel cells. Empty cells
          stay empty. (If FSIC is blank, it falls back to IO/App No.)
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