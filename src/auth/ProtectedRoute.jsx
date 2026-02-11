import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const unlocked = sessionStorage.getItem("unlocked") === "1";

  // 🔒 Not unlocked → back to PIN page
  if (!unlocked) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
