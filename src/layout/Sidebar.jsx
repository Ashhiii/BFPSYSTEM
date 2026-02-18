import {
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
    HiOutlineUpload, // ✅ NEW
} from "react-icons/hi";

import bfpLogo from "../assets/logo/bfp-logo.png";
import { sidebarWrap, navBtn, arrowBtn, C } from "./shellStyles";
import LockButton from "./LockButton"; // ✅ new


export default function Sidebar({
  collapsed,
  setCollapsed,
  active,
  navigate,
  onLock,
}) {
  const iconStyle = { fontSize: 20, color: "#fff" };
  const labelStyle = { display: collapsed ? "none" : "inline" };

  return (
    <aside style={sidebarWrap}>
      {/* LOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          marginBottom: 6,
        }}
        title="Bureau of Fire Protection"
      >
        <div
          style={{
            width: collapsed ? 40 : 46,
            height: collapsed ? 30 : 46,
            borderRadius: "50%",
            overflow: "hidden",
            background: "rgba(255,255,255,0.08)",
            border: `2px solid ${C.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={bfpLogo}
            alt="BFP Logo"
            style={{ width: "100%", height: "100%", objectFit: "cover"}}
          />
        </div>

        {!collapsed && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 950, fontSize: 14 }}>BFP SYSTEM</div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>
              Bureau of Fire Protection
            </div>
          </div>
        )}
      </div>

      {/* NAV */}
      <div style={navBtn(active.records)} onClick={() => navigate("/app/records")}>
        <HiOutlineClipboardList style={iconStyle} />
        <span style={labelStyle}>Records</span>
      </div>

      <div style={navBtn(active.documents)} onClick={() => navigate("/app/documents")}>
        <HiOutlineDocumentText style={iconStyle} />
        <span style={labelStyle}>Documents</span>
      </div>

      <div style={navBtn(active.renewed)} onClick={() => navigate("/app/renewed")}>
        <HiOutlineRefresh style={iconStyle} />
        <span style={labelStyle}>Renewed</span>
      </div>

      <div style={navBtn(active.filemgmt)} onClick={() => navigate("/app/filemgmt")}>
        <HiOutlineTrash style={iconStyle} />
        <span style={labelStyle}>Data Deletion</span>
      </div>

            <div style={navBtn(active.importexcel)} onClick={() => navigate("/app/import")}>
  <HiOutlineUpload style={iconStyle} />
  <span style={labelStyle}>Import Excel</span>
</div>

      {/* ✅ LOCK BUTTON SEPARATE */}
      <LockButton collapsed={collapsed} onClick={onLock} />

      {/* COLLAPSE */}
      <div style={arrowBtn} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
      </div>


    </aside>
  );
}
