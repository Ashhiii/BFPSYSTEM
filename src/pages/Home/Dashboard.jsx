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
  const pageSize = 4; // ✅ 4 items per page

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
    if (!d) return "-";
    try {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
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
              dateText: fmtDate(dt),
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

      const worksheet = XLSX.utils.json_to_sheet(list);
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

  // ✅ layout styles (IMPORTANT: remove overflow hidden)
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
            list={visibleRecent}  // ✅ ONLY 4 per page
            onOpen={(id) => navigate("/app/records", { state: { openId: id } })}
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