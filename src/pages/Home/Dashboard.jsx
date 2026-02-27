// src/pages/Dashboard/Dashboard.jsx (FULL) — Export Choice (All vs Selected) + Recent active highlight FIXED

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import InsightCard from "./parts/InsightCard";
import QuickActions from "./parts/QuickActions";
import RecentRecords from "./parts/RecentRecords";
import ExportChoiceModal from "../../components/ExportChoiceModal"; // ✅ NEW

export default function Dashboard() {
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false); // ✅ NEW

  const [totalRecords, setTotalRecords] = useState(0);
  const [renewedCount, setRenewedCount] = useState(0);
  const [activeId, setActiveId] = useState(null); // ✅ track active record ID for RecentRecords

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // ✅ pagination for RecentRecords
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const C = useMemo(
    () => ({
      primary: "#b91c1c",
      primaryDark: "#7f1d1d",
      softBg: "#fef2f2",
      bg: "#f6f7fb",
      border: "rgba(17,24,39,0.10)",
      text: "#0f172a",
      muted: "rgba(15,23,42,0.62)",
      card: "rgba(255,255,255,0.86)",
      cardSolid: "#ffffff",
      shadow: "0 16px 42px rgba(2,6,23,0.10)",
      shadowSoft: "0 10px 26px rgba(2,6,23,0.08)",
      green: "#16a34a",
    }),
    []
  );

  /* ================= HELPERS ================= */

  const parseAnyDate = (x) => {
    if (!x) return null;
    if (typeof x === "object" && typeof x.toDate === "function") return x.toDate();
    if (typeof x === "string") {
      const d = new Date(x);
      if (!Number.isNaN(d.getTime())) return d;
    }
    if (typeof x === "number") {
      const d = new Date(x);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  };

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" });
    } catch {
      return "";
    }
  };

  const S = (v) => (v === undefined || v === null ? "" : String(v));

  const dateText = (v) => {
    const d = parseAnyDate(v);
    return d ? fmtDate(d) : S(v);
  };

  // ✅ read canonical + legacy fallback (IMPORT KEY vs OLD KEY)
  const pick = (r, canon, legacy = []) => {
    const direct = r?.[canon];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") return direct;
    for (const k of legacy) {
      const v = r?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  };

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {
    const load = async () => {
      setLoadingRecent(true);
      try {
        const recSnap = await getDocs(collection(db, "records"));
        setTotalRecords(recSnap.size);

        const renSnap = await getDocs(collection(db, "renewals"));
        setRenewedCount(renSnap.size);

        const snap = await getDocs(collection(db, "records"));

        const list = snap.docs
          .map((d) => {
            const data = d.data() || {};
            const dt =
              (data.createdAtMs ? new Date(data.createdAtMs) : null) ||
              parseAnyDate(data.createdAt) ||
              (data.updatedAtMs ? new Date(data.updatedAtMs) : null) ||
              parseAnyDate(data.updatedAt) ||
              null;

            return {
              id: d.id,
              fsicAppNo: data.fsicAppNo || "",
              establishmentName: data.establishmentName || "",
              ownerName: data.ownerName || "",
              natureOfInspection: data.natureOfInspection || "",
              _dt: dt ? dt.getTime() : 0,
              dateText: dt ? fmtDate(dt) : "-",
            };
          })
          .sort((a, b) => (b._dt || 0) - (a._dt || 0));

        setRecent(list);
        setPage(1);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoadingRecent(false);
      }
    };

    load();
  }, []);

  // ✅ slice list for current page (4 per page)
  const total = recent.length;
  const visibleRecent = useMemo(() => {
    const start = (page - 1) * pageSize;
    return recent.slice(start, start + pageSize);
  }, [recent, page]);

  /* ================= EXPORT (REUSE YOUR MAPPING) ================= */

  // ✅ Exports GIVEN LIST (so we can export all OR selected)
  const exportToExcel = async (list) => {
    if (!list?.length) {
      alert("No records to export.");
      return;
    }

    const arranged = list.map((r, idx) => {
      const typeOcc = pick(r, "typeOfOccupancy", ["occupancyType", "OCCUPANCY_TYPE"]);
      const bdesc = pick(r, "buildingDescription", ["buildingDesc", "BLDG_DESCRIPTION", "BUILDING_DESC"]);
      const floor = pick(r, "floorAreaSqm", ["floorArea", "FLOOR_AREA", "FLOOR_AREA_SQM"]);
      const storey = pick(r, "noOfStorey", ["storeyCount", "STOREY_COUNT", "NO_OF_STOREY"]);

      return {
        "NO.": idx + 1,

        // ✅ DO NOT mix fsicNo into fsicAppNo
        "FSIC APPLICATION NO.": S(r.fsicAppNo),

        "NATURE OF INSPECTION": S(r.natureOfInspection || r.NATURE_OF_INSPECTION),
        "NAME OF OWNER": S(r.ownerName || r.OWNERS_NAME || r.NAME_OF_OWNER),
        "NAME OF ESTABLISHMENT": S(r.establishmentName || r.ESTABLISHMENT_NAME || r.NAME_OF_ESTABLISHMENT),
        "BUSINESS ADDRESS": S(r.businessAddress || r.BUSSINESS_ADDRESS || r.ADDRESS),
        "CONTACT #": S(r.contactNumber || r.CONTACT_NUMBER || r.CONTACT_),
        "DATE INSPECTED": dateText(r.dateInspected || r.DATE_INSPECTED),

        "I.O NUMBER": S(r.ioNumber || r.IO_NUMBER),
        "I.O DATE": dateText(r.ioDate || r.IO_DATE),

        "NFSI NUMBER": S(r.nfsiNumber || r.NFSI_NUMBER),
        "NFSI DATE": dateText(r.nfsiDate || r.NFSI_DATE),

        "NTC NUMBER": S(r.ntcNumber || r.NTC_NUMBER),
        "NTC DATE": dateText(r.ntcDate || r.NTC_DATE),

        // ✅ separate FSIC NO column
        "FSIC NO": S(r.fsicNo || r.FSIC_NO),

        "FSIC VALIDITY": S(r.fsicValidity || r.FSIC_VALIDITY),
        DEFECTS: S(r.defects || r.DEFECTS),
        INSPECTORS: S(r.inspectors || r.INSPECTORS),

        "TYPE OF OCCUPANCY": S(typeOcc),
        "BLDG DESCRIPTION": S(bdesc),
        "FLOOR AREA (SQM)": S(floor),
        "BUILDING HEIGHT": S(r.buildingHeight || r.BUILDING_HEIGHT),
        "NO OF STOREY": S(storey),
        "HIGH RISE (YES/NO)": S(r.highRise || r.HIGH_RISE),
        "FSMR (YES/NO)": S(r.fsmr || r.FSMR),

        REMARKS: S(r.remarks || r.REMARKS),

        "O.R NUMBER": S(r.orNumber || r.OR_NUMBER),
        "O.R AMOUNT": S(r.orAmount || r.OR_AMOUNT),
        "O.R DATE": dateText(r.orDate || r.OR_DATE),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(arranged);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 }, // FSIC APP
      { wch: 22 },
      { wch: 24 },
      { wch: 28 },
      { wch: 38 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 }, // FSIC NO
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BFP Current Records");
    XLSX.writeFile(workbook, "BFP_Current_Records.xlsx");
  };

  // ✅ Export ALL (fetch full docs so complete fields are included)
  const exportAll = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      await exportToExcel(list);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  // ✅ Export SELECTED IDs (fetch full docs then filter)
  const exportSelected = async (ids) => {
    if (exporting) return;
    setExporting(true);
    try {
      const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const selected = all.filter((r) => ids.includes(String(r.id)));
      await exportToExcel(selected);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  /* ================= UI STYLES ================= */

  const pageWrap = {
    padding: 22,
    background: `radial-gradient(1200px 600px at 12% 0%, rgba(185,28,28,0.12), transparent 55%), ${C.bg}`,
    maxHeight: "100%",
    overflowY: "hidden",
  };

  const layout = {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };

  const leftCol = { display: "flex", flexDirection: "column", gap: 18 };
  const rightCol = { display: "flex", flexDirection: "column", gap: 18 };

  const responsiveCss = `
    @media (max-width: 980px){
      .dashLayout{ grid-template-columns: 1fr !important; }
      .twoCols{ grid-template-columns: 1fr !important; }
    }
  `;

  return (
    <div style={pageWrap}>
      <style>{responsiveCss}</style>

      <div style={layout} className="dashLayout">
        {/* LEFT */}
        <div style={leftCol}>
          <InsightCard C={C} totalRecords={totalRecords} renewedCount={renewedCount} />

          <QuickActions
            C={C}
            exporting={exporting}
            onAdd={() => navigate("/app/add-record")}
            onImport={() => navigate("/app/import")}
            onExport={() => setShowExport(true)} // ✅ OPEN CHOICE MODAL
            onArchive={() => navigate("/app/archive")}
          />
        </div>

        {/* RIGHT */}
        <div style={rightCol}>
          <RecentRecords
            C={C}
            loading={loadingRecent}
            list={visibleRecent}
            activeId={activeId} // ✅ FIXED (was setActiveId)
            onOpen={(id) => {
              setActiveId(id); // ✅ highlight clicked
              navigate("/app/records", { state: { activeId: id } });
            }}
            page={page}
            setPage={setPage}
            total={total}
            pageSize={pageSize}
          />
        </div>
      </div>

      {/* ✅ Export choice modal (All vs Select) */}
      <ExportChoiceModal
        open={showExport}
        onClose={() => !exporting && setShowExport(false)}
        onExportAll={exportAll}
        onExportSelected={exportSelected}
        rows={recent} // ✅ list shown in selector (fast). Change to full list if you want.
        busy={exporting}
        C={C}
      />
    </div>
  );
}