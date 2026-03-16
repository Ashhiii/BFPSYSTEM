import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import InsightCard from "./parts/InsightCard";
import QuickActions from "./parts/QuickActions";
import RecentRecords from "./parts/RecentRecords";
import ExportChoiceModal from "../../components/ExportChoiceModal";
import BulkDownloadModal from "../../components/BulkDownloadModal";

export default function Dashboard() {
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [allRecords, setAllRecords] = useState([]);

  const [totalRecords, setTotalRecords] = useState(0);
  const [renewedCount, setRenewedCount] = useState(0);
  const [activeId, setActiveId] = useState(null);

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      setLoadingRecent(true);
      try {
        const recSnap = await getDocs(collection(db, "records"));
        setTotalRecords(recSnap.size);

        const renSnap = await getDocs(collection(db, "renewals"));
        setRenewedCount(renSnap.size);

        const snap = await getDocs(collection(db, "records"));

        const fullList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAllRecords(fullList);

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

  const total = recent.length;
  const visibleRecent = useMemo(() => {
    const start = (page - 1) * pageSize;
    return recent.slice(start, start + pageSize);
  }, [recent, page]);

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

  return (
    <div style={pageWrap}>
      <div style={layout}>
        <div style={leftCol}>
          <InsightCard
            C={C}
            totalRecords={totalRecords}
            renewedCount={renewedCount}
            onDownloadAll={() => setShowBulkDownload(true)}
            onPrint={() => window.print()}
          />

          <QuickActions
            C={C}
            exporting={exporting}
            onAdd={() => navigate("/app/add-record")}
            onImport={() => navigate("/app/import")}
            onExport={() => setShowExport(true)}
            onArchive={() => navigate("/app/archive")}
          />
        </div>

        <div style={rightCol}>
          <RecentRecords
            C={C}
            loading={loadingRecent}
            list={visibleRecent}
            activeId={activeId}
            onOpen={(id) => {
              setActiveId(id);
              navigate("/app/records", { state: { activeId: id } });
            }}
            page={page}
            setPage={setPage}
            total={total}
            pageSize={pageSize}
          />
        </div>
      </div>

      <ExportChoiceModal
        open={showExport}
        onClose={() => !exporting && setShowExport(false)}
        onExportAll={() => {}}
        onExportSelected={() => {}}
        rows={recent}
        busy={exporting}
        C={C}
      />

      <BulkDownloadModal
        open={showBulkDownload}
        onClose={() => setShowBulkDownload(false)}
        records={allRecords}
          apiBase={import.meta.env.VITE_API_URL}
        showToast={(title, message) => alert(`${title}\n${message}`)}
      />
    </div>
  );
}