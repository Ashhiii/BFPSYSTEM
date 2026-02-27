// src/components/ExportChoiceModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineX, HiOutlineSearch, HiOutlineCheck, HiOutlineDownload } from "react-icons/hi";

export default function ExportChoiceModal({
  open,
  onClose,
  onExportAll,
  onExportSelected,
  rows = [],         // list of records to choose from (usually filteredRecords)
  busy = false,
  C,
}) {
  const [mode, setMode] = useState("choice"); // choice | select
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState({}); // id -> true

  useEffect(() => {
    if (!open) return;
    setMode("choice");
    setQ("");
    setSelected({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = [
        r.establishmentName,
        r.ownerName,
        r.fsicAppNo,
        r.fsicNo,
        r.ioNumber,
        r.primaryId,
        r.businessAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected[String(r.id)]);

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 14,
  };

  const modal = {
    width: "min(920px, 96vw)",
    borderRadius: 18,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 30px 70px rgba(2,6,23,0.25)",
    overflow: "hidden",
  };

  const top = {
    padding: "12px 14px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    background: "#fff",
  };

  const title = { fontWeight: 980, color: C.text, fontSize: 14 };
  const closeBtn = {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#fff",
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.6 : 1,
    display: "grid",
    placeItems: "center",
  };

  const body = { padding: 14, background: "transparent" };

  const two = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const card = {
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  };
  const h = { fontWeight: 980, color: C.text, fontSize: 13 };
  const p = { marginTop: 6, color: C.muted, fontWeight: 800, fontSize: 12, lineHeight: 1.4 };

  const action = (primary) => ({
    marginTop: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: primary ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
    background: primary ? `linear-gradient(180deg, ${C.primary}, ${C.primaryDark})` : "#fff",
    color: primary ? "#fff" : C.text,
    fontWeight: 980,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.65 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  });

  const selectTop = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  };

  const search = {
    flex: 1,
    minWidth: 240,
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: `1px solid ${C.border}`,
    background: "#fff",
    borderRadius: 14,
    padding: "10px 12px",
  };

  const input = {
    border: "none",
    outline: "none",
    width: "100%",
    fontWeight: 900,
    color: C.text,
    fontSize: 12,
    background: "transparent",
  };

  const smallBtn = (danger) => ({
    padding: "9px 12px",
    borderRadius: 14,
    border: `1px solid ${danger ? "#fecaca" : C.border}`,
    background: danger ? "#fff1f2" : "#fff",
    color: danger ? "#9f1239" : C.text,
    fontWeight: 980,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.65 : 1,
    whiteSpace: "nowrap",
  });

  const listWrap = {
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    background: "#fff",
    overflow: "hidden",
  };

  const row = {
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderTop: `1px solid ${C.border}`,
  };

  const left = { minWidth: 0, display: "flex", flexDirection: "column", gap: 3 };
  const t = { fontWeight: 980, fontSize: 12, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const s = { fontWeight: 850, fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

  const check = {
    width: 22,
    height: 22,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    display: "grid",
    placeItems: "center",
    background: "#fff",
    cursor: busy ? "not-allowed" : "pointer",
    flexShrink: 0,
  };

  const foot = {
    padding: "12px 14px",
    borderTop: `1px solid ${C.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    background: "#fff",
  };

  if (!open) return null;

  return (
    <div style={overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose?.()}>
      <div style={modal}>
        <div style={top}>
          <div style={title}>Export Records</div>
          <button style={closeBtn} onClick={() => !busy && onClose?.()} title="Close">
            <HiOutlineX size={18} />
          </button>
        </div>

        <div style={body}>
          {mode === "choice" ? (
            <div style={two}>
              <div style={card}>
                <div style={h}>Export All</div>
                <div style={p}>
                  Exports all records currently shown (your current search/filter results).
                </div>
                <button style={action(true)} onClick={() => !busy && onExportAll?.()}>
                  <HiOutlineDownload size={18} /> Export All
                </button>
              </div>

              <div style={card}>
                <div style={h}>Select Records</div>
                <div style={p}>
                  Choose specific records to export using checkboxes.
                </div>
                <button style={action(false)} onClick={() => setMode("select")}>
                  <HiOutlineCheck size={18} /> Select & Export
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={selectTop}>
                <div style={search}>
                  <HiOutlineSearch size={18} color={C.muted} />
                  <input
                    style={input}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search establishment, owner, FSIC/IO..."
                  />
                </div>

                <button
                  style={smallBtn(false)}
                  onClick={() => {
                    const next = { ...selected };
                    for (const r of filtered) next[String(r.id)] = true;
                    setSelected(next);
                  }}
                >
                  Select Visible
                </button>

                <button
                  style={smallBtn(true)}
                  onClick={() => {
                    const next = { ...selected };
                    for (const r of filtered) next[String(r.id)] = false;
                    setSelected(next);
                  }}
                >
                  Clear Visible
                </button>

                <button style={smallBtn(false)} onClick={() => setMode("choice")}>
                  Back
                </button>
              </div>

              <div style={listWrap}>
                <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 980, color: C.text, fontSize: 12 }}>
                    {filtered.length} record(s) • {selectedIds.length} selected
                  </div>

                  <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 900, color: C.muted, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={(e) => {
                        const on = e.target.checked;
                        const next = { ...selected };
                        for (const r of filtered) next[String(r.id)] = on;
                        setSelected(next);
                      }}
                    />
                    Select all visible
                  </label>
                </div>

                <div style={{ maxHeight: 360, overflow: "auto" }}>
                  {filtered.map((r, idx) => {
                    const id = String(r.id);
                    const checked = !!selected[id];
                    return (
                      <div key={id} style={{ ...row, borderTop: idx === 0 ? `1px solid ${C.border}` : row.borderTop }}>
                        <div style={left}>
                          <div style={t}>{r.establishmentName || r.fsicAppNo || r.ioNumber || "Record"}</div>
                          <div style={s}>
                            {r.ownerName ? `Owner: ${r.ownerName} • ` : ""}
                            {r.fsicAppNo ? `FSIC APP: ${r.fsicAppNo} • ` : ""}
                            {r.ioNumber ? `IO: ${r.ioNumber}` : ""}
                          </div>
                        </div>

                        <div
                          style={check}
                          onClick={() => {
                            if (busy) return;
                            setSelected((p) => ({ ...p, [id]: !p[id] }));
                          }}
                          title="Toggle select"
                        >
                          {checked ? <HiOutlineCheck size={16} color={C.primaryDark} /> : null}
                        </div>
                      </div>
                    );
                  })}

                  {!filtered.length && (
                    <div style={{ padding: 12, color: C.muted, fontWeight: 900, fontSize: 12 }}>
                      No matching records.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={foot}>
          <div style={{ fontWeight: 900, color: C.muted, fontSize: 12 }}>
            Tip: “Export All” follows current filters.
          </div>

          <button
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: `1px solid ${C.primary}`,
              background: `linear-gradient(180deg, ${C.primary}, ${C.primaryDark})`,
              color: "#fff",
              fontWeight: 980,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.65 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            disabled={busy || (mode === "select" && selectedIds.length === 0)}
            onClick={() => {
              if (busy) return;
              if (mode === "select") onExportSelected?.(selectedIds);
              else onExportAll?.();
            }}
            title={mode === "select" && selectedIds.length === 0 ? "Select at least 1 record" : "Export"}
          >
            <HiOutlineDownload size={18} />
            {mode === "select" ? `Export Selected (${selectedIds.length})` : "Export All"}
          </button>
        </div>
      </div>
    </div>
  );
}