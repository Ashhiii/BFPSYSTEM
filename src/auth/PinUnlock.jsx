import React, { useEffect, useState } from "react";
import bgVideo from "../assets/background/bg1.mp4";
import logo from "../assets/logo/bfp-logo.png";
import { useNavigate } from "react-router-dom";

export default function PinUnlock() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fireLoading, setFireLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setActive(Boolean(pin));
  }, [pin]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!pin) return setMsg("Enter PIN.");

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error("Invalid PIN");

      sessionStorage.setItem("unlocked", "1");

      // ✅ transparent overlay loading (same screen)
      setFireLoading(true);

      setTimeout(() => {
        navigate("/app/records");
      }, 5500);
    } catch (err) {
      setMsg("❌ Incorrect PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIDEO BG ================= */

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
    background:
      "radial-gradient(circle at 30% 20%, rgba(0,0,0,.35), rgba(0,0,0,.65))",
    zIndex: 1,
  };

  /* ================= CARD + ANIMATIONS ================= */

  const wrap = {
    position: "relative",
    zIndex: 2,
    width: "min(440px, 92vw)",
    display: "grid",
    placeItems: "center",
  };

  const card = {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    paddingTop: 90,
    background: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.38)",
    color: "#fff",
    textAlign: "center",
    transform: mounted ? "translateY(0px)" : "translateY(18px)",
    opacity: mounted ? 1 : 0,
    transition: "transform .55s ease, opacity .55s ease",
  };

  const logoWrap = {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: active
      ? "translate(-50%, -70px) scale(0.92)"
      : "translate(-50%, -50px) scale(1)",
    transition: "transform .45s cubic-bezier(.2,.9,.2,1)",
    zIndex: 3,
    width: 130,
    height: 130,
    borderRadius: 28,
    display: "grid",
    placeItems: "center",
  };

  const logoImg = {
    width: "200%",
    height: 120,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 18px rgba(0,0,0,.25))",
  };

  const title = { fontSize: 18, fontWeight: 950, letterSpacing: 1 };
  const sub = { fontSize: 12, opacity: 0.88, marginTop: 6, fontWeight: 800 };

  const inputWrap = { marginTop: 18, display: "grid", gap: 10 };

  const input = {
    width: "95%",
    padding: "12px 14px",
    borderRadius: 14,
    border: msg
      ? "1px solid rgba(254,202,202,.75)"
      : "1px solid rgba(255,255,255,0.28)",
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    outline: "none",
    fontSize: 16,
    fontWeight: 950,
    letterSpacing: 10,
    textAlign: "center",
    transition: "transform .12s ease, border .2s ease, box-shadow .2s ease",
  };

  const btn = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(180deg, #b91c1c, #7f1d1d)",
    color: "#fff",
    fontWeight: 950,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
    transform: loading ? "scale(.99)" : "scale(1)",
    transition: "transform .12s ease, opacity .2s ease",
    boxShadow: "0 18px 40px rgba(185,28,28,.28)",
  };

  const msgStyle = {
    fontSize: 12,
    color: "#fecaca",
    fontWeight: 900,
    minHeight: 16,
  };

  const hintRow = { marginTop: 10, fontSize: 11, opacity: 0.82, fontWeight: 800 };

  /* ================= TRANSPARENT LOADING OVERLAY ================= */

  const loadingOverlay = {
    position: "absolute",
    inset: 0,
    zIndex: 6,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.35)", // ✅ transparent
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    animation: "fadeIn .18s ease",
  };

  const loadingCard = {
    width: "min(360px, 92vw)",
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    color: "#fff",
    textAlign: "center",
  };

  const spinner = {
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "4px solid rgba(255,255,255,0.25)",
    borderTop: "4px solid rgba(255,255,255,0.95)",
    margin: "0 auto",
    animation: "spin .9s linear infinite",
  };

  return (
    <div style={bg}>
      <video style={videoStyle} src={bgVideo} autoPlay loop muted playsInline />
      <div style={overlay} />

      {/* ✅ overlay loading on top of same login */}
      {fireLoading && (
        <div style={loadingOverlay}>
          <div style={loadingCard}>
<img
  src={logo}
  alt="BFP Logo Loading"
  style={{
    width: 90,
    height: 90,
    objectFit: "contain",
    animation: "pulseLogo 1.8s ease-in-out infinite",
    filter: "drop-shadow(0 10px 30px rgba(185,28,28,.6))"
  }}
/>
            <div style={{ marginTop: 8, fontWeight: 950 }}>Securing system...</div>
            <div style={{ marginTop: 14 }}>
              <div style={spinner} />
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, fontWeight: 800 }}>
              Please wait…
            </div>
          </div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}

      <div style={wrap}>
        <div style={logoWrap}>
          <img src={logo} alt="BFP Logo" style={logoImg} />
        </div>

        <div style={card}>
          <div style={title}>BFP RECORDS SYSTEM</div>
          <div style={sub}>Enter PIN to unlock</div>

          <form
            onSubmit={submit}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(Boolean(pin))}
            style={inputWrap}
          >
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              style={input}
              autoFocus
              disabled={loading || fireLoading}
              onFocus={(e) => {
                setActive(true);
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,.25)";
              }}
              onBlur={(e) => {
                setActive(Boolean(pin));
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            <div style={msgStyle}>{msg || ""}</div>

            <button type="submit" style={btn} disabled={loading || fireLoading}>
              {loading ? "Checking..." : fireLoading ? "Entering..." : "Unlock"}
            </button>

            <div style={hintRow}>Tip: numbers only • max 6 digits</div>
          </form>
        </div>
      </div>
    </div>
  );
}
