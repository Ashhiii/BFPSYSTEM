import React, { useMemo, useRef, useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import TopRightToast from "../components/TopRightToast";
import AddTabs from "../components/AddTabs";

/** YYYY-MM-DD -> 2 January 2026 */
const formatDateLong = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyy_mm_dd);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${d} ${months[m - 1]} ${y}`;
};

/** YYYY-MM-DD -> YYYY-12-31 */
const getEndOfYearYMD = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return "";
  const [y, m, d] = String(yyyy_mm_dd).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${y}-12-31`;
};

const isYMD = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());

const TEMPLATE_OPTIONS = [
  { value: "CONVEYANCE", label: "Conveyance Tanker" },
  { value: "STORAGE", label: "Storage" },
  { value: "HOT_WORKS", label: "Hot Works" },
  { value: "FIRE_DRILL", label: "Fire Drill Certification" },
  { value: "FUMIGATION", label: "Fumigation" },
  { value: "SEMINAR", label: "Lecture" },
  { value: "FIRE_SAFETY", label: "Conveyance LPG" },
];

const HOTWORKS_MODE_OPTIONS = ["ANNUAL", "PROJECT BASED"];

const TEMPLATE_TYPE_TO_SLUG = {
  CONVEYANCE: "conveyance",
  STORAGE: "storage",
  HOT_WORKS: "hotworks",
  FIRE_DRILL: "firedrill",
  FUMIGATION: "fumigation",
  SEMINAR: "seminar",
  FIRE_SAFETY: "firesafety",
};

const INITIAL_FORM = {
  templateType: "CONVEYANCE",

  establishmentName: "",
  businessAddress: "",
  ownerName: "",

  chiefName: "",
  chiefPosition: "",
  marshalName: "",
  marshalPosition: "",

  orNumber: "",
  orAmount: "",
  orDate: "",

  clearanceDate: "",
  clearanceValidity: "",

  // CONVEYANCE
  vehicleType: "",
  motorNumber: "",
  driverName: "",
  trailerNumber: "",
  capacity: "",
  plateNumber: "",
  chassisNumber: "",
  licenseNumber: "",

  // STORAGE
  storageAddress: "",
  flammable1: "",
  capacity1: "",
  flammable2: "",
  capacity2: "",
  flammable3: "",
  capacity3: "",
  flammable4: "",
  capacity4: "",

  // HOT WORKS
  companyName: "",
  hotWorksMode: "",
  jobOrderNumber: "",
  natureOfJob: "",
  facilityAddress: "",
  permitAuthorizingIndividual: "",
  hotWorkOperator: "",
  fireWatchName: "",

  // FIRE DRILL
  fireDrillDate: "",
  issuedDay: "",
  issuedMonth: "",

  // FUMIGATION
  operatorName: "",
  operationDate: "",
  operationTime: "",
  operationDuration: "",
  foggingAddress: "",
  conductedBy: "",

  // LPG / CONVEYANCE (UPDATED)
vehicleType: "",
plateNumber: "",
brandOfVehicle: "",   // ✅ ADD
engineNumber: "",     // ✅ ADD
chassisNumber: "",
permitNumber: "",     // ✅ ADD
fsicIssued: "",       // ✅ ADD
cageSize: "",         // ✅ ADD

// Optional (keep if needed)
driverName: "",
licenseNumber: "",
capacity: "",
};

const UPPER_KEYS = new Set([
  "templateType",
  "establishmentName",
  "businessAddress",
  "ownerName",
  "chiefName",
  "chiefPosition",
  "marshalName",
  "marshalPosition",
  "orNumber",

  "vehicleType",
  "motorNumber",
  "driverName",
  "trailerNumber",
  "capacity",
  "plateNumber",
  "chassisNumber",
  "licenseNumber",

  "storageAddress",
  "flammable1",
  "capacity1",
  "flammable2",
  "capacity2",
  "flammable3",
  "capacity3",
  "flammable4",
  "capacity4",

  "companyName",
  "hotWorksMode",
  "jobOrderNumber",
  "natureOfJob",
  "facilityAddress",
  "permitAuthorizingIndividual",
  "hotWorkOperator",
  "fireWatchName",

  "issuedMonth",

  "operatorName",
  "operationTime",
  "operationDuration",
  "foggingAddress",
  "conductedBy",
]);

