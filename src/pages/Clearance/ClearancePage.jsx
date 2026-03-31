import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";

import ClearanceTable from "../../pages/Clearance/ClearanceTable";
import ClearanceDetailsPanel from "../../pages/Clearance/ClearanceDetailsPanel";
import DetailsFullScreen from "../../components/DetailsFullScreen.jsx";
import AddClearance from "../../components/AddClearance.jsx";

const C = {
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  gold: "#f59e0b",
  softBg: "#fef2f2",
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
};

export default function ClearancePage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingClearance, setEditingClearance] = useState(null);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchClearances = async () => {
    try {
      setLoading(true);
      const qy = query(collection(db, "clearances"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClearances(list);
    } catch (error) {
      console.error("Failed to fetch clearances:", error);
      setClearances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    if (!key) return clearances;

    return (clearances || []).filter((item) => {
      return (
        (item.type || "").toLowerCase().includes(key) ||
        (item.ownerName || "").toLowerCase().includes(key) ||
        (item.establishmentName || "").toLowerCase().includes(key) ||
        (item.businessAddress || "").toLowerCase().includes(key) ||
        (item.orNumber || "").toLowerCase().includes(key) ||
        (item.orDate || "").toLowerCase().includes(key) 
      );
    });
  }, [clearances, search]);

  const handleEdit = (item) => {
    setEditingClearance(item);
    setShowForm(true);
    setShowDetails(false);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this clearance?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "clearances", id));
      setShowDetails(false);
      setSelectedClearance(null);
      await fetchClearances();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete clearance");
    }
  };

  const handleSaved = async () => {
    setEditingClearance(null);
    setShowForm(false);
    await fetchClearances();
  };

  const onSelectRow = (item) => {
    setSelectedClearance(item);
    setShowDetails(true);
  };

  const page = {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
  };

  const header = {
    borderRadius: 24,
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: "#fff",
    background: `
      radial-gradient(circle at 85% 20%, rgba(255,255,255,0.18), transparent 40%),
      linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #080404 100%)
    `,
    boxShadow: "0 20px 40px rgba(0,0,0,.25)",
  };

  const searchCard = {
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    padding: 12,
  };

  const content = {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
  };

  const card = {
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  };

  const cardHead = {
    padding: 10,
    borderBottom: `1px solid ${C.border}`,
    color: C.primaryDark,
    fontWeight: 950,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    background: C.softBg,
  };

  const scrollSlot = {
    flex: 1,
    overflow: "hidden",
    minHeight: 0,
  };

  const fullTitle =
    selectedClearance?.establishmentName ||
    selectedClearance?.ownerName ||
    "Clearance Details";

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 950, color: C.bg }}>
            Clearance Management
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.bg, marginTop: 6 }}>
            Clearance records • Edit • Delete • View details
          </div>
        </div>
      </div>

      {showForm ? (
        <div style={{ overflow: "auto", paddingRight: 4 }}>
          <AddClearance
            editingClearance={editingClearance}
            onSaved={handleSaved}
            onCancel={() => {
              setEditingClearance(null);
              setShowForm(false);
            }}
          />
        </div>
      ) : (
        <>
          <div style={searchCard}>
            <input
              placeholder="🔍 Search clearances..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                outline: "none",
                fontWeight: 850,
                color: C.text,
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginTop: 8 }}>
              Click a row → clearance details opens full screen
            </div>
          </div>

          <div style={content}>
            <div style={card}>
              <div style={cardHead}>
                <div>Clearance List</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>
                  Results: {filtered.length}
                </div>
              </div>

              <div style={scrollSlot}>
                {loading ? (
                  <div style={{ padding: 20, color: C.muted, fontWeight: 800 }}>
                    Loading clearances...
                  </div>
                ) : (
                  <ClearanceTable
                    clearances={filtered}
                    onRowClick={onSelectRow}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <DetailsFullScreen
        open={showDetails}
        title={fullTitle}
        onClose={() => setShowDetails(false)}
      >
<ClearanceDetailsPanel
  clearance={selectedClearance}
  onEdit={(item) => {
    setShowDetails(false);
    handleEdit(item);
  }}
  onDelete={handleDelete}
  onUpdated={(updatedItem) => {
    setSelectedClearance(updatedItem);
    setClearances((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  }}
/>
      </DetailsFullScreen>
    </div>
  );
}