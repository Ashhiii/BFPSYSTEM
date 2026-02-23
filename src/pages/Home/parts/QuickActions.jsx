import React from "react";
import {
  HiOutlinePlus,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineArchive,
  HiOutlineChevronRight,
} from "react-icons/hi";

export default function QuickActions({ C, exporting, onAdd, onImport, onExport, onArchive }) {
  const card = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    boxShadow: C.shadow,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const solidCard = {
    background: C.cardSolid,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    boxShadow: C.shadowSoft,
  };

  const actionGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
  };

  const tile = {
    ...solidCard,
    padding: 14,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const tileTop = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
  const tileTitle = { fontWeight: 980, color: C.text, letterSpacing: "-0.02em" };
  const tileDesc = { fontSize: 12, fontWeight: 850, color: C.muted, lineHeight: 1.35 };

  const pillIcon = (bg) => ({
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: bg,
    border: `1px solid ${C.border}`,
    boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
    flexShrink: 0,
  });

  const tileBtn = (bg, color) => ({
    width: "100%",
    padding: "12px 12px",
    borderRadius: 16,
    border: "none",
    background: bg,
    color,
    fontWeight: 980,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxShadow: "0 12px 22px rgba(2,6,23,0.10)",
    transition: "transform .15s ease, box-shadow .15s ease, opacity .15s ease",
    opacity: exporting && bg === "#0f172a" ? 0.85 : 1,
  });

  const hoverUp = (e) => (e.currentTarget.style.transform = "translateY(-1px)");
  const hoverDown = (e) => (e.currentTarget.style.transform = "translateY(0px)");

  return (
    <div style={{ ...card, padding: 16 }}>

      <div style={actionGrid} className="twoCols">
        <ActionTile
          title="Add Record"
          desc="Create new inspection record."
          icon={<HiOutlinePlus size={22} color={C.primary} />}
          iconBg="rgba(185,28,28,0.10)"
          btnText="Add New Record"
          btnBg={C.primary}
          onClick={onAdd}
          onEnter={hoverUp}
          onLeave={hoverDown}
          btnRight={<HiOutlineChevronRight size={20} />}
        />

        <ActionTile
          title="Import Excel"
          desc="Upload Excel then import to Firestore."
          icon={<HiOutlineUpload size={22} color="#0f172a" />}
          iconBg="rgba(15,23,42,0.08)"
          btnText="Import"
          btnBg="#111827"
          onClick={onImport}
          onEnter={hoverUp}
          onLeave={hoverDown}
          btnRight={<HiOutlineChevronRight size={20} />}
        />

        <ActionTile
          title="Export Excel"
          desc="Download ALL current records."
          icon={<HiOutlineDownload size={22} color={C.primaryDark} />}
          iconBg="rgba(185,28,28,0.10)"
          btnText={exporting ? "Exporting..." : "Export"}
          btnBg="#0f172a"
          disabled={exporting}
          onClick={onExport}
          onEnter={hoverUp}
          onLeave={hoverDown}
          btnRight={<HiOutlineChevronRight size={20} />}
        />

        <ActionTile
          title="Archive"
          desc="Browse archived monthly data."
          icon={<HiOutlineArchive size={22} color={C.primaryDark} />}
          iconBg="rgba(127,29,29,0.10)"
          btnText="Go to Archive"
          btnBg={C.primary}
          onClick={onArchive}
          onEnter={hoverUp}
          onLeave={hoverDown}
          btnRight={<HiOutlineChevronRight size={20} />}
        />
      </div>

      {/* local helpers */}
      {/**/}
      <style>{""}</style>
    </div>
  );

  function ActionTile({ title, desc, icon, iconBg, btnText, btnBg, onClick, disabled, onEnter, onLeave, btnRight }) {
    return (
      <div style={tile}>
        <div style={tileTop}>
          <div>
            <div style={tileTitle}>{title}</div>
            <div style={tileDesc}>{desc}</div>
          </div>
          <div style={pillIcon(iconBg)}>{icon}</div>
        </div>

        <button
          style={tileBtn(btnBg, "#fff")}
          onClick={onClick}
          disabled={disabled}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          <span>{btnText}</span>
          {btnRight}
        </button>
      </div>
    );
  }
}