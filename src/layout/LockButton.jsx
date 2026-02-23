import React, { useState } from "react";
import { HiOutlineLockClosed } from "react-icons/hi";
import { navBtn } from "./shellStyles";
import ConfirmModal from "../components/ConfirmModal"; // ✅ adjust path
import { C as COLORS } from "./shellStyles"; // uses your sidebar C

export default function LockButton({ collapsed, onClick }) {
  const [open, setOpen] = useState(false);

  const iconStyle = { fontSize: 20, color: "#fff" };
  const labelStyle = { display: collapsed ? "none" : "inline", whiteSpace: "nowrap" };

  return (
    <>
      <div style={{ ...navBtn(false), marginTop: "auto" }} onClick={() => setOpen(true)} title="Lock">
        <HiOutlineLockClosed style={iconStyle} />
        <span style={labelStyle}>Lock</span>
      </div>

      <ConfirmModal
        C={{
          primary: COLORS.primary,
          primaryDark: COLORS.navySoft || "#7f1d1d",
          border: "rgba(17,24,39,0.10)",
          muted: "rgba(15,23,42,0.62)",
        }}
        open={open}
        title="Lock System"
        message="Are you sure you want to lock the system?"
        cancelText="Cancel"
        confirmText="Yes, Lock"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onClick?.(); // ✅ Shell.requestLock()
        }}
      />
    </>
  );
}