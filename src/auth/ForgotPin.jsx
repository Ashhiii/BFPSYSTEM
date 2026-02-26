import React, { useEffect, useState } from "react";
import bgVideo from "../assets/background/bg1.mp4";
import logo from "../assets/logo/bfp-logo.png";
import { useNavigate } from "react-router-dom";

export default function ForgotPin() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const bg = {
    height: "95vh",
    position: "relative",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    padding: 14,
  };

  const videoStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
    filter: "saturate(1.05) contrast(1.05)",
  };

  const overlay = {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 30% 20%, rgba(0,0,0,.35), rgba(0,0,0,.70))",
    zIndex: 1,
  };

  const wrap = {
    position: "relative",
    zIndex: 2,
    width: "min(460px, 92vw)",
    display: "grid",
    placeItems: "center",
  };

  const card = {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    background: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.38)",
    color: "#fff",
    textAlign: "left",
    transform: mounted ? "translateY(0px)" : "translateY(18px)",
    opacity: mounted ? 1 : 0,
    transition: "transform .55s ease, opacity .55s ease",
  };

  const header = { display: "flex", alignItems: "center", gap: 12 };
  const logoImg = {
    width: 52,
    height: 52,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 18px rgba(0,0,0,.25))",
  };

  const title = { fontSize: 16, fontWeight: 950, letterSpacing: 0.5 };
  const sub = { marginTop: 2, fontSize: 12, opacity: 0.9, fontWeight: 800 };

  const body = { marginTop: 14, fontSize: 12.5, lineHeight: 1.6, opacity: 0.95 };
  const bullet = { marginTop: 10, display: "grid", gap: 8 };

  const pill = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.10)",
    fontSize: 12,
    fontWeight: 900,
  };

  const actions = { marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" };

  const ghostBtn = {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };

  const redBtn = {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(180deg, #b91c1c, #7f1d1d)",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  };

  return (
    <div style={bg}>
      <video style={videoStyle} src={bgVideo} autoPlay loop muted playsInline />
      <div style={overlay} />

      <div style={wrap}>
        <div style={card}>
          <div style={header}>
            <img src={logo} alt="BFP Logo" style={logoImg} />
            <div>
              <div style={title}>Forgot PIN</div>
              <div style={sub}>PIN Reset Assistance</div>
            </div>
          </div>

          <div style={body}>
            <span style={pill}>Security Notice</span>

            <div style={{ marginTop: 10 }}>
              For security reasons, PIN reset requests cannot be completed directly from this page.
              Only the System Administrator or IT Support team is authorized to reset access credentials.
            </div>

            <div style={bullet}>
              <div>• Please contact your designated IT Support personnel.</div>
              <div>• Provide your full name and assigned station/unit for verification.</div>
              <div>• Once the PIN has been reset, return to the login screen and enter the new PIN.</div>
            </div>
          </div>

          <div style={actions}>
            <button style={ghostBtn} onClick={() => navigate(-1)}>
              Back
            </button>
            <button style={redBtn} onClick={() => navigate("/")}>
              Return to PIN Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}