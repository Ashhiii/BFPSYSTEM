import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch } from "firebase/firestore";

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No" },
  { key: "natureOfInspection", label: "Nature Of Inspection" },
  { key: "ownerName", label: "Owner" },
  { key: "establishmentName", label: "Establishment" },
  { key: "businessAddress", label: "Address" },
  { key: "contactNumber", label: "Contact" },
  { key: "dateInspected", label: "Date Inspected" },
  { key: "ioNumber", label: "IO No" },
  { key: "ioDate", label: "IO Date" },
  { key: "nfsiNumber", label: "NFSI No" },
  { key: "nfsiDate", label: "NFSI Date" },
  { key: "ntcNumber", label: "NTC No" },
  { key: "ntcDate", label: "NTC Date" },
  { key: "fsicValidity", label: "FSIC Validity" },
  { key: "defects", label: "Defects" },

  { key: "teamLeader", label: "Team Leader" },
  { key: "teamLeaderSerial", label: "Team Leader Serial" },

  { key: "inspector1", label: "Inspector 1" },
  { key: "inspector1Serial", label: "Inspector 1 Serial" },

  { key: "inspector2", label: "Inspector 2" },
  { key: "inspector2Serial", label: "Inspector 2 Serial" },

  { key: "inspector3", label: "Inspector 3" },
  { key: "inspector3Serial", label: "Inspector 3 Serial" },

  // ✅ combined auto
  { key: "inspectors", label: "Inspectors (combined)" },

  { key: "occupancyType", label: "Occupancy" },
  { key: "buildingDesc", label: "Building Desc" },
  { key: "floorArea", label: "Floor Area" },
  { key: "buildingHeight", label: "Height" },
  { key: "storeyCount", label: "Storey" },
  { key: "highRise", label: "High Rise" },
  { key: "fsmr", label: "FSMR" },
  { key: "fsicNumber", label: "FSIC Number" },
  { key: "remarks", label: "Remarks" },
  { key: "orNumber", label: "OR No" },
  { key: "orAmount", label: "OR Amount" },
  { key: "orDate", label: "OR Date" },
  { key: "chiefName", label: "Chief" },
  { key: "marshalName", label: "Marshal" },
];

// ✅ ONLY fields you really want ALWAYS UPPERCASE
const CAPS_KEYS = new Set([
  "fsicAppNo",
  "natureOfInspection",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",

  "ioNumber",
  "nfsiNumber",
  "ntcNumber",

  "fsicValidity",
  "defects",

  "occupancyType",
  "buildingDesc",
  "floorArea",
  "buildingHeight",
  "storeyCount",
  "highRise",
  "fsmr",
  "remarks",
  "orNumber",
  "orAmount",
  "chiefName",
  "marshalName",
]);

// ✅ Keep EXACT casing as typed (no auto-caps)
const NO_CAPS_KEYS = new Set([
  "teamLeader",
  "teamLeaderSerial",
  "inspector1",
  "inspector1Serial",
  "inspector2",
  "inspector2Serial",
  "inspector3",
  "inspector3Serial",
  "inspectors", // combined (auto) but keep casing of names
]);

const DATE_KEYS = new Set(["dateInspected", "ioDate", "nfsiDate", "ntcDate", "orDate"]);

/** ✅ Convert whatever value -> YYYY-MM-DD for <input type="date"> */
const toInputDate = (v) => {
  if (!v) return "";

  // Firestore Timestamp
  if (v?.toDate) {
    const d = v.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // already YYYY-MM-DD
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // ISO / parseable date string (includes "January 2, 2026")
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
    const d = new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return "";
};

// ✅ Add 1 year to YYYY-MM-DD and return YYYY-MM-DD
const addOneYear = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return "";
  const d = new Date(`${yyyy_mm_dd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ✅ Combine inspector 1/2/3 -> string
const combineInspectors = (a, b, c) => {
  return [a, b, c]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
};

export default function RecordDetailsPanel({
  styles,
  record,
  source,
  isArchive,
  onRenewSaved,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [renewedRecord, setRenewedRecord] = useState(null);

  const entityKey = useMemo(() => record?.entityKey || "", [record]);

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    gold: "#f59e0b",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    green: "#16a34a",
    danger: "#dc2626",
  };

  useEffect(() => {
    setEditing(false);
    setRenewing(false);
    setSaving(false);
    setRenewedRecord(null);
    if (!record) return;

    // ✅ init form (dates normalized for date inputs)
    const init = {};
    FIELDS.forEach((f) => {
      const raw = record?.[f.key] ?? "";
      init[f.key] = DATE_KEYS.has(f.key) ? toInputDate(raw) : raw;
    });

    // ✅ auto compute validity from dateInspected
    if (init.dateInspected) init.fsicValidity = addOneYear(init.dateInspected);

    // ✅ auto compute inspectors combined
    init.inspectors = combineInspectors(init.inspector1, init.inspector2, init.inspector3);

    setForm(init);

    // ✅ load latest renewed (renewals/{entityKey})
    if (!entityKey) return;
    getDoc(doc(db, "renewals", entityKey))
      .then((snap) =>
        setRenewedRecord(snap.exists() ? snap.data()?.record || null : null)
      )
      .catch(() => setRenewedRecord(null));
  }, [record, entityKey]);

  const inputStyle = (k) => ({
    width: "100%",
    padding: "9px 10px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    outline: "none",
    fontSize: 13,
    color: C.text,
    background: "#fff",
    boxSizing: "border-box",
    fontWeight: 850,
    textTransform: CAPS_KEYS.has(k) && !NO_CAPS_KEYS.has(k) ? "uppercase" : "none",
  });

  // ✅ field setter (auto validity + combined inspectors)
  const setField = (k, v) => {
    setForm((p) => {
      const next = { ...p };

      // keep exact casing for name fields
      if (NO_CAPS_KEYS.has(k)) next[k] = String(v ?? "");
      else next[k] = CAPS_KEYS.has(k) ? String(v ?? "").toUpperCase() : String(v ?? "");

      // ✅ dateInspected changes -> auto fsicValidity (+1 year)
      if (k === "dateInspected") {
        const di = String(v ?? "");
        next.fsicValidity = addOneYear(di);
      }

      // ✅ inspector changes -> auto combined inspectors
      if (k === "inspector1" || k === "inspector2" || k === "inspector3") {
        next.inspectors = combineInspectors(next.inspector1, next.inspector2, next.inspector3);
      }

      return next;
    });
  };

  const btn = (variant) => {
    const common = {
      padding: "10px 12px",
      borderRadius: 12,
      fontWeight: 950,
      cursor: "pointer",
      whiteSpace: "nowrap",
      opacity: saving ? 0.7 : 1,
    };
    if (variant === "primary")
      return { ...common, border: `1px solid ${C.primary}`, background: C.primary, color: "#fff" };
    if (variant === "gold")
      return { ...common, border: `1px solid ${C.gold}`, background: C.gold, color: "#111827" };
    if (variant === "danger")
      return { ...common, border: `1px solid ${C.danger}`, background: C.softBg, color: C.danger };
    return common;
  };

  // ✅ Save edit
  const saveEdit = async () => {
    if (!record?.id) return alert("Missing record.id (cannot save).");

    try {
      setSaving(true);

      // ensure autos are correct before saving
      const ensured = { ...form };
      if (ensured.dateInspected) ensured.fsicValidity = addOneYear(ensured.dateInspected);
      ensured.inspectors = combineInspectors(ensured.inspector1, ensured.inspector2, ensured.inspector3);

      const payload = {};
      FIELDS.forEach((f) => (payload[f.key] = ensured[f.key] ?? ""));
      payload.updatedAt = serverTimestamp();

      const targetDocRef = isArchive
        ? doc(db, "archives", String(source || "").replace("Archive: ", ""), "records", record.id)
        : doc(db, "records", record.id);

      await setDoc(targetDocRef, payload, { merge: true });

      const merged = { ...record, ...payload };
      setEditing(false);
      onUpdated?.({ ...merged, id: record.id });
    } catch (e) {
      alert(`❌ SAVE ERROR: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Save renew (writes renewals/{entityKey})
// ✅ Save renew (writes renewals/{entityKey} AND creates a new doc in records/)
const saveRenew = async () => {
  if (!record) return;
  if (!entityKey) return alert("Missing entityKey");

  try {
    setSaving(true);

    // ✅ ensure auto fields are correct
    const ensured = { ...form };

    // auto validity from dateInspected (if you have it in this panel)
    if (ensured.dateInspected) ensured.fsicValidity = addOneYear(ensured.dateInspected);

    // auto inspectors combined
    ensured.inspectors = combineInspectors(
      ensured.inspector1,
      ensured.inspector2,
      ensured.inspector3
    );

    // ✅ Build renewed record object
    const newRecord = {
      ...record,
      ...ensured,
      entityKey,
      source: source || "unknown",
      renewedFromId: record?.id || "",
      renewedAt: new Date().toISOString(),

      // optional flags for UI filtering
      status: "RENEWED",
      isRenewedCopy: true,
    };

    // ✅ Create a NEW record doc in current records collection (auto id)
    const newRecordRef = doc(collection(db, "records")); // generates new id
    const renewalsRef = doc(db, "renewals", entityKey);

    // ✅ Do both writes in one batch
    const batch = writeBatch(db);

    // 1) save to renewals/{entityKey}
    batch.set(
      renewalsRef,
      { record: newRecord, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // 2) save to records/{newId} so it appears in Records list
    batch.set(
      newRecordRef,
      {
        ...newRecord,
        // make sure records doc has its own id too (useful for UI)
        id: newRecordRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    // update UI state
    setRenewedRecord({ ...newRecord, id: newRecordRef.id });
    setRenewing(false);

    // pass back ids for parent refresh/highlight if you want
    onRenewSaved?.({
      oldId: record.id,
      newRecord: { ...newRecord, id: newRecordRef.id },
    });
  } catch (e) {
    alert(`❌ ${e.message}`);
  } finally {
    setSaving(false);
  }
};
  const panel = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.bg,
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 520,
  };

  const head = {
    padding: 12,
    borderBottom: `1px solid ${C.border}`,
    background: C.softBg,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  };

  const body = { flex: 1, overflowY: "auto", padding: 12 };

  const baseTd =
    styles?.td ||
    ({
      padding: "14px 12px",
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      verticalAlign: "top",
    });

  const labelTd = { ...baseTd, fontWeight: 950, width: 160, color: C.primaryDark, background: "#fff" };
  const valueTd = { ...baseTd, color: C.text, background: "#fff" };

  if (!record) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>{source}</span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800 }}>
          Click a row to show details here.
        </div>
      </div>
    );
  }

  const title = record.establishmentName || record.fsicAppNo || "Record";
  const mode = editing ? "edit" : renewing ? "renew" : "view";

  return (
    <div style={panel}>
      <div style={head}>
        <div>
          <div style={{ fontWeight: 950, color: C.primaryDark }}>{title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 800, marginTop: 4 }}>
            {source} {entityKey ? `• ${entityKey}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mode === "view" && (
            <>
              <button style={btn("primary")} onClick={() => setEditing(true)}>
                Edit
              </button>

              {isArchive && (
                <button
                  style={btn("gold")}
                  onClick={() => {
                    setRenewing(true);
                    setEditing(false);
                  }}
                >
                  Renew
                </button>
              )}
            </>
          )}

          {mode === "edit" && (
            <>
              <button style={btn("gold")} onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button style={btn("danger")} onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
            </>
          )}

          {mode === "renew" && (
            <>
              <button style={btn("gold")} onClick={saveRenew} disabled={saving}>
                {saving ? "Saving..." : "Save Renew"}
              </button>
              <button style={btn("danger")} onClick={() => setRenewing(false)} disabled={saving}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div style={body}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {FIELDS.reduce((rows, field, index) => {
              if (index % 2 === 0) rows.push([field]);
              else rows[rows.length - 1].push(field);
              return rows;
            }, []).map((pair, rowIndex) => (
              <tr key={rowIndex}>
                {pair.map((f) => (
                  <React.Fragment key={f.key}>
                    <td style={labelTd}>{f.label}</td>
                    <td style={valueTd}>
                      {mode === "edit" || mode === "renew" ? (
                        <input
                          name={f.key}
                          value={form[f.key] ?? ""}
                          onChange={(e) => setField(f.key, e.target.value)}
                          style={{
                            ...inputStyle(f.key),
                            ...(f.key === "inspectors"
                              ? { background: "#f3f4f6", cursor: "not-allowed" }
                              : null),
                            ...(f.key === "fsicValidity"
                              ? { background: "#f3f4f6", cursor: "not-allowed" }
                              : null),
                          }}
                          autoComplete="off"
                          placeholder={f.label}
                          type={DATE_KEYS.has(f.key) ? "date" : "text"}
                          readOnly={f.key === "inspectors" || f.key === "fsicValidity"} // ✅ AUTO FIELDS
                        />
                      ) : (
                        (record?.[f.key] ?? "") || "-"
                      )}
                    </td>
                  </React.Fragment>
                ))}

                {pair.length === 1 && (
                  <>
                    <td style={{ ...labelTd, background: "#fff" }}></td>
                    <td style={{ ...valueTd, background: "#fff" }}></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {mode === "view" && (
          <>
            {renewedRecord ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  border: `1px dashed ${C.primary}`,
                  borderRadius: 12,
                  background: C.softBg,
                  color: C.primaryDark,
                  fontWeight: 900,
                }}
              >
                ✅ Latest renewed version exists for this record.
              </div>
            ) : (
              <div style={{ marginTop: 12, color: C.muted, fontWeight: 850 }}>
                No renewed version yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}