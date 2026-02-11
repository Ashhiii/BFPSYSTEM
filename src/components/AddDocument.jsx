import React, { useState } from "react";

export default function AddDocument({ setRefresh }) {
  const [form, setForm] = useState({
    teamLeader: "",
    ioNumber: "",
    ioDate: "",
    chief: "",
    districtMarshall: "",
    contactNumber: "",   
    ownerName: "",       
    establishmentName: "",
    businessAddress: "",
    nfsiDate: "",
    inspectors: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        alert("Document added!");
        // reset form
        setForm({
          teamLeader: "",
          ioNumber: "",
          ioDate: "",
          chief: "",
          districtMarshall: "",
          contactNumber: "",
          ownerName: "",
          establishmentName: "",
          businessAddress: "",
          nfsiDate: "",
          inspectors: "",
        });
        setRefresh((prev) => !prev); // refresh table
      } else {
        alert("Failed to add document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding document.");
    }
  };

  return (
    <div>
      <h2>Add Document</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(form).map((key) => (
          <div key={key} style={{ marginBottom: "8px" }}>
            <label style={{ width: "150px", display: "inline-block" }}>
              {key}
            </label>
            <input
              type="text"
              name={key}
              value={form[key]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit">Add Document</button>
      </form>
    </div>
  );
}
