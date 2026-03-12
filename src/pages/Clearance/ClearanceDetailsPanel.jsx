import React, { useEffect, useMemo, useState } from "react";

const FIELDS = [
  { key: "type", label: "Type" },
  { key: "recordId", label: "Record ID" },
  { key: "FSIC_NUMBER", label: "FSIC Number" },
  { key: "FSIC_APP_NO", label: "FSIC App No." },
  { key: "ownerName", label: "Owner Name" },
  { key: "establishmentName", label: "Establishment Name" },
  { key: "businessAddress", label: "Business Address" },
  { key: "contactNumber", label: "Contact Number" },
  { key: "orNumber", label: "OR Number" },
  { key: "orAmount", label: "OR Amount" },
  { key: "orDate", label: "OR Date" },
  { key: "chiefName", label: "Chief Name" },
  { key: "chiefPosition", label: "Chief Position" },
  { key: "marshalName", label: "Marshal Name" },
  { key: "amountPaid", label: "Amount Paid" },
  { key: "validUntil", label: "Valid Until" },

  { key: "plateNumber", label: "Plate Number", types: ["conveyance"] },
  { key: "typeOfVehicle", label: "Type of Vehicle", types: ["conveyance"] },
  { key: "chassisNumber", label: "Chassis Number", types: ["conveyance"] },
  { key: "motorNumber", label: "Motor Number", types: ["conveyance"] },
  { key: "licenseNumber", label: "License Number", types: ["conveyance"] },
  { key: "nameOfDriver", label: "Driver Name", types: ["conveyance"] },
  { key: "trailerNumber", label: "Trailer Number", types: ["conveyance"] },
  { key: "capacity", label: "Capacity", types: ["conveyance"] },

  { key: "flammable1", label: "Flammable 1", types: ["storage"] },
  { key: "capacity1", label: "Capacity 1", types: ["storage"] },
  { key: "flammable2", label: "Flammable 2", types: ["storage"] },
  { key: "capacity2", label: "Capacity 2", types: ["storage"] },
  { key: "flammable3", label: "Flammable 3", types: ["storage"] },
  { key: "capacity3", label: "Capacity 3", types: ["storage"] },
  { key: "flammable4", label: "Flammable 4", types: ["storage"] },
  { key: "capacity4", label: "Capacity 4", types: ["storage"] },

  { key: "companyName", label: "Company Name", types: ["hotworks"] },
  { key: "jobOrderNumber", label: "Job Order Number", types: ["hotworks"] },
  { key: "natureOfJob", label: "Nature of Job", types: ["hotworks"] },
  {
    key: "permitAuthorizingIndividual",
    label: "Permit Authorizing Individual",
    types: ["hotworks"],
  },
  { key: "hotworkOperator", label: "Hotwork Operator", types: ["hotworks"] },
  { key: "fireWatch", label: "Fire Watch", types: ["hotworks"] },

  { key: "dateConducted", label: "Date Conducted", types: ["firedrill"] },

  { key: "operatorName", label: "Operator Name", types: ["fumigation"] },
  { key: "operationTime", label: "Operation Time", types: ["fumigation"] },
  { key: "operationDate", label: "Operation Date", types: ["fumigation"] },
];

const CAPS_KEYS = new Set([
  "recordId",
  "FSIC_NUMBER",
  "FSIC_APP_NO",
  "ownerName",
  "establishmentName",
  "businessAddress",
  "contactNumber",
  "orNumber",
  "orAmount",
  "chiefName",
  "chiefPosition",
  "marshalName",
  "amountPaid",
  "validUntil",
  "plateNumber",
  "typeOfVehicle",
  "chassisNumber",
  "motorNumber",
  "licenseNumber",
  "nameOfDriver",
  "trailerNumber",
  "capacity",
  "flammable1",
  "capacity1",
  "flammable2",
  "capacity2",
  "flammable3",
  "capacity3",
  "flammable4",
  "capacity4",
  "companyName",
  "jobOrderNumber",
  "natureOfJob",
  "permitAuthorizingIndividual",
  "hotworkOperator",
  "fireWatch",
  "operatorName",
]);

const DATE_KEYS = new Set([
  "orDate",
  "validUntil",
  "dateConducted",
  "operationDate",
]);

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

export default function ClearanceDetailsPanel({
  styles,
  clearance,
  source = "Clearances",
  onEdit,
  onDelete,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const C = {
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    gold: "#f59e0b",
    softBg: "#fef2f2",
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    danger: "#dc2626",
  };

  const formatType = (type) => {
    const map = {
      conveyance: "Conveyance",
      storage: "Storage",
      hotworks: "Hot Works",
      firedrill: "Fire Drill",
      fumigation: "Fumigation",
    };
    return map[String(type || "").toLowerCase()] || type || "-";
  };

  const activeType = useMemo(
    () => String(clearance?.type || clearance?.clearanceType || "").toLowerCase(),
    [clearance]
  );

  const visibleFields = useMemo(() => {
    return FIELDS.filter((f) => !f.types || f.types.includes(activeType));
  }, [activeType]);

  useEffect(() => {
    setEditing(false);

    if (!clearance) {
      setForm({});
      return;
    }

    const init = {};
    visibleFields.forEach((f) => {
      let raw = clearance?.[f.key] ?? "";
      if (f.key === "type") raw = clearance?.type || clearance?.clearanceType || "";
      init[f.key] = DATE_KEYS.has(f.key) ? toInputDate(raw) : raw;
    });

    setForm(init);
  }, [clearance, visibleFields]);

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
    textTransform: CAPS_KEYS.has(k) ? "uppercase" : "none",
  });

  const setField = (k, v) => {
    setForm((prev) => ({
      ...prev,
      [k]: CAPS_KEYS.has(k) ? String(v ?? "").toUpperCase() : String(v ?? ""),
    }));
  };

  const btn = (variant) => {
    const common = {
      padding: "10px 12px",
      borderRadius: 12,
      fontWeight: 950,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };

    if (variant === "primary") {
      return {
        ...common,
        border: `1px solid ${C.primary}`,
        background: C.primary,
        color: "#fff",
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

    if (variant === "gold") {
      return {
        ...common,
        border: `1px solid ${C.gold}`,
        background: C.gold,
        color: "#111827",
      };
    }

    return {
      ...common,
      border: `1px solid ${C.border}`,
      background: "#fff",
      color: C.text,
    };
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

  if (!clearance) {
    return (
      <div style={panel}>
        <div style={head}>
          <b style={{ color: C.primaryDark }}>Details</b>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>
            {source}
          </span>
        </div>
        <div style={{ padding: 14, color: C.muted, fontWeight: 800 }}>
          Click a row to show details here.
        </div>
      </div>
    );
  }

  const title =
    clearance.establishmentName ||
    clearance.ownerName ||
    clearance.FSIC_APP_NO ||
    "Clearance";

  return (
    <div style={panel}>
      <div style={head}>
        <div>
          <div style={{ fontWeight: 950, color: C.primaryDark }}>{title}</div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            {source} • {formatType(activeType)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!editing ? (
            <>
              <button style={btn("primary")} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button
                style={btn("danger")}
                onClick={() => onDelete?.(clearance.id)}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                style={btn("gold")}
                onClick={() => {
                  const updated = {
                    ...clearance,
                    ...form,
                    type: activeType,
                  };
                  setEditing(false);
                  onUpdated?.(updated);
                  onEdit?.(updated);
                }}
              >
                Save
              </button>
              <button
                style={btn("danger")}
                onClick={() => {
                  setEditing(false);
                  const reset = {};
                  visibleFields.forEach((f) => {
                    let raw = clearance?.[f.key] ?? "";
                    if (f.key === "type") {
                      raw = clearance?.type || clearance?.clearanceType || "";
                    }
                    reset[f.key] = DATE_KEYS.has(f.key) ? toInputDate(raw) : raw;
                  });
                  setForm(reset);
                }}
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
            {visibleFields
              .reduce((rows, field, index) => {
                if (index % 2 === 0) rows.push([field]);
                else rows[rows.length - 1].push(field);
                return rows;
              }, [])
              .map((pair, rowIndex) => (
                <tr key={rowIndex}>
                  {pair.map((f) => (
                    <React.Fragment key={f.key}>
                      <td style={labelTd}>{f.label}</td>
                      <td style={valueTd}>
                        {editing ? (
                          f.key === "type" ? (
                            <input
                              value={formatType(activeType)}
                              readOnly
                              style={{
                                ...inputStyle(f.key),
                                background: "#f3f4f6",
                                cursor: "not-allowed",
                                textTransform: "none",
                              }}
                            />
                          ) : (
                            <input
                              name={f.key}
                              value={form[f.key] ?? ""}
                              onChange={(e) => setField(f.key, e.target.value)}
                              style={inputStyle(f.key)}
                              autoComplete="off"
                              placeholder={f.label}
                              type={DATE_KEYS.has(f.key) ? "date" : "text"}
                            />
                          )
                        ) : f.key === "type" ? (
                          formatType(activeType)
                        ) : (
                          clearance?.[f.key] || "-"
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
      </div>
    </div>
  );
}