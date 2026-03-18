import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  writeBatch,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const HIGH_RISE_CHOICES = ["YES", "NO"];
const FSMR_CHOICES = ["YES", "NO"];
const REMARKS_CHOICES = ["FSIC", "TRANSFERRED", "CLOSED", "CAN'T BE LOCATED", "REFUSED"];
const NATURE_SUGGESTIONS = [
  "ANNUAL",
  "RENEW",
  "NEW",
  "RE-INSPECTION",
  "CLOSED",
  "REFUSED",
  "TRANSFER",
  "NTC",
];

const OCCUPANCY_OPTIONS = [
  "ASSEMBLY",
  "EDUCATIONAL",
  "DAY CARE",
  "HEALTH CARE",
  "RESIDENTIAL BOARD AND CARE",
  "DETENTION & CORRECTIONAL",
  "HOTEL",
  "DORMITORIES",
  "APARTMENT BUILDINGS",
  "LODGING & ROOMING HOUSE",
  "SINGLE & TWO FAMILY DWELLING UNIT",
  "MERCANTILE",
  "BUSINESS",
  "INDUSTRIAL",
  "STORAGE",
  "SPECIAL STRUCTURES",
  "NON-STRUCTURAL (E.G., VEHICLE USED AS ROLLING STORE, ETC.)",
];

const FIELDS = [
  { key: "fsicAppNo", label: "FSIC App No" },

  {
    key: "natureOfInspection",
    label: "Nature of Inspection",
    placeholder: "Select Nature of Inspection",
    required: false,
    type: "select",
    span: 1,
  },

  { key: "ownerName", label: "Owner" },
  { key: "establishmentName", label: "Establishment" },
  { key: "businessAddress", label: "Address" },
  { key: "defects", label: "Defects" },

  { key: "contactNumber", label: "Contact" },
  { key: "dateInspected", label: "Date Inspected" },

  { key: "ioNumber", label: "IO No" },
  { key: "ioDate", label: "IO Date" },

  { key: "nfsiNumber", label: "NFSI No" },
  { key: "nfsiDate", label: "NFSI Date" },

  { key: "ntcNumber", label: "NTC No" },
  { key: "ntcDate", label: "NTC Date" },

  { key: "fsicNo", label: "FSIC No" },

  { key: "fsicValidity", label: "FSIC Validity" },

  { key: "teamLeader", label: "Team Leader" },
  { key: "teamLeaderSerial", label: "Team Leader Serial" },

  { key: "inspector1", label: "Inspector 1" },
  { key: "inspector1Serial", label: "Inspector 1 Serial" },

  { key: "inspector2", label: "Inspector 2" },
  { key: "inspector2Serial", label: "Inspector 2 Serial" },

  { key: "inspector3", label: "Inspector 3" },
  { key: "inspector3Serial", label: "Inspector 3 Serial" },

  { key: "inspector4", label: "Inspector 4" },
  { key: "inspector4Serial", label: "Inspector 4 Serial" },

  { key: "inspector5", label: "Inspector 5" },
  { key: "inspector5Serial", label: "Inspector 5 Serial" },

  { key: "inspectors", label: "Inspectors (combined)" },

  { key: "occupancyType", label: "Type of Occupancy", required: false, type: "select", span: 1 },
  { key: "buildingDescription", label: "Building Description", aliases: ["buildingDesc"] },
  { key: "floorAreaSqm", label: "Floor Area (SQM)", aliases: ["floorArea"] },
  { key: "buildingHeight", label: "Height" },
  { key: "noOfStorey", label: "No. of Storey", aliases: ["storeyCount"] },
  { key: "highRise", label: "High Rise", placeholder: "YES / NO", required: false, type: "select", span: 1 },
  { key: "fsmr", label: "FSMR", placeholder: "FSMR", required: false, type: "select", span: 1 },

  { key: "remarks", label: "Remarks", placeholder: "Remarks", required: false, type: "select", span: 1 },
  { key: "orNumber", label: "OR No" },
  { key: "orAmount", label: "OR Amount" },
  { key: "orDate", label: "OR Date" },
  { key: "chiefName", label: "Chief" },
  { key: "chiefPosition", label: "Chief Position" },
  { key: "marshalName", label: "Marshal" },
];

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
  "fsicNo",
  "fsicValidity",
  "defects",
  "occupancyType",
  "buildingDescription",
  "floorAreaSqm",
  "buildingHeight",
  "noOfStorey",
  "highRise",
  "fsmr",
  "remarks",
  "orNumber",
  "orAmount",
  "chiefName",
  "marshalName",
]);

const NO_CAPS_KEYS = new Set([
  "teamLeader",
  "teamLeaderSerial",
  "inspector1",
  "inspector1Serial",
  "inspector2",
  "inspector2Serial",
  "inspector3",
  "inspector3Serial",
  "inspector4",
  "inspector4Serial",
  "inspector5",
  "inspector5Serial",
  "inspectors",
]);

const DATE_KEYS = new Set(["dateInspected", "ioDate", "nfsiDate", "ntcDate", "orDate"]);

const toInputDate = (v) => {
  if (!v) return "";
  if (v?.toDate) {
    const d = v.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
    const d = new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
};

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

const combineInspectors = (...names) =>
  names.map((x) => String(x || "").trim()).filter(Boolean).join(", ");

const readField = (record, key, aliases = []) => {
  const direct = record?.[key];
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") return direct;

  for (const a of aliases) {
    const v = record?.[a];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }

  return record?.[key] ?? "";
};

export default function RecordDetailsPanel({
  styles,
  record,
  source,
  isArchive,
  onRenewSaved,
  onUpdated,
}) {
  const navigate = useNavigate();

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

  const buildFormFromRecord = (src) => {
    if (!src) return {};

    const init = {};
    FIELDS.forEach((f) => {
      const raw = readField(src, f.key, f.aliases || []);
      init[f.key] = DATE_KEYS.has(f.key) ? toInputDate(raw) : raw;
    });

    if (init.dateInspected) {
      init.fsicValidity = addOneYear(init.dateInspected);
    }

    init.inspectors = combineInspectors(
      init.inspector1,
      init.inspector2,
      init.inspector3,
      init.inspector4,
      init.inspector5
    );

    return init;
  };

  const resetFormToRecord = () => {
    setForm(buildFormFromRecord(record));
  };

  useEffect(() => {
    setEditing(false);
    setRenewing(false);
    setSaving(false);
    setRenewedRecord(null);

    if (!record) return;

    setForm(buildFormFromRecord(record));

    if (!entityKey) return;
    getDoc(doc(db, "renewals", entityKey))
      .then((snap) => setRenewedRecord(snap.exists() ? snap.data()?.record || null : null))
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

  const setField = (k, v) => {
    setForm((p) => {
      const next = { ...p };

      if (NO_CAPS_KEYS.has(k)) {
        next[k] = String(v ?? "");
      } else {
        next[k] = CAPS_KEYS.has(k) ? String(v ?? "").toUpperCase() : String(v ?? "");
      }

      if (k === "dateInspected") {
        next.fsicValidity = addOneYear(String(v ?? ""));
      }

      if (
        k === "inspector1" ||
        k === "inspector2" ||
        k === "inspector3" ||
        k === "inspector4" ||
        k === "inspector5"
      ) {
        next.inspectors = combineInspectors(
          next.inspector1,
          next.inspector2,
          next.inspector3,
          next.inspector4,
          next.inspector5
        );
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

    if (variant === "primary") {
      return {
        ...common,
        border: `1px solid ${C.primary}`,
        background: C.primary,
        color: "#fff",
      };
    }

    if (variant === "gold") {
      return {
        ...common,
        border: `1px solid ${C.gold}`,
        background: C.gold,
        color: "#111827",
      };
    }

    if (variant === "danger") {
      return {
        ...common,
        border: `1px solid ${C.danger}`,
        background: C.softBg,
        color: C.danger,
      };
    }

    return {
      ...common,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
    };
  };

  const useAsTemplate = () => {
    if (!record) return;

    const prefill = {
      ...record,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      renewedAt: undefined,
      renewedFromId: undefined,
      isRenewedCopy: undefined,
      status: undefined,
      source: undefined,
      entityKey: undefined,

      occupancyType: record.occupancyType ?? record.typeOfOccupancy ?? "",
      buildingDesc: record.buildingDescription ?? record.buildingDesc ?? "",
      floorArea: record.floorAreaSqm ?? record.floorArea ?? "",
      storeyCount: record.noOfStorey ?? record.storeyCount ?? "",
    };

    navigate("/app/add-record", { state: { prefill } });
  };

  const saveEdit = async () => {
    if (!record?.id) return alert("Missing record.id (cannot save).");

    try {
      setSaving(true);

      const ensured = { ...form };

      if (ensured.dateInspected) {
        ensured.fsicValidity = addOneYear(ensured.dateInspected);
      }

      ensured.inspectors = combineInspectors(
        ensured.inspector1,
        ensured.inspector2,
        ensured.inspector3,
        ensured.inspector4,
        ensured.inspector5
      );

      const payload = {};
      FIELDS.forEach((f) => {
        payload[f.key] = ensured[f.key] ?? "";
      });

      payload.updatedAt = serverTimestamp();
      payload.typeOfOccupancy = payload.occupancyType;
      payload.buildingDesc = payload.buildingDescription;
      payload.floorArea = payload.floorAreaSqm;
      payload.storeyCount = payload.noOfStorey;

      const targetDocRef = isArchive
        ? doc(db, "archives", String(source || "").replace("Archive: ", ""), "records", record.id)
        : doc(db, "records", record.id);

      await setDoc(targetDocRef, payload, { merge: true });

      const updatedRecord = {
        ...record,
        ...payload,
        id: record.id,
        _editedAt: Date.now(),
      };

      setEditing(false);
      setForm(buildFormFromRecord(updatedRecord));
      onUpdated?.(updatedRecord);
    } catch (e) {
      alert(`❌ SAVE ERROR: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveRenew = async () => {
    if (!record) return;
    if (!entityKey) return alert("Missing entityKey");

    try {
      setSaving(true);

      const ensured = { ...form };

      if (ensured.dateInspected) {
        ensured.fsicValidity = addOneYear(ensured.dateInspected);
      }

      ensured.inspectors = combineInspectors(
        ensured.inspector1,
        ensured.inspector2,
        ensured.inspector3,
        ensured.inspector4,
        ensured.inspector5
      );

      const newRecord = {
        ...record,
        ...ensured,
        entityKey,
        source: source || "unknown",
        renewedFromId: record?.id || "",
        renewedAt: new Date().toISOString(),
        status: "RENEWED",
        isRenewedCopy: true,

        typeOfOccupancy: ensured.occupancyType,
        buildingDesc: ensured.buildingDescription,
        floorArea: ensured.floorAreaSqm,
        storeyCount: ensured.noOfStorey,
      };

      const newRecordRef = doc(collection(db, "records"));
      const renewalsRef = doc(db, "renewals", entityKey);

      const batch = writeBatch(db);

      batch.set(renewalsRef, { record: newRecord, updatedAt: serverTimestamp() }, { merge: true });

      batch.set(
        newRecordRef,
        {
          ...newRecord,
          id: newRecordRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      setRenewedRecord({ ...newRecord, id: newRecordRef.id });
      resetFormToRecord();
      setRenewing(false);

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

  const renderEditorField = (f) => {
    const commonProps = {
      name: f.key,
      value: form[f.key] ?? "",
      onChange: (e) => setField(f.key, e.target.value),
      style: {
        ...inputStyle(f.key),
        ...(f.key === "inspectors" ? { background: "#f3f4f6", cursor: "not-allowed" } : {}),
        ...(f.key === "fsicValidity" ? { background: "#f3f4f6", cursor: "not-allowed" } : {}),
      },
    };

    if (f.key === "inspectors" || f.key === "fsicValidity") {
      return (
        <input
          {...commonProps}
          autoComplete="off"
          placeholder={f.label}
          type={DATE_KEYS.has(f.key) ? "date" : "text"}
          readOnly
        />
      );
    }

    if (f.type === "select") {
      let options = [];

      if (f.key === "natureOfInspection") options = NATURE_SUGGESTIONS;
      if (f.key === "occupancyType") options = OCCUPANCY_OPTIONS;
      if (f.key === "highRise") options = HIGH_RISE_CHOICES;
      if (f.key === "fsmr") options = FSMR_CHOICES;
      if (f.key === "remarks") options = REMARKS_CHOICES;

      return (
        <select {...commonProps}>
          <option value="">{f.placeholder || `Select ${f.label}`}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...commonProps}
        autoComplete="off"
        placeholder={f.label}
        type={DATE_KEYS.has(f.key) ? "date" : "text"}
      />
    );
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

  const body = {
    flex: 1,
    overflowY: "auto",
    padding: 12,
  };

  const baseTd =
    styles?.td || {
      padding: "14px 12px",
      borderBottom: `1px solid ${C.border}`,
      fontWeight: 850,
      fontSize: 13,
      verticalAlign: "top",
    };

  const labelTd = {
    ...baseTd,
    fontWeight: 950,
    width: 160,
    color: C.primaryDark,
    background: "#fff",
  };

  const valueTd = {
    ...baseTd,
    color: C.text,
    background: "#fff",
  };

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

  const title = record.establishmentName || record.fsicAppNo || record.primaryId || "Record";
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
              <button
                style={btn("primary")}
                onClick={() => {
                  resetFormToRecord();
                  setEditing(true);
                }}
              >
                Edit
              </button>

              <button style={btn()} onClick={useAsTemplate}>
                Add this data
              </button>

              {isArchive && (
                <button
                  style={btn("gold")}
                  onClick={() => {
                    resetFormToRecord();
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
              <button
                style={btn("danger")}
                onClick={() => {
                  resetFormToRecord();
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}

          {mode === "renew" && (
            <>
              <button style={btn("gold")} onClick={saveRenew} disabled={saving}>
                {saving ? "Saving..." : "Save Renew"}
              </button>
              <button
                style={btn("danger")}
                onClick={() => {
                  resetFormToRecord();
                  setRenewing(false);
                }}
                disabled={saving}
              >
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
                      {mode === "edit" || mode === "renew"
                        ? renderEditorField(f)
                        : (readField(record, f.key, f.aliases || []) ?? "") || "-"}
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