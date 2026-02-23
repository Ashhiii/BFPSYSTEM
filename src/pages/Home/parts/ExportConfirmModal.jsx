import React from "react";
import ConfirmModal from "../../../components/ConfirmModal"; // ✅ adjust path

export default function ExportConfirmModal({ C, exporting, onCancel, onConfirm }) {
  return (
    <ConfirmModal
      C={C}
      open={true}
      title="Confirm Export"
      message={
        <>
          This will download <b>ALL current records</b> as an Excel file. Continue?
        </>
      }
      cancelText="Cancel"
      confirmText={exporting ? "Exporting..." : "Yes, Export"}
      busy={exporting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}