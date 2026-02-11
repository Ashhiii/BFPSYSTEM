import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const unlocked = sessionStorage.getItem("unlocked") === "1";
  if (!unlocked) return <Navigate to="/" replace />;
  return children;
}