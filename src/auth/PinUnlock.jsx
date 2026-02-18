import React, { useEffect, useMemo, useState } from "react";
import bgVideo from "../assets/background/bg.mp4";
import logo from "../assets/logo/bfp-logo.png"; // ✅ change to your logo path
import { useNavigate } from "react-router-dom";

export default function PinUnlock() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fireLoading, setFireLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false); // ✅ controls logo “saka” animation
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    // ✅ entrance animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // logo goes up when typing / focused / has pin
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
      setFireLoading(true);

      setTimeout(() => {
        navigate("/app/records");
      }, 2500);
    } catch (err) {
      setMsg("❌ Incorrect PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIDEO BG ================= */

  const bg = {
    minHeight: "100vh",
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
    paddingTop: 90, // ✅ space for logo overlap
    background: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.38)",
    color: "#fff",
    textAlign: "center",

    // ✅ entrance transition
    transform: mounted ? "translateY(0px)" : "translateY(18px)",
    opacity: mounted ? 1 : 0,
    transition: "transform .55s ease, opacity .55s ease",
  };

const logoWrap = {
  position: "absolute",
  top: 0,
  bottom: 10,
  left: "50%",
  transform: active
    ? "translate(-50%, -70px) scale(0.92)"
    : "translate(-50%, -50px) scale(1)",
  transition: "transform .45s cubic-bezier(.2,.9,.2,1)",
  zIndex: 3,
  width: 130,      // 🔥 from 96 → 130
  height: 130,
  borderRadius: 28,
  display: "grid",
  placeItems: "center",
};

const logoImg = {
  width: "200%",      // 🔥 bigger image
  height: 120,
  objectFit: "contain",
  filter: "drop-shadow(0 10px 18px rgba(0,0,0,.25))",
};


  const title = {
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: 1,
  };

  const sub = {
    fontSize: 12,
    opacity: 0.88,
    marginTop: 6,
    fontWeight: 800,
  };

  const inputWrap = {
    marginTop: 18,
    display: "grid",
    gap: 10,
  };

  const input = {
    width: "95%",
    padding: "12px 14px",
    borderRadius: 14,
    border: msg ? "1px solid rgba(254,202,202,.75)" : "1px solid rgba(255,255,255,0.28)",
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

  const hintRow = {
    marginTop: 10,
    fontSize: 11,
    opacity: 0.82,
    fontWeight: 800,
  };

  /* ================= FIRE LOADING ================= */

  const fireScreen = {
    minHeight: "100vh",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  };

  const fire = {
    fontSize: 72,
    animation: "firePulse 0.6s infinite alternate",
  };

  if (fireLoading) {
    return (
      <div style={fireScreen}>
        <div>
          <div style={fire}>🔥</div>
          <div style={{ marginTop: 14, fontWeight: 900, color: "#991b1b" }}>
            Securing system...
          </div>
        </div>

        <style>{`
          @keyframes firePulse {
            from { transform: scale(1); opacity: 0.7; }
            to { transform: scale(1.25); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={bg}>
      <video style={videoStyle} src={bgVideo} autoPlay loop muted playsInline />
      <div style={overlay} />

      <div style={wrap}>
        {/* ✅ LOGO that moves up */}
        <div style={logoWrap}>
          <img src={logo} alt="BFP Logo" style={logoImg} />
        </div>

        {/* ✅ LOGIN CARD */}
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
              disabled={loading}
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

            <button type="submit" style={btn} disabled={loading}>
              {loading ? "Checking..." : "Unlock"}
            </button>

            <div style={hintRow}>
              Tip: numbers only • max 6 digits
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
