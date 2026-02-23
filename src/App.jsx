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

import logo from "./assets/logo/bfp-logo.png";

import Dashboard from "./pages/Home/Dashboard.jsx";
import Archive from "./pages/Archive/Archive.jsx";

import AddRecordPage from "./components/AddRecords.jsx";

// App.jsx (Shell part only) — FULL return with onLock connected
function Shell() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [locking, setLocking] = useState(false);

  const path = window.location.pathname;
  const active = {
    dashboard: path.includes("/app/dashboard"),
    archive: path.includes("/app/archive"),
    records: path.includes("/app/records"),
    documents: path.includes("/app/documents"),
    renewed: path.includes("/app/renewed"),
    filemgmt: path.includes("/app/filemgmt"),
    importexcel: path.includes("/app/import"),
  };

  // ✅ LOCK FUNCTION HERE
  const requestLock = () => {
    if (locking) return;
    setLocking(true);

    setTimeout(() => {
      sessionStorage.removeItem("unlocked");
      navigate("/", { replace: true });
    }, 5500);
  };

  return (
    <>
      <div style={layout(collapsed)}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          active={active}
          navigate={navigate}
          onLock={requestLock} // ✅ PASS IT DOWN
        />

        <main style={main}>
          <Routes>
            <Route path="dashboard" element={<Dashboard setRefresh={setRefresh} />} />
            <Route path="records" element={<Records refresh={refresh} setRefresh={setRefresh} />} />
            <Route path="add-record" element={<AddRecordPage setRefresh={setRefresh} />} />
            <Route path="documents" element={<Documents refresh={refresh} setRefresh={setRefresh} />} />
            <Route path="renewed" element={<Renewed refresh={refresh} setRefresh={setRefresh} />} />
            <Route path="filemgmt" element={<FileManagement refresh={refresh} setRefresh={setRefresh} />} />
            <Route path="import" element={<ImportExcel refresh={refresh} setRefresh={setRefresh} />} />
            <Route path="archive" element={<Archive />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* 🔥 FIRE LOCK OVERLAY OUTSIDE GRID (para di magbug) */}
      {locking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div style={{ textAlign: "center", color: "#fff" }}>
            <img
              src={logo}
              alt="BFP Logo Loading"
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                animation: "pulseLogo 1.8s ease-in-out infinite",
                filter: "drop-shadow(0 10px 30px rgba(185,28,28,.6))",
              }}
            />
            <div style={{ marginTop: 10, fontWeight: 950 }}>Locking system...</div>
          </div>

          <style>{`
            @keyframes pulseLogo {
              0% { transform: scale(1); }
              50% { transform: scale(1.08); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
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