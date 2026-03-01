// src/pages/Records/CloseMonthControl.jsx
import React, { useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import ConfirmModal from "../../components/ConfirmModal.jsx";

/** ✅ Month key in PH timezone -> "YYYY-MM" */
const monthKeyNow = () => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/** ✅ Convert "YYYY-MM" -> "February 2026" */
const formatMonthLabel = (yyyy_mm) => {
  if (!yyyy_mm) return "";
  const [y, m] = String(yyyy_mm).split("-");
  const monthIndex = Number(m) - 1;

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  if (!y || monthIndex < 0 || monthIndex > 11) return String(yyyy_mm);
  return `${months[monthIndex]} ${y}`;
};

/** ✅ Build last N months list (YYYY-MM) */
const buildMonthOptions = (count = 24) => {
  const base = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  base.setDate(1);

  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setMonth(base.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
};

export default function CloseMonthControl({
  C,
  buttonStyle,
  showToast,
  fetchCurrent,
  onAfterCloseUIReset,
  setRefresh,
}) {
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const monthOptions = useMemo(() => buildMonthOptions(24), []);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyNow());

  const doCloseMonth = async () => {
    try {
      if (closing) return;
      setClosing(true);

      const month = selectedMonth || monthKeyNow();
      const monthDocRef = doc(db, "archives", month);

      const monthDoc = await getDoc(monthDocRef);
      if (monthDoc.exists() && monthDoc.data()?.closedAt) {
        showToast?.(
          "Already Closed",
          `Month ${formatMonthLabel(month)} is already closed.`
        );
        return;
      }

      const currentSnap = await getDocs(collection(db, "records"));
      if (currentSnap.empty) {
        showToast?.("No Records", "No records to archive.");
        return;
      }

      await setDoc(
        monthDocRef,
        { month, closedAt: serverTimestamp() },
        { merge: true }
      );

      const docsArr = currentSnap.docs;
      let i = 0;

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

      onAfterCloseUIReset?.();

      showToast?.(
        "Archived Successfully",
        `✅ Archived ${docsArr.length} records for ${formatMonthLabel(month)}.`
      );

      await fetchCurrent?.();
      setRefresh?.((p) => !p);
    } catch (e) {
      console.error("Close Month error:", e);
      showToast?.("Close Month Failed", "❌ Check Firestore rules / console.");
    } finally {
      setClosing(false);
      setShowCloseConfirm(false);
    }
  };

  const selectStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text,
    fontWeight: 900,
    outline: "none",
    cursor: "pointer",
  };

  const miniLabel = {
    fontSize: 12,
    fontWeight: 900,
    color: C.muted,
    marginBottom: 6,
  };

  return (
    <>
      {/* ✅ button only */}
      <button
        style={{ ...buttonStyle, opacity: closing ? 0.7 : 1 }}
        onClick={() => setShowCloseConfirm(true)}
        disabled={closing}
      >
        {closing ? "Closing..." : "Close Month"}
      </button>

      {/* ✅ modal appears immediately when button clicked */}
      <ConfirmModal
        C={C}
        open={showCloseConfirm}
        title="Close Month"
        message={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 850, color: C.text }}>
              Select which month you want to close. This will archive ALL current
              records into that month and remove them from Current Records.
            </div>

            <div>
              <div style={miniLabel}>Month to close</div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={selectStyle}
                disabled={closing}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, fontWeight: 850, color: C.muted }}>
              Target: <b>{formatMonthLabel(selectedMonth)}</b>
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText={`Yes, Close ${formatMonthLabel(selectedMonth)}`}
        danger={true}
        busy={closing}
        onCancel={() => !closing && setShowCloseConfirm(false)}
        onConfirm={doCloseMonth}
      />
    </>
  );
}