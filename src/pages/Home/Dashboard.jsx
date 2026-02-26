import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import InsightCard from "./parts/InsightCard";
import QuickActions from "./parts/QuickActions";
import RecentRecords from "./parts/RecentRecords";
import ExportConfirmModal from "./parts/ExportConfirmModal";

export default function Dashboard() {
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);
  const [renewedCount, setRenewedCount] = useState(0);

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
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // ✅ string safe
  const S = (v) => (v === undefined || v === null ? "" : String(v));

  // ✅ date text safe (supports Firestore Timestamp / string)
  const dateText = (v) => {
    const d = parseAnyDate(v);
    return d ? fmtDate(d) : S(v);
  };

  useEffect(() => {
    const load = async () => {
      setLoadingRecent(true);
      try {
        const recSnap = await getDocs(collection(db, "records"));
        setTotalRecords(recSnap.size);

        const renSnap = await getDocs(collection(db, "renewals"));
        setRenewedCount(renSnap.size);

        // ✅ RECENT: fetch all then sort by createdAt/updatedAt
        const snap = await getDocs(collection(db, "records"));

        const list = snap.docs
          .map((d) => {
            const data = d.data() || {};
            const dt = parseAnyDate(data.createdAt) || parseAnyDate(data.updatedAt) || null;
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
        setPage(1); // ✅ reset to page 1 every reload
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

  // ✅ ✅ EXPORT FIXED ORDER (NO. first, O.R DATE last)
  const exportCurrentExcel = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (!list.length) {
        alert("No current records to export.");
        return;
      }

      // ✅ IMPORTANT: Object key order = Excel column order
      const arranged = list.map((r, idx) => ({
        "NO.": idx + 1,
        "FSIC APPLICATION NO.": S(r.fsicAppNo || r.FSIC_APP_NO || r.FSIC_NUMBER),
        "NATURE OF INSPECTION": S(r.natureOfInspection || r.NATURE_OF_INSPECTION),
        "NAME OF OWNER": S(r.ownerName || r.OWNERS_NAME || r.NAME_OF_OWNER),
        "NAME OF ESTABLISHMENT": S(
          r.establishmentName || r.ESTABLISHMENT_NAME || r.NAME_OF_ESTABLISHMENT
        ),
        "BUSINESS ADDRESS": S(r.businessAddress || r.BUSSINESS_ADDRESS || r.ADDRESS),
        "CONTACT #": S(r.contactNumber || r.CONTACT_NUMBER || r.CONTACT_),
        "DATE INSPECTED": dateText(r.dateInspected || r.DATE_INSPECTED),

        "I.O NUMBER": S(r.ioNumber || r.IO_NUMBER),
        "I.O DATE": dateText(r.ioDate || r.IO_DATE),

        "NFSI NUMBER": S(r.nfsiNumber || r.NFSI_NUMBER),
        "NFSI DATE": dateText(r.nfsiDate || r.NFSI_DATE),

        "FSIC VALIDITY": S(r.fsicValidity || r.FSIC_VALIDITY),
        DEFECTS: S(r.defects || r.DEFECTS),
        INSPECTORS: S(r.inspectors || r.INSPECTORS),

        "TYPE OF OCCUPANCY": S(r.occupancyType || r.OCCUPANCY_TYPE),
        "BLDG DESCRIPTION / RETAILER": S(r.buildingDesc || r.BLDG_DESCRIPTION || r.BUILDING_DESC),
        "FLOOR AREA (SQM)": S(r.floorArea || r.FLOOR_AREA),
        "BUILDING HEIGHT": S(r.buildingHeight || r.BUILDING_HEIGHT),
        "NO OF STOREY": S(r.storeyCount || r.STOREY_COUNT),
        "HIGH RISE (YES/NO)": S(r.highRise || r.HIGH_RISE),
        "FSMR (YES/NO)": S(r.fsmr || r.FSMR),
        REMARKS: S(r.remarks || r.REMARKS),

        "O.R NUMBER": S(r.orNumber || r.OR_NUMBER),
        "O.R AMOUNT": S(r.orAmount || r.OR_AMOUNT),

        // ✅ LAST COLUMN (imong giingon)
        "O.R DATE": dateText(r.orDate || r.OR_DATE),
      }));

      const worksheet = XLSX.utils.json_to_sheet(arranged);

      // ✅ optional column widths (para di mag-sikip)
      worksheet["!cols"] = [
        { wch: 6 },  // NO.
        { wch: 20 }, // FSIC
        { wch: 22 }, // NATURE
        { wch: 24 }, // OWNER
        { wch: 28 }, // ESTABLISHMENT
        { wch: 38 }, // ADDRESS
        { wch: 18 }, // CONTACT
        { wch: 18 }, // DATE INSPECTED
        { wch: 16 }, // IO #
        { wch: 16 }, // IO DATE
        { wch: 16 }, // NFSI #
        { wch: 16 }, // NFSI DATE
        { wch: 18 }, // FSIC validity
        { wch: 16 }, // defects
        { wch: 24 }, // inspectors
        { wch: 18 }, // occupancy
        { wch: 30 }, // bldg desc
        { wch: 16 }, // floor area
        { wch: 16 }, // height
        { wch: 14 }, // storey
        { wch: 16 }, // high rise
        { wch: 14 }, // fsmr
        { wch: 18 }, // remarks
        { wch: 16 }, // OR #
        { wch: 14 }, // OR amt
        { wch: 16 }, // OR date
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "BFP Current Records");
      XLSX.writeFile(workbook, "BFP_Current_Records.xlsx");
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

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
            onExport={() => setShowConfirm(true)}
            onArchive={() => navigate("/app/archive")}
          />
        </div>

        {/* RIGHT */}
        <div style={rightCol}>
          <RecentRecords
            C={C}
            loading={loadingRecent}
            list={visibleRecent} // ✅ ONLY 4 per page
            onOpen={(id) => navigate("/app/records", { state: { activeId: id } })}            
            page={page}
            setPage={setPage}
            total={total}
            pageSize={pageSize}
          />
        </div>
      </div>

      {showConfirm && (
        <ExportConfirmModal
          C={C}
          exporting={exporting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            setShowConfirm(false);
            await exportCurrentExcel();
          }}
        />
      )}
    </div>
  );
}