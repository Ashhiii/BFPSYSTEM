import React, { useState } from "react";
import bgImage from "../assets/background/bg.png";

export default function PinUnlock() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fireLoading, setFireLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!pin) return setMsg("Enter PIN.");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error("Invalid PIN");

      // ✅ PIN correct
      sessionStorage.setItem("unlocked", "1");

      // 🔥 SWITCH TO FIRE LOADING SCREEN
      setFireLoading(true);

      setTimeout(() => {
        window.location.href = "/app/records";
      }, 3500);
    } catch (err) {
      setMsg("❌ Incorrect PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGIN SCREEN ================= */

  const bg = {
    minHeight: "100vh",
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "grid",
    placeItems: "center",
    position: "relative",
  };

  const overlay = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
  };

  const card = {
    position: "relative",
    zIndex: 2,
    width: "min(420px, 92%)",
    padding: 22,
    paddingRight: 50,
    borderRadius: 18,
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.25)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
    color: "#fff",
    textAlign: "center",
  };

  const input = {
    width: "100%",
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    outline: "none",
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 8,
    textAlign: "center",
  };

  const btn = {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#b91c1c",
    color: "#fff",
    fontWeight: 950,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  /* ================= FIRE LOADING SCREEN ================= */

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

  /* ================= RENDER ================= */

  // 🔥 FIRE ONLY (WHITE SCREEN)
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

  // 🔐 LOGIN SCREEN
  return (
    <div style={bg}>
      <div style={overlay} />

      <div style={card}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>
          BFP RECORDS SYSTEM
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          Enter PIN to unlock
        </div>

        <form onSubmit={submit}>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            style={input}
            autoFocus
            disabled={loading}
          />

          {msg && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#fecaca",
                fontWeight: 900,
              }}
            >
              {msg}
            </div>
          )}

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
