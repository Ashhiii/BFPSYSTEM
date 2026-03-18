import React, { useMemo, useState, useEffect, useCallback } from "react";

export default function PrintSelectionModal({
  open,
  onClose,
  onPrint,
  records = [],
  apiBase,
  C,
}) {
  const API = (import.meta.env.VITE_API_URL || apiBase || "http://localhost:5000").replace(/\/+$/, "");

  const [template, setTemplate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [printing, setPrinting] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!open) {
      setTemplate("");
      setSearch("");
      setSelectedIds([]);
      setPrinting(false);
      setDialog({ open: false, title: "", message: "" });
    }
  }, [open]);

  const showDialog = (title, message) => {
    setDialog({
      open: true,
      title,
      message,
    });
  };

  const closeDialog = () => {
    setDialog({ open: false, title: "", message: "" });
  };

  const normalizeText = useCallback((value) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\n\r\t]+/g, " ")
      .replace(/[_/\\|,-]+/g, " ")
      .replace(/[^a-z0-9\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const getSearchLines = useCallback(
    (value) => {
      return String(value || "")
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
    },
    [normalizeText]
  );

  const tokenizeSearch = useCallback(
    (value) => {
      return normalizeText(value)
        .split(" ")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item.length >= 2);
    },
    [normalizeText]
  );

  const getRecordSearchBlob = useCallback(
    (record) => {
      return normalizeText(
        [
          record.fsicAppNo,
          record.establishmentName,
          record.ownerName,
          record.fsicNo,
          record.ioNumber,
          record.natureOfInspection,
          record.address,
          record.barangay,
          record.contactNumber,
          record.businessName,
        ].join(" ")
      );
    },
    [normalizeText]
  );

  const matchesSinglePhrase = useCallback(
    (record, phrase) => {
      const q = normalizeText(phrase);
      if (!q) return true;

      const blob = getRecordSearchBlob(record);
      if (!blob) return false;

      // Exact phrase / direct contains first
      if (blob.includes(q)) return true;

      // Fallback only for single typed query, but STRICT:
      // all tokens in the phrase must exist in the record
      const tokens = tokenizeSearch(q);
      if (!tokens.length) return false;

      return tokens.every((token) => blob.includes(token));
    },
    [normalizeText, getRecordSearchBlob, tokenizeSearch]
  );

  const matchesRecord = useCallback(
    (record, rawSearch) => {
      const raw = String(rawSearch || "").trim();
      if (!raw) return true;

      const lines = getSearchLines(raw);

      // If pasted multiple lines:
      // row matches if ANY one complete line matches
      if (lines.length > 1) {
        return lines.some((line) => matchesSinglePhrase(record, line));
      }

      // Single line search
      return matchesSinglePhrase(record, raw);
    },
    [getSearchLines, matchesSinglePhrase]
  );

  const options = useMemo(
    () => [
      { value: "owner", label: "Renew Owner PDF" },
      { value: "bfp", label: "Renew BFP PDF" },
      { value: "owner-new", label: "New Owner PDF" },
      { value: "bfp-new", label: "New BFP PDF" },
      { value: "io", label: "IO PDF" },
      { value: "reinspection", label: "Reinspection PDF" },
      { value: "nfsi", label: "NFSI PDF" },
    ],
    []
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => matchesRecord(record, search));
  }, [records, search, matchesRecord]);

  const selectedRecords = useMemo(() => {
    return records.filter((r) => selectedIds.includes(String(r.id)));
  }, [records, selectedIds]);

  const allVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(String(r.id)));

  const toggleOne = (id) => {
    const sid = String(id);
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredRecords.map((r) => String(r.id));

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handlePrint = async () => {
    if (!selectedRecords.length) {
      showDialog("No Records Selected", "Please select at least one record to print.");
      return;
    }

    if (!template) {
      showDialog("No Template Selected", "Please choose a certificate template before printing.");
      return;
    }

    setPrinting(true);
    try {
      await onPrint?.({
        selectedIds,
        template,
        apiBase: API,
      });

      setTemplate("");
      setSearch("");
      setSelectedIds([]);
    } catch (err) {
      console.error("Print modal error:", err);
      showDialog(
        "Printing Failed",
        "Something went wrong while printing. Please check the server, PDF endpoint, or browser print permissions."
      );
    } finally {
      setPrinting(false);
    }
  };

  const handleClose = () => {
    if (printing) return;
    setTemplate("");
    setSearch("");
    setSelectedIds([]);
    setDialog({ open: false, title: "", message: "" });
    onClose?.();
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,24,39,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 860,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 25px 60px rgba(0,0,0,.22)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: 18,
              background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              Print Certificates
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                opacity: 0.92,
                fontWeight: 700,
              }}
            >
              Select records and template for printing
            </div>
          </div>

          <div style={{ padding: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 240px",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Search records
                </div>

                <textarea
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Paste owner, establishment, FSIC, IO... one per line"
                  rows={5}
                  style={{
                    width: "90%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontWeight: 700,
                    color: "#111827",
                    background: "#fff",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Choose template
                </div>

                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  disabled={printing}
                  style={{
                    width: "100%",
                    padding: "8px 15px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontWeight: 800,
                    color: "#111827",
                    background: "#fff",
                    cursor: printing ? "not-allowed" : "pointer",
                    opacity: printing ? 0.7 : 1,
                  }}
                >
                  <option value="">Select template</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  disabled={printing}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#111827",
                    fontWeight: 900,
                    cursor: printing ? "not-allowed" : "pointer",
                    opacity: printing ? 0.7 : 1,
                  }}
                >
                  {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={printing}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#111827",
                    fontWeight: 900,
                    cursor: printing ? "not-allowed" : "pointer",
                    opacity: printing ? 0.7 : 1,
                  }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ fontSize: 13, fontWeight: 900, color: "#6b7280" }}>
                Showing: {filteredRecords.length} | Selected: {selectedRecords.length}
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1.1fr 1.2fr 1fr",
                  padding: "12px 14px",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#374151",
                }}
              >
                <div>Select</div>
                <div>FSIC App No</div>
                <div>Establishment</div>
                <div>Owner</div>
              </div>

              <div style={{ maxHeight: 340, overflow: "auto" }}>
                {filteredRecords.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#6b7280",
                    }}
                  >
                    No records found.
                  </div>
                ) : (
                  filteredRecords.map((r, i) => {
                    const checked = selectedIds.includes(String(r.id));

                    return (
                      <label
                        key={r.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "56px 1.1fr 1.2fr 1fr",
                          padding: "12px 14px",
                          borderBottom:
                            i === filteredRecords.length - 1
                              ? "none"
                              : "1px solid #f1f5f9",
                          cursor: printing ? "not-allowed" : "pointer",
                          background: checked ? "#fef2f2" : "#fff",
                          alignItems: "center",
                          opacity: printing ? 0.75 : 1,
                        }}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={printing}
                            onChange={() => toggleOne(r.id)}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#111827",
                            paddingRight: 10,
                          }}
                        >
                          {r.fsicAppNo || "-"}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#111827",
                            paddingRight: 10,
                          }}
                        >
                          {r.establishmentName || "-"}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          {r.ownerName || "-"}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 18,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={printing}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#111827",
                fontWeight: 900,
                cursor: printing ? "not-allowed" : "pointer",
                opacity: printing ? 0.7 : 1,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #b91c1c",
                background: "#b91c1c",
                color: "#fff",
                fontWeight: 900,
                cursor: printing ? "not-allowed" : "pointer",
                opacity: printing ? 0.8 : 1,
              }}
            >
              {printing ? "Printing..." : "Print Selected"}
            </button>
          </div>
        </div>
      </div>

      {dialog.open && (
        <div
          onClick={closeDialog}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 25px 70px rgba(2,6,23,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{dialog.title}</div>
            </div>

            <div
              style={{
                padding: 18,
                fontSize: 14,
                lineHeight: 1.5,
                color: "#374151",
                fontWeight: 700,
              }}
            >
              {dialog.message}
            </div>

            <div
              style={{
                padding: "0 18px 18px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeDialog}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid #b91c1c",
                  background: "#b91c1c",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}