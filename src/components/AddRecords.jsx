import React, { useState } from "react";

export default function AddRecords({ setRefresh }) {
  const initialState = {
    no: "",
    fsicAppNo: "",
    natureOfInspection: "",
    ownerName: "",
    establishmentName: "",
    businessAddress: "",
    contactNumber: "",
    dateInspected: "",
    ioNumber: "",
    ioDate: "",
    nfsiNumber: "",
    nfsiDate: "",
    fsicValidity: "",
    defects: "",
    inspectors: "",
    occupancyType: "",
    buildingDesc: "",
    floorArea: "",
    buildingHeight: "",
    storeyCount: "",
    highRise: "",
    fsmr: "",
    remarks: "",
    orNumber: "",
    orAmount: "",
    orDate: "",
  };

  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async () => {
    if (!form.ownerName || !form.establishmentName)
      return alert("Required fields missing");

    const res = await fetch("http://localhost:5000/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.success) {
      alert("Saved");
      setForm(initialState);
      setRefresh(p => !p);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "500px" }}>
      {Object.keys(initialState).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={key}
          value={form[key]}
          onChange={handleChange}
        />
      ))}
      <button onClick={submit}>Save</button>
    </div>
  );
}