const COMMON_FIELDS = [
  {
    key: "templateType",
    label: "Template Type",
    type: "select",
    required: true,
    span: 2,
  },
  {
    key: "clearanceDate",
    label: "Activity Date",
    type: "date",
    required: false,
    span: 1,
  },
  {
    key: "clearanceValidity",
    label: "Activity Validity",
    type: "text",
    required: false,
    span: 2,
    readOnly: true,
    placeholder: "Auto generated validity",
  },

  {
    key: "establishmentName",
    label: "Building / Facility Name",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Name of building/facility",
  },
  {
    key: "ownerName",
    label: "Owner Name",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Owner name",
  },
  {
    key: "businessAddress",
    label: "Address",
    type: "text",
    required: true,
    span: 2,
    placeholder: "Full address",
  },

  {
    key: "orNumber",
    label: "OR Number",
    type: "text",
    required: false,
    span: 1,
    placeholder: "Official receipt number",
  },
  {
    key: "orAmount",
    label: "OR Amount",
    type: "number",
    required: false,
    span: 1,
    placeholder: "0.00",
  },
  {
    key: "orDate",
    label: "OR Date",
    type: "date",
    required: false,
    span: 2,
  },

  {
    key: "chiefName",
    label: "Chief, FSES",
    type: "text",
    required: false,
    span: 1,
    placeholder: "Chief name",
  },
  {
    key: "marshalName",
    label: "DFM",
    type: "text",
    required: false,
    span: 1,
    placeholder: "Fire marshal name",
  },
  {
    key: "chiefPosition",
    label: "Chief Position",
    type: "text",
    required: false,
    span: 1,
    placeholder: "CHIEF, FSES",
  },
  {
    key: "marshalPosition",
    label: "Marshal Position",
    type: "text",
    required: false,
    span: 1,
    placeholder: "FIRE MARSHAL",
  },
];

const TEMPLATE_FIELDS = {
  CONVEYANCE: [
    {
      key: "vehicleType",
      label: "Type of Vehicle",
      type: "text",
      required: true,
      span: 1,
      placeholder: "Example: TANKER TRUCK",
    },
    {
      key: "motorNumber",
      label: "Motor Number",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Motor number",
    },
    {
      key: "driverName",
      label: "Name of Driver",
      type: "text",
      required: true,
      span: 1,
      placeholder: "Driver name",
    },
    {
      key: "trailerNumber",
      label: "Trailer Number",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Trailer number",
    },
    {
      key: "capacity",
      label: "Capacity",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 5000 L",
    },
    {
      key: "plateNumber",
      label: "Plate Number",
      type: "text",
      required: true,
      span: 1,
      placeholder: "Example: ABC 1234",
    },
    {
      key: "chassisNumber",
      label: "Chassis Number",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Chassis number",
    },
    {
      key: "licenseNumber",
      label: "License Number",
      type: "text",
      required: false,
      span: 1,
      placeholder: "License number",
    },
  ],

  STORAGE: [
    {
      key: "storageAddress",
      label: "Storage Address",
      type: "text",
      required: true,
      span: 2,
      placeholder: "Location where liquids will be stored",
    },
    {
      key: "flammable1",
      label: "Flammable / Combustible Liquid 1",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: DIESEL",
    },
    {
      key: "capacity1",
      label: "Capacity 1",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 2000 L",
    },
    {
      key: "flammable2",
      label: "Flammable / Combustible Liquid 2",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: GASOLINE",
    },
    {
      key: "capacity2",
      label: "Capacity 2",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 1500 L",
    },
    {
      key: "flammable3",
      label: "Flammable / Combustible Liquid 3",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: KEROSENE",
    },
    {
      key: "capacity3",
      label: "Capacity 3",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 500 L",
    },
    {
      key: "flammable4",
      label: "Flammable / Combustible Liquid 4",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: PAINT THINNER",
    },
    {
      key: "capacity4",
      label: "Capacity 4",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 100 L",
    },
  ],

  HOT_WORKS: [
    {
      key: "companyName",
      label: "Installer / Company",
      type: "text",
      required: true,
      span: 1,
      placeholder: "Company name",
    },
    {
      key: "hotWorksMode",
      label: "Mode",
      type: "select",
      required: true,
      span: 1,
      options: HOTWORKS_MODE_OPTIONS,
    },
    {
      key: "jobOrderNumber",
      label: "Job Order No. / Letter Request",
      type: "text",
      required: false,
      span: 2,
      placeholder: "For project based only",
    },
    {
      key: "natureOfJob",
      label: "Nature of Job / Object",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Nature of work",
    },
    {
      key: "facilityAddress",
      label: "Building / Structure / Facility Address",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Work site address",
    },
    {
      key: "permitAuthorizingIndividual",
      label: "Permit Authorizing Individual (PAI)",
      type: "text",
      required: false,
      span: 1,
      placeholder: "PAI name",
    },
    {
      key: "hotWorkOperator",
      label: "Hot Work Operator / Contractor",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Operator / contractor",
    },
    {
      key: "fireWatchName",
      label: "Fire Watch / Watchmen",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Fire watch / watchmen",
    },
  ],

  FIRE_DRILL: [
    {
      key: "fireDrillDate",
      label: "Fire Drill Date",
      type: "date",
      required: true,
      span: 1,
    },
    {
      key: "issuedDay",
      label: "Issued Day",
      type: "number",
      required: false,
      span: 1,
      placeholder: "Example: 12",
    },
    {
      key: "issuedMonth",
      label: "Issued Month",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Example: MARCH",
    },
  ],

  FUMIGATION: [
    {
      key: "operatorName",
      label: "Authorized Operator / Contractor",
      type: "text",
      required: true,
      span: 1,
      placeholder: "Operator name",
    },
    {
      key: "operationDate",
      label: "Operation Date",
      type: "date",
      required: false,
      span: 1,
    },
    {
      key: "operationTime",
      label: "Operation Time",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 8:00 AM - 12:00 PM",
    },
    {
      key: "operationDuration",
      label: "Duration of Operation",
      type: "text",
      required: false,
      span: 1,
      placeholder: "Example: 4 HOURS",
    },
    {
      key: "foggingAddress",
      label: "Fogging Address",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Address of fogging operation",
    },
    {
      key: "conductedBy",
      label: "Conducted By",
      type: "text",
      required: false,
      span: 2,
      placeholder: "Person / company who conducted the operation",
    },
  ],

FIRE_SAFETY: [
  {
    key: "vehicleType",
    label: "Type of Vehicle",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Example: Motorcycle / Tricycle",
  },
  {
    key: "plateNumber",
    label: "Plate Number",
    type: "text",
    required: true,
    span: 1,
    placeholder: "ABC 1234",
  },
  {
    key: "brandOfVehicle",
    label: "Brand of Vehicle",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Example: Honda",
  },
  {
    key: "engineNumber",
    label: "Engine Number",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Engine number",
  },
  {
    key: "chassisNumber",
    label: "Chassis Number",
    type: "text",
    required: true,
    span: 1,
    placeholder: "Chassis number",
  },
  {
    key: "permitNumber",
    label: "Mayor’s Permit Number",
    type: "text",
    required: false,
    span: 1,
  },
  {
    key: "fsicIssued",
    label: "FSIC No. & Date Issued",
    type: "text",
    required: false,
    span: 1,
  },
  {
    key: "cageSize",
    label: "Cage Size",
    type: "text",
    required: false,
    span: 1,
    placeholder: "Size of LPG cage",
  },
],

  SEMINAR: [
  {
    key: "fireDrillDate",
    label: "Date Conducted",
    type: "date",
    required: true,
    span: 1,
  },
  {
    key: "issuedDay",
    label: "Issued Day",
    type: "number",
    required: false,
    span: 1,
    placeholder: "Example: 12",
  },
  {
    key: "issuedMonth",
    label: "Issued Month",
    type: "text",
    required: false,
    span: 2,
    placeholder: "Example: March",
  },
]
};

export default function AddClearance({
  editingClearance = null,
  onSaved,
  onCancel,
  setRefresh,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [toastOpen, setToastOpen] = useState(false);

  const topRef = useRef(null);

  const scrollToTop = () => {
    if (topRef.current?.scrollIntoView) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!editingClearance) {
      setForm(INITIAL_FORM);
      setTouched({});
      return;
    }

    const typeMap = {
      conveyance: "CONVEYANCE",
      storage: "STORAGE",
      hotworks: "HOT_WORKS",
      firedrill: "FIRE_DRILL",
      fumigation: "FUMIGATION",
      seminar: "SEMINAR",
      firesafety: "FIRE_SAFETY",
    };

    const nextTemplateType =
      editingClearance.templateType ||
      typeMap[String(editingClearance.type || editingClearance.clearanceType || "").toLowerCase()] ||
      "CONVEYANCE";

    const rawClearanceDate =
      editingClearance.clearanceDateRaw ||
      editingClearance.clearanceDateYMD ||
      (isYMD(editingClearance.clearanceDate) ? editingClearance.clearanceDate : "") ||
      "";

    let computedValidity =
      editingClearance.clearanceValidity || editingClearance.validUntil || "";

    if (rawClearanceDate) {
      if (nextTemplateType === "FUMIGATION") {
        computedValidity = formatDateLong(rawClearanceDate);
      } else {
        const validityYMD = getEndOfYearYMD(rawClearanceDate);
        computedValidity = validityYMD ? formatDateLong(validityYMD) : "";
      }
    }

    setForm({
      ...INITIAL_FORM,
      ...editingClearance,
      templateType: nextTemplateType,
      clearanceDate: rawClearanceDate,
      vehicleType: editingClearance.vehicleType || editingClearance.typeOfVehicle || "",
      driverName: editingClearance.driverName || editingClearance.nameOfDriver || "",
      hotWorkOperator: editingClearance.hotWorkOperator || editingClearance.hotworkOperator || "",
      fireWatchName: editingClearance.fireWatchName || editingClearance.fireWatch || "",
      fireDrillDate: editingClearance.fireDrillDate || editingClearance.dateConducted || "",
      clearanceValidity: computedValidity,
      foggingAddress:
        editingClearance.foggingAddress || editingClearance.fogging_address || "",
      conductedBy:
        editingClearance.conductedBy || editingClearance.conducted_by || "",
    });
    setTouched({});
  }, [editingClearance]);

  const activeTemplateFields = useMemo(() => {
    return TEMPLATE_FIELDS[form.templateType] || [];
  }, [form.templateType]);

  const visibleFields = useMemo(() => {
    return [...COMMON_FIELDS, ...activeTemplateFields];
  }, [activeTemplateFields]);

  const requiredKeys = useMemo(() => {
    return visibleFields.filter((f) => f.required).map((f) => f.key);
  }, [visibleFields]);

  const missingRequired = useMemo(() => {
    const miss = {};
    for (const k of requiredKeys) {
      const v = (form[k] ?? "").toString().trim();
      if (!v) miss[k] = true;
    }
    return miss;
  }, [form, requiredKeys]);

  const styles = {
    wrap: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 14,
      paddingBottom: 30,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: 950,
      color: "#0f172a",
      textTransform: "uppercase",
    },
    sub: {
      fontSize: 12,
      fontWeight: 700,
      color: "#64748b",
      marginTop: 6,
    },
    grid: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
    },
    card: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: 14,
    },
    cardTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: 900,
      color: "#0f172a",
      textTransform: "uppercase",
    },
    reqPill: {
      fontSize: 11,
      fontWeight: 900,
      color: "#dc2626",
      background: "#fff1f2",
      border: "1px solid #fecdd3",
      padding: "4px 10px",
      borderRadius: 999,
      lineHeight: 1,
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #cbd5e1",
      outline: "none",
      fontSize: 13,
      fontWeight: 800,
      background: "#fff",
      boxSizing: "border-box",
      textTransform: "none",
    },
    footerBar: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    },
    footerLeft: {
      marginRight: "auto",
      fontSize: 12,
      fontWeight: 800,
      color: "#64748b",
    },
    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 950,
    },
    primary: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 950,
    },
    cancel: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
      color: "#0f172a",
      cursor: "pointer",
      fontWeight: 950,
    },
  };

  const handleBlur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "templateType") {
      setForm((prev) => {
        let nextValidity = prev.clearanceValidity || "";

        if (value === "FUMIGATION") {
          nextValidity = prev.clearanceDate ? formatDateLong(prev.clearanceDate) : "";
        } else {
          const validityYMD = getEndOfYearYMD(prev.clearanceDate);
          nextValidity = validityYMD ? formatDateLong(validityYMD) : "";
        }

        return {
          ...prev,
          templateType: value,
          clearanceValidity: nextValidity,
        };
      });
      return;
    }

    if (name === "clearanceDate") {
      setForm((prev) => {
        let validityText = "";

        if (prev.templateType === "FUMIGATION") {
          validityText = value ? formatDateLong(value) : "";
        } else {
          const validityYMD = getEndOfYearYMD(value);
          validityText = validityYMD ? formatDateLong(validityYMD) : "";
        }

        return {
          ...prev,
          clearanceDate: value,
          clearanceValidity: validityText,
        };
      });
      return;
    }

    const nextValue = UPPER_KEYS.has(name)
      ? String(value ?? "").toUpperCase()
      : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setTouched({});
    scrollToTop();
  };

  const buildPayload = (state) => {
    const typeSlug = TEMPLATE_TYPE_TO_SLUG[state.templateType] || "conveyance";
    const templateLabel =
      TEMPLATE_OPTIONS.find((item) => item.value === state.templateType)?.label || "";

    const clearanceDateLong = formatDateLong(state.clearanceDate);
    const orDateLong = formatDateLong(state.orDate);
    const fireDrillDateLong = formatDateLong(state.fireDrillDate);
    const operationDateLong = formatDateLong(state.operationDate);

    return {
      ...state,

      type: typeSlug,
      clearanceType: typeSlug,
      templateLabel,

      clearanceDateRaw: state.clearanceDate || "",
      clearanceDateYMD: state.clearanceDate || "",
      clearanceDate: clearanceDateLong,
      clearanceValidity: state.clearanceValidity || "",
      validUntil: state.clearanceValidity || "",

      orDate: orDateLong,

      typeOfVehicle: state.vehicleType || "",
      vehicleType: state.vehicleType || "",
      motorNumber: state.motorNumber || "",
      nameOfDriver: state.driverName || "",
      driverName: state.driverName || "",
      trailerNumber: state.trailerNumber || "",
      capacity: state.capacity || "",
      plateNumber: state.plateNumber || "",
      chassisNumber: state.chassisNumber || "",
      licenseNumber: state.licenseNumber || "",

      fireWatch: state.fireWatchName || "",
      fireWatchName: state.fireWatchName || "",
      hotworkOperator: state.hotWorkOperator || "",
      hotWorkOperator: state.hotWorkOperator || "",

      fireDrillDate: fireDrillDateLong,
      dateConducted: fireDrillDateLong,
      issuedDay: state.issuedDay || "",
      issuedMonth: state.issuedMonth || "",

      operationDate: operationDateLong,
      operationDuration: state.operationDuration || "",
      foggingAddress: state.foggingAddress || "",
      fogging_address: state.foggingAddress || "",
      conductedBy: state.conductedBy || "",
      conducted_by: state.conductedBy || "",

      brandOfVehicle: state.brandOfVehicle || "",
engineNumber: state.engineNumber || "",
permitNumber: state.permitNumber || "",
fsicIssued: state.fsicIssued || "",
cageSize: state.cageSize || "",

orNumber: state.orNumber || "",
orAmount: state.orAmount || state.amountPaid || "",
amountPaid: state.amountPaid || state.orAmount || "",

      updatedAt: serverTimestamp(),
      ...(editingClearance
        ? {}
        : {
            createdAt: serverTimestamp(),
          }),
    };
  };

  const submit = async () => {
    if (requiredKeys.some((k) => !(form[k] ?? "").toString().trim())) {
      const nextTouched = {};
      requiredKeys.forEach((k) => {
        nextTouched[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...nextTouched }));
      scrollToTop();
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form);

      if (editingClearance?.id) {
        await updateDoc(doc(db, "clearances", editingClearance.id), payload);
      } else {
        await addDoc(collection(db, "clearances"), payload);
      }

      setToastOpen(true);
      setRefresh?.((prev) => !prev);

      if (editingClearance) {
        onSaved?.();
      } else {
        setForm(INITIAL_FORM);
        setTouched({});
        scrollToTop();
        onSaved?.();
      }
    } catch (err) {
      console.error(err);
      alert("Firestore error. Check rules / permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={styles.wrap}>
        <div ref={topRef} />

        <AddTabs />

        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>
              {editingClearance ? "Edit Clearance" : "Add Clearance"}
            </div>
            <div style={styles.sub}>
              {form.templateType === "FUMIGATION"
                ? "For fumigation, Activity Validity is the same as the Activity Date."
                : "Validity is automatically set to 31 December of the selected clearance year."}
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {visibleFields.map((f) => {
            const showError = f.required && touched[f.key] && missingRequired[f.key];
            const isReadOnly = !!f.readOnly;

            return (
              <div
                key={f.key}
                style={{
                  ...styles.card,
                  gridColumn: f.span === 2 ? "1 / -1" : "auto",
                  border: showError ? "1px solid #fecdd3" : styles.card.border,
                }}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardLabel}>{f.label}</div>
                  {f.required && <div style={styles.reqPill}>Required</div>}
                </div>

                {f.type === "select" ? (
                  <select
                    name={f.key}
                    value={form[f.key] ?? ""}
                    onChange={handleChange}
                    onBlur={() => handleBlur(f.key)}
                    style={{
                      ...styles.input,
                      border: showError ? "1px solid #dc2626" : styles.input.border,
                      textTransform: UPPER_KEYS.has(f.key) ? "uppercase" : "none",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {f.key === "templateType" &&
                      TEMPLATE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}

                    {f.key !== "templateType" &&
                      (f.options || []).map((opt) => (
                        <option key={`${f.key}-${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    name={f.key}
                    value={form[f.key] ?? ""}
                    onChange={handleChange}
                    onBlur={() => handleBlur(f.key)}
                    type={f.type || "text"}
                    placeholder={f.placeholder || ""}
                    autoComplete="off"
                    readOnly={isReadOnly}
                    style={{
                      ...styles.input,
                      border: showError ? "1px solid #dc2626" : styles.input.border,
                      textTransform:
                        f.type === "date"
                          ? "none"
                          : UPPER_KEYS.has(f.key)
                          ? "uppercase"
                          : "none",
                      background: isReadOnly ? "#f1f5f9" : "#fff",
                      cursor: isReadOnly ? "not-allowed" : "text",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.footerBar}>
          <div style={styles.footerLeft}>
            {Object.keys(missingRequired).length > 0
              ? "Please fill required fields before saving."
              : "Ready to save."}
          </div>

          <button style={styles.btn} onClick={resetForm} disabled={saving}>
            Clear
          </button>

          {editingClearance && (
            <button style={styles.cancel} onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          )}

          <button style={styles.primary} onClick={submit} disabled={saving}>
            {saving
              ? editingClearance
                ? "Updating..."
                : "Saving..."
              : editingClearance
              ? "Update Clearance"
              : "Save Clearance"}
          </button>
        </div>
      </div>

      <TopRightToast
        C={{
          border: "rgba(226,232,240,1)",
          text: "#0f172a",
          muted: "#64748b",
        }}
        open={toastOpen}
        title={editingClearance ? "Updated Clearance" : "Added to Clearances"}
        message={
          editingClearance
            ? "Clearance updated successfully."
            : "Clearance saved successfully."
        }
        autoCloseMs={1600}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}