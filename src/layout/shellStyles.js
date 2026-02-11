export const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  navy: "#792222",
  navySoft: "#3a1212",
  bg: "#f6f7fb",
};

export const layout = (collapsed) => ({
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: collapsed ? "78px 1fr" : "240px 1fr",
  transition: "grid-template-columns .25s ease",
  fontFamily: "Inter, Arial, sans-serif",
  background: C.bg,
});

export const sidebarWrap = {
  position: "relative",
  background: `linear-gradient(180deg, #792222, #3a1212)`,
  color: "#fff",
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export const navBtn = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  cursor: "pointer",
  background: active ? "rgba(185,28,28,.18)" : "transparent",
  border: active ? "1px solid #b91c1c" : "1px solid transparent",
  fontWeight: active ? 900 : 700,
});

export const arrowBtn = {
  position: "absolute",
  top: "50%",
  right: -14,
  transform: "translateY(-50%)",
  width: 28,
  height: 56,
  borderRadius: "0 10px 10px 0",
  background: "#b91c1c",
  border: "1px solid rgba(255,255,255,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
};

export const main = { padding: 18 };
