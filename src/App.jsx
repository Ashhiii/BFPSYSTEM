import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import PinUnlock from "./auth/PinUnlock.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

import Records from "./pages/Records/Records";
import Documents from "./pages/Documents/Documents";
import Renewed from "./pages/Renewed/Renewed";
import FileManagement from "./pages/FileManagement/FileManagement";

import Sidebar from "./layout/Sidebar.jsx";
import { layout, main } from "./layout/shellStyles.js";

import ImportExcel from "./pages/ImportExcel/ImportExcel.jsx";


function Shell() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 🔥 lock animation state
  const [locking, setLocking] = useState(false);

  // active nav (based on URL)
  const path = window.location.pathname;
  const active = {
    records: path.includes("/app/records"),
    documents: path.includes("/app/documents"),
    renewed: path.includes("/app/renewed"),
    filemgmt: path.includes("/app/filemgmt"),
      importexcel: path.includes("/app/import"), // ✅ NEW
  };

  // ✅ LOCK WITH FIRE OVERLAY (NO WHITE BG)
  const requestLock = () => {
    if (locking) return;
    setLocking(true);

    setTimeout(() => {
      sessionStorage.removeItem("unlocked");
      navigate("/", { replace: true });
    }, 1500);
  };

  return (
    <div style={layout(collapsed)}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        active={active}
        navigate={navigate}
        onLock={requestLock}
      />

      <main style={main}>
        <Routes>
          <Route path="records" element={<Records refresh={refresh} setRefresh={setRefresh} />} />
          <Route path="documents" element={<Documents refresh={refresh} setRefresh={setRefresh} />} />
          <Route path="renewed" element={<Renewed refresh={refresh} setRefresh={setRefresh} />} />
          <Route path="filemgmt" element={<FileManagement refresh={refresh} setRefresh={setRefresh} />} />
          <Route path="import" element={<ImportExcel refresh={refresh} setRefresh={setRefresh} />} />
          <Route path="*" element={<Navigate to="records" replace />} />
        </Routes>
      </main>

      {/* 🔥 FIRE LOCK OVERLAY */}
      {locking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.65)", // ✅ no white background
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 70, animation: "firePulse .6s infinite alternate" }}>
              🔥
            </div>
            <div style={{ marginTop: 10, fontWeight: 950 }}>Locking system...</div>
          </div>

          <style>{`
            @keyframes firePulse {
              from { transform: scale(1); opacity: 0.75; }
              to { transform: scale(1.25); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PinUnlock />} />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}