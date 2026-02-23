import {
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineViewGrid,
} from "react-icons/hi";

import bfpLogo from "../assets/logo/bfp-logo.png";
import {
  sidebarWrapOpen,
  sidebarWrapClosed,
  navBtn,
  arrowBtn,
  C,
} from "./shellStyles";

import LockButton from "./LockButton";

export default function Sidebar({
  collapsed,
  setCollapsed,
  active,
  navigate,
  onLock,
}) {
  const wrapStyle = collapsed ? sidebarWrapClosed : sidebarWrapOpen;
  const iconStyle = { fontSize: 20, color: "#fff" };

  return (
    <aside style={wrapStyle}>
      {/* ================= LOGO ================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? 10 : "10px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          marginBottom: 8,
          width: collapsed ? "auto" : "100%",
        }}
      >
        <div
          style={{
            width: collapsed ? 40 : 48,
            height: collapsed ? 40 : 48,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${C.gold}`,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={bfpLogo}
            alt="BFP Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {!collapsed && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 950, fontSize: 14 }}>
              BFP SYSTEM
            </div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>
              Bureau of Fire Protection
            </div>
          </div>
        )}
      </div>

      {/* ================= NAV ================= */}
      <div
        style={navBtn(active.dashboard, collapsed)}
        onClick={() => navigate("/app/dashboard")}
      >
        <HiOutlineViewGrid style={iconStyle} />
        {!collapsed && <span>Dashboard</span>}
      </div>

      <div
        style={navBtn(active.records, collapsed)}
        onClick={() => navigate("/app/records")}
      >
        <HiOutlineClipboardList style={iconStyle} />
        {!collapsed && <span>Records</span>}
      </div>

      <div
        style={navBtn(active.documents, collapsed)}
        onClick={() => navigate("/app/documents")}
      >
        <HiOutlineDocumentText style={iconStyle} />
        {!collapsed && <span>Documents</span>}
      </div>

      <div
        style={navBtn(active.renewed, collapsed)}
        onClick={() => navigate("/app/renewed")}
      >
        <HiOutlineRefresh style={iconStyle} />
        {!collapsed && <span>Renewed</span>}
      </div>

      <div
        style={navBtn(active.filemgmt, collapsed)}
        onClick={() => navigate("/app/filemgmt")}
      >
        <HiOutlineTrash style={iconStyle} />
        {!collapsed && <span>Data Deletion</span>}
      </div>

      {/* ================= LOCK ================= */}
      <div style={{ marginTop: "auto", paddingBottom: 15 }}>
        <LockButton collapsed={collapsed} onClick={onLock} />
      </div>

      {/* ================= COLLAPSE BUTTON ================= */}
      <div
        style={arrowBtn}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <HiOutlineChevronRight />
        ) : (
          <HiOutlineChevronLeft />
        )}
      </div>
    </aside>
  );
}