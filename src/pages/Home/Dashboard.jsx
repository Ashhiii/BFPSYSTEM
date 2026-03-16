import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
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

  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [allRecords, setAllRecords] = useState([]);

  const [showPrintModal, setShowPrintModal] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);
  const [renewedCount, setRenewedCount] = useState(0);
  const [activeId, setActiveId] = useState(null);

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
              createdAt: data.createdAt || null,
              updatedAt: data.updatedAt || null,
              createdAtMs: data.createdAtMs || null,
              updatedAtMs: data.updatedAtMs || null,
              _dt: dt ? dt.getTime() : 0,
              dateText: dt ? fmtDate(dt) : "-",
              ...data,
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

  const activeRecord = useMemo(() => {
    return allRecords.find((r) => r.id === activeId) || null;
  }, [allRecords, activeId]);

  const getCertificateUrl = (recordId, value) => {
    if (value === "owner") return `${API}/records/${recordId}/certificate/owner/pdf`;
    if (value === "bfp") return `${API}/records/${recordId}/certificate/bfp/pdf`;
    if (value === "owner-new") return `${API}/records/${recordId}/certificate/owner-new/pdf`;
    if (value === "bfp-new") return `${API}/records/${recordId}/certificate/bfp-new/pdf`;
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

  const mapRowsForExcel = (rows) => {
    return rows.map((r, index) => ({
      "#": index + 1,
      "Record ID": sanitizeSheetValue(r.id),
      "FSIC APP NO": sanitizeSheetValue(r.fsicAppNo),
      "FSIC NO": sanitizeSheetValue(r.fsicNo),
      "IO NUMBER": sanitizeSheetValue(r.ioNumber),
      "Establishment Name": sanitizeSheetValue(r.establishmentName),
      "Owner Name": sanitizeSheetValue(r.ownerName),
      "Business Address": sanitizeSheetValue(r.businessAddress),
      "Nature Of Inspection": sanitizeSheetValue(r.natureOfInspection),
      "Date Inspected": sanitizeSheetValue(r.dateInspected),
      "Created At": sanitizeSheetValue(r.createdAt),
      "Updated At": sanitizeSheetValue(r.updatedAt),
      "Date Text": sanitizeSheetValue(r.dateText),
    }));
  };

  const exportRowsToExcel = (rows, fileName) => {
    const safeRows = Array.isArray(rows) ? rows : [];

    if (!safeRows.length) {
      alert("Walay record nga ma-export.");
      return;
    }

    const excelData = mapRowsForExcel(safeRows);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
      { wch: 26 },
      { wch: 40 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportAll = async (rowsToExport) => {
    try {
      setExporting(true);
      exportRowsToExcel(rowsToExport || recent, "BFP-Records.xlsx");
      setShowExport(false);
    } catch (err) {
      console.error("Export all failed:", err);
      alert("Naay problem sa pag-export sa Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportSelected = async (selectedRows, selectedIds) => {
    try {
      setExporting(true);

      let finalRows = selectedRows;

      if ((!finalRows || !finalRows.length) && selectedIds?.length) {
        finalRows = recent.filter((r) => selectedIds.includes(String(r.id)));
      }

      exportRowsToExcel(finalRows || [], "selected-records.xlsx");
      setShowExport(false);
    } catch (err) {
      console.error("Export selected failed:", err);
      alert("Naay problem sa pag-export sa selected records.");
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
        onExportAll={handleExportAll}
        onExportSelected={handleExportSelected}
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