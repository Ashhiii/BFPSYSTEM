import React from "react";
import {
  HiOutlineDatabase,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlinePrinter,
} from "react-icons/hi";

export default function InsightCard({
  C,
  totalRecords,
  renewedCount,
  onDownloadAll,
  onPrint,
}) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 26,
        background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary} 60%, #111827)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: C.shadow,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(255,255,255,.22)",
            position: "absolute",
            right: -260,
            top: -260,
            filter: "blur(2px)",
          }}
        />
        <div
          style={{
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(0,0,0,.20)",
            position: "absolute",
            left: -220,
            bottom: -220,
            filter: "blur(2px)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>Overview</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                opacity: 0.8,
                fontWeight: 600,
              }}
            >
              Summary of your system data
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <IconActionBtn
              title="Download Selected"
              onClick={onDownloadAll}
              icon={<HiOutlineDownload size={15} />}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <StatPill
            label="Total Records"
            value={totalRecords}
            icon={<HiOutlineDatabase size={22} />}
          />

          <StatPill
            label="Renewed"
            value={renewedCount}
            icon={<HiOutlineRefresh size={22} />}
          />
        </div>
      </div>
    </div>
  );
}

function IconActionBtn({ title, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: "1px solid rgba(255,255,255,0.20)",
        background: "rgba(255,255,255,0.12)",
        color: "#fff",
        width: 32,
        height: 32,
        borderRadius: 14,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
        transition: "all .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.20)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.12)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon}
    </button>
  );
}

function StatPill({ label, value, small, icon }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.20)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: small ? 16 : 34,
            fontWeight: 900,
            lineHeight: 1.05,
          }}
        >
          {value}
        </div>
      </div>

      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
    </div>
  );
}