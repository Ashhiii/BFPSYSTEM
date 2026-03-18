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
import PrintSelectionModal from "../../components/PrintSelectionModal";

export default function Dashboard() {
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);
  const [renewedCount, setRenewedCount] = useState(0);
  const [activeId, setActiveId] = useState(null);

  const [allRecords, setAllRecords] = useState([]);
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 4;

  const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

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

  const S = (v) => (v === undefined || v === null ? "" : String(v));

  const dateText = (v) => {
    const d = parseAnyDate(v);
    return d ? fmtDate(d) : S(v);
  };

  const pick = (r, canon, legacy = []) => {
    const direct = r?.[canon];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") return direct;

    for (const k of legacy) {
      const v = r?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }

    return "";
  };

  useEffect(() => {
    const load = async () => {
      setLoadingRecent(true);
      try {
        const recQuery = query(collection(db, "records"), orderBy("createdAt", "desc"));
        const recSnap = await getDocs(recQuery);
        setTotalRecords(recSnap.size);

        const renSnap = await getDocs(collection(db, "renewals"));
        setRenewedCount(renSnap.size);

        const fullList = recSnap.docs.map((d) => {
          const data = d.data() || {};
          const dt =
            (data.createdAtMs ? new Date(data.createdAtMs) : null) ||
            parseAnyDate(data.createdAt) ||
            (data.updatedAtMs ? new Date(data.updatedAtMs) : null) ||
            parseAnyDate(data.updatedAt) ||
            null;

          return {
            id: d.id,
            ...data,
            _dt: dt ? dt.getTime() : 0,
            dateText: dt ? fmtDate(dt) : "-",
          };
        });

        setAllRecords(fullList);

        const recentList = [...fullList]
          .sort((a, b) => (b._dt || 0) - (a._dt || 0))
          .map((r) => ({
            id: r.id,
            fsicAppNo: r.fsicAppNo || "",
            establishmentName: r.establishmentName || "",
            ownerName: r.ownerName || "",
            natureOfInspection: r.natureOfInspection || "",
            _dt: r._dt || 0,
            dateText: r.dateText || "-",
          }));

        setRecent(recentList);
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

  const activeRecord = useMemo(() => {
    return allRecords.find((r) => r.id === activeId) || null;
  }, [allRecords, activeId]);

  const getCertificateUrl = (recordId, value) => {
    if (value === "owner") return `${API}/records/${recordId}/certificate/owner/pdf`;
    if (value === "bfp") return `${API}/records/${recordId}/certificate/bfp/pdf`;
    if (value === "owner-new") return `${API}/records/${recordId}/certificate/owner-new/pdf`;
    if (value === "bfp-new") return `${API}/records/${recordId}/certificate/bfp-new/pdf`;
    if (value === "io") return `${API}/records/${recordId}/io/pdf`;
    if (value === "reinspection") return `${API}/records/${recordId}/reinspection/pdf`;
    if (value === "nfsi") return `${API}/records/${recordId}/nfsi/pdf`;
    return "";
  };

  const printPdfBlob = async (blob) => {
    const blobUrl = window.URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print iframe error:", err);
        window.open(blobUrl, "_blank");
      }

      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
        window.URL.revokeObjectURL(blobUrl);
      }, 5000);
    };
  };

  const handlePrintSelected = async ({ selectedIds, template }) => {
    if (!selectedIds?.length) {
      alert("Pili una ug record(s) para ma-print.");
      return;
    }

    if (!template) {
      alert("Pili una ug template.");
      return;
    }

    try {
      for (const recordId of selectedIds) {
        const url = getCertificateUrl(recordId, template);
        if (!url) continue;

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          throw new Error(`Failed to load printable PDF for record ${recordId}`);
        }

        const blob = await res.blob();
        await printPdfBlob(blob);
      }
    } catch (err) {
      console.error("Print failed:", err);
      alert("Naay problem sa pag-print. Check backend endpoint or popup/print permissions.");
    }
  };

  const sanitizeSheetValue = (value) => {
    if (value == null) return "";
    if (typeof value === "object") {
      if (typeof value.toDate === "function") {
        const d = value.toDate();
        return Number.isNaN(d.getTime()) ? "" : fmtDate(d);
      }
      if (Array.isArray(value)) return value.join(", ");
      return JSON.stringify(value);
    }
    return value;
  };

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

        "FSIC NO": S(r.fsicNo || r.FSIC_NUMBER),
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
      { wch: 22 },
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
      { wch: 16 },
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
            onPrint={() => setShowPrintModal(true)}
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
        onExportAll={exportAll}
        onExportSelected={exportSelected}
        rows={recent}
        busy={exporting}
        C={C}
      />

      <BulkDownloadModal
        open={showBulkDownload}
        onClose={() => setShowBulkDownload(false)}
        records={allRecords}
        apiBase={API}
        C={C}
      />

      <PrintSelectionModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        records={allRecords}
        apiBase={API}
        C={C}
        onPrint={async (payload) => {
          await handlePrintSelected(payload);
          setShowPrintModal(false);
        }}
      />
    </div>
  );
}