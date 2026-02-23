// Records.jsx (FULL) — Current + Close Month + Details
// ✅ Auto-open + highlight row when navigated from Dashboard (location.state.openId)

import React, { useEffect, useMemo, useState } from "react";

import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";

import { useLocation } from "react-router-dom";

import RecordsTable from "./RecordsTable.jsx";
import RecordDetailsPanel from "./RecordDetailsPanel.jsx";
import injectTableStyles from "./injectTableStyles.jsx";

/** ✅ Month key in PH timezone */
const monthKeyNow = () => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function Records({ refresh, setRefresh }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [closing, setClosing] = useState(false);

  const location = useLocation();

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => injectTableStyles(), []);

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    danger: "#dc2626",
  };

  const fetchCurrent = async () => {
    const qy = query(collection(db, "records"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchCurrent().catch(() => setRecords([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    return (records || []).filter((r) => {
      return (
        (r.ownerName || "").toLowerCase().includes(key) ||
        (r.establishmentName || "").toLowerCase().includes(key) ||
        (r.businessAddress || "").toLowerCase().includes(key) ||
        (r.fsicAppNo || "").toLowerCase().includes(key) ||
        (r.natureOfInspection || "").toLowerCase().includes(key) ||
        (r.inspectors || "").toLowerCase().includes(key)
      );
    });
  }, [records, search]);

  const onSelectRow = (record) => {
    if (!record) return;
    const fixed = {
      ...record,
      entityKey:
        record.entityKey ||
        (record.fsicAppNo ? `fsic:${record.fsicAppNo}` : ""),
    };
    setSelectedRecord(fixed);
  };

  // ✅ AUTO-OPEN + HIGHLIGHT when navigated from Dashboard
  useEffect(() => {
    const openId = location.state?.openId;

    // wait for records list to be loaded
    if (openId && (records || []).length) {
      const found = (records || []).find(
        (r) => String(r.id) === String(openId)
      );

      if (found) {
        onSelectRow(found); // ✅ opens details + sets selectedRecord (used for highlight)
      }

      // OPTIONAL: clear state so it won't re-open on refresh/back
      window.history.replaceState({}, document.title);
    }
  }, [location.state, records]);

  // ✅ Close Month (archive all current -> archives/YYYY-MM/records then delete current)
  const closeMonth = async () => {
    try {
      if (closing) return;
      if (!window.confirm("Close month and archive ALL current records?")) return;

      setClosing(true);

      const month = monthKeyNow();
      const monthDocRef = doc(db, "archives", month);

      const monthDoc = await getDoc(monthDocRef);
      if (monthDoc.exists() && monthDoc.data()?.closedAt) {
        alert(`Month ${month} is already closed.`);
        return;
      }

      const currentSnap = await getDocs(collection(db, "records"));
      if (currentSnap.empty) {
        alert("No records to archive.");
        return;
      }

      await setDoc(
        monthDocRef,
        { month, closedAt: new Date().toISOString() },
        { merge: true }
      );

      const docsArr = currentSnap.docs;
      let i = 0;

      // batch: 200 records -> 400 writes (set+delete) safe
      while (i < docsArr.length) {
        const batch = writeBatch(db);
        const slice = docsArr.slice(i, i + 200);

        slice.forEach((d) => {
          const data = d.data();
          batch.set(doc(db, "archives", month, "records", d.id), {
            ...data,
            archivedAt: new Date().toISOString(),
          });
          batch.delete(doc(db, "records", d.id));
        });

        await batch.commit();
        i += 200;
      }

      setSelectedRecord(null);
      setSearch("");
      alert(`✅ Archived ${docsArr.length} records for ${month}`);

      await fetchCurrent();
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Close Month error:", e);
      alert(
        "❌ Close Month failed.\n\nPossible causes:\n- Firestore rules not allowing write/delete\n- createdAt/orderBy mismatch\n\nCheck console for details."
      );
    } finally {
      setClosing(false);
    }
  };

  const handleRenewSaved = ({ oldId, newRecord }) => {
    setSelectedRecord(newRecord);
    setRecords((prev) => {
      const idx = (prev || []).findIndex((r) => String(r.id) === String(oldId));
      if (idx === -1) return [newRecord, ...(prev || [])];
      const copy = [...prev];
      copy.splice(idx + 1, 0, newRecord);
      return copy;
    });
    setRefresh?.((p) => !p);
  };

  // UI
  const page = {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
  };

const header = {
  borderRadius: 24,
  padding: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",

  color: "#fff",

  background: `
    radial-gradient(circle at 85% 20%, rgba(255,255,255,0.18), transparent 40%),
    linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #080404 100%)
  `,

  boxShadow: "0 20px 40px rgba(0,0,0,.25)",
};
  const hTitle = { fontSize: 18, fontWeight: 950, color: C.bg };
  const hSub = { fontSize: 12, fontWeight: 800, color: C.bg, marginTop: 6 };

  const topbar = {
    borderRadius: 16,
    overflow: "hidden",
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
  };

  const topbarInner = {
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  };

  const input = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    outline: "none",
    fontWeight: 850,
    flex: 1,
    minWidth: 260,
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 950,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    whiteSpace: "nowrap",
  };

  const btnRed = {
    ...btn,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: "#fff",
    opacity: closing ? 0.7 : 1,
  };

  const content = {
    flex: 1,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 12,
  };

  const card = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
  };

  const cardHead = {
    padding: 10,
    borderBottom: `1px solid ${C.border}`,
    color: C.primaryDark,
    fontWeight: 950,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    background: C.softBg,
  };

  const scroll = { flex: 1, overflowY: "auto", overflowX: "hidden" };

  const panelStyles = {
    td: {
      padding: 10,
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      color: C.text,
    },
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={hTitle}>Records</div>
          <div style={hSub}>View current records + details + close month</div>
        </div>

        <button style={btnRed} onClick={closeMonth} disabled={closing}>
          {closing ? "Closing..." : "Close Month"}
        </button>
      </div>

      <div style={topbar}>
        <div style={topbarInner}>
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: C.primaryDark }}>
              Current Records
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 4 }}>
              Click a row → details show on the right
            </div>
          </div>

          <input
            placeholder="🔍 Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />
        </div>

        <div style={{ height: 4, background: C.primary }} />
      </div>

      <div style={content}>
        <div style={card}>
          <div style={cardHead}>
            <div>Current List</div>
            <div style={{ opacity: 0.85, color: C.muted }}>
              Results: {filtered.length}
            </div>
          </div>

          <div style={scroll}>
            <RecordsTable
              records={filtered}
              onRowClick={onSelectRow}
              apiBase={API}
              activeId={selectedRecord?.id} // ✅ highlight selected + dashboard opened
            />
          </div>
        </div>

        <RecordDetailsPanel
          styles={panelStyles}
          record={selectedRecord}
          source="Current"
          isArchive={false}
          onRenewSaved={handleRenewSaved}
          onUpdated={(updated) => {
            setRecords((prev) => {
              const copy = [...(prev || [])];
              const idx = copy.findIndex((r) => String(r.id) === String(updated.id));
              if (idx !== -1) copy[idx] = updated;
              return copy;
            });
            setSelectedRecord(updated);
          }}
        />
      </div>
    </div>
  );
}