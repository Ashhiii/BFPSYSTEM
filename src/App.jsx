import React, { useState } from "react";
import {
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";

import Records from "./pages/Records/Records";
import Documents from "./pages/Documents/Documents";
import Renewed from "./pages/Renewed/Renewed";
import FileManagement from "./pages/FileManagement/FileManagement";

import bfpLogo from "./assets/logo/bfp-logo.png";

const C = {
  primary: "#b91c1c",    
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  navy: "#792222",
  navySoft: "#3a1212",
  bg: "#f6f7fb",
  white: "#ffffff",
};

export default function App() {
  const [page, setPage] = useState("records");
  const [refresh, setRefresh] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const layout = {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: collapsed ? "78px 1fr" : "240px 1fr",
    transition: "grid-template-columns .25s ease",
    fontFamily: "Inter, Arial, sans-serif",
    background: C.bg,
  };

  /* ===== SIDEBAR ===== */
  const sidebarWrap = {
    position: "relative",
    background: `linear-gradient(180deg, ${C.navy}, ${C.navySoft})`,
    color: "#fff",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const navBtn = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    background: active ? "rgba(185,28,28,.18)" : "transparent",
    border: active ? `1px solid ${C.primary}` : "1px solid transparent",
    fontWeight: active ? 900 : 700,
    transition: "all .18s ease",
    userSelect: "none",
  });

  const iconStyle = { fontSize: 20, color: "#fff" };

  const labelStyle = {
    display: collapsed ? "none" : "inline",
    whiteSpace: "nowrap",
  };

  /* ===== ARROW ===== */
  const arrowBtn = {
    position: "absolute",
    top: "50%",
    right: -14,
    transform: "translateY(-50%)",
    width: 28,
    height: 56,
    borderRadius: "0 10px 10px 0",
    background: C.primary,
    border: "1px solid rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    color: "#fff",
  };

  /* ===== MAIN ===== */
  const main = { padding: 18 };

  return (
    <div style={layout}>
      {/* ===== SIDEBAR ===== */}
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
              height: collapsed ? 40 : 46,
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
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
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

        {/* NAV ITEMS */}
        <div style={navBtn(page === "records")} onClick={() => setPage("records")}>
          <HiOutlineClipboardList style={iconStyle} />
          <span style={labelStyle}>Records</span>
        </div>

        <div style={navBtn(page === "documents")} onClick={() => setPage("documents")}>
          <HiOutlineDocumentText style={iconStyle} />
          <span style={labelStyle}>Documents</span>
        </div>

        <div style={navBtn(page === "renewed")} onClick={() => setPage("renewed")}>
          <HiOutlineRefresh style={iconStyle} />
          <span style={labelStyle}>Renewed</span>
        </div>

        <div style={navBtn(page === "filemgmt")} onClick={() => setPage("filemgmt")}>
          <HiOutlineTrash style={iconStyle} />
          <span style={labelStyle}>Data Deletion</span>
        </div>

        {/* COLLAPSE ARROW */}
        <div
          style={arrowBtn}
          onClick={() => setCollapsed((p) => !p)}
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <HiOutlineChevronRight size={18} /> : <HiOutlineChevronLeft size={18} />}
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={main}>
        {page === "records" && <Records refresh={refresh} setRefresh={setRefresh} />}
        {page === "documents" && <Documents refresh={refresh} setRefresh={setRefresh} />}
        {page === "renewed" && <Renewed refresh={refresh} setRefresh={setRefresh} />}
        {page === "filemgmt" && <FileManagement refresh={refresh} setRefresh={setRefresh} />}
      </main>
    </div>
  );
}
