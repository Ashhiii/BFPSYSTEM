export const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  navy: "#792222",
  navySoft: "#3a1212",
  bg: "#f6f7fb",
};

/* ===========================
   LAYOUT
=========================== */
export const layout = (collapsed) => ({
  height: "100vh",
  display: "grid",
  gridTemplateColumns: collapsed ? "78px 1fr" : "240px 1fr",
  transition: "grid-template-columns .25s ease",
  fontFamily: "Inter, Arial, sans-serif",
  background: C.bg,
  overflow: "hidden",
});

/* ===========================
   SIDEBAR WRAPS
=========================== */
export const sidebarWrapOpen = {
  position: "sticky",
  top: 0,
  height: "100vh",
  background: `linear-gradient(180deg, ${C.navy}, ${C.navySoft})`,
  color: "#fff",
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "stretch",
};

export const sidebarWrapClosed = {
  position: "sticky",
  top: 0,
  height: "100vh",
  background: `linear-gradient(180deg, ${C.navy}, ${C.navySoft})`,
  color: "#fff",
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
};

/* ===========================
   NAV BUTTON
=========================== */
export const navBtn = (active, collapsed) => ({
  boxSizing: "border-box",

  width: collapsed ? 54 : "100%",
  height: collapsed ? 54 : "auto",
  minHeight: collapsed ? 54 : 44,

  display: "flex",
  alignItems: "center",
  justifyContent: collapsed ? "center" : "flex-start",
  gap: collapsed ? 0 : 12,

  padding: collapsed ? 0 : "10px 12px",
  borderRadius: collapsed ? 16 : 12,

  cursor: "pointer",
  userSelect: "none",
  transition: "all .2s ease",

  background: active ? "rgba(185,28,28,.18)" : "transparent",
  border: active ? "1px solid #b91c1c" : "1px solid transparent",

  fontWeight: active ? 900 : 700,
});

/* ===========================
   COLLAPSE ARROW
=========================== */
export const arrowBtn = {
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
  color: "#fff",
};

/* ===========================
   MAIN
=========================== */
export const main = {
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  padding: 18,
};