import React from "react";
import { HiOutlineLockClosed } from "react-icons/hi";
import { navBtn } from "./shellStyles";

export default function LockButton({ collapsed, onClick }) {
  const iconStyle = { fontSize: 20, color: "#fff" };
  const labelStyle = { display: collapsed ? "none" : "inline", whiteSpace: "nowrap" };

  return (
    <div
      style={{ ...navBtn(false), marginTop: "auto" }}
      onClick={onClick}
      title="Lock"
    >
      <HiOutlineLockClosed style={iconStyle} />
      <span style={labelStyle}>Lock</span>
    </div>
  );
}