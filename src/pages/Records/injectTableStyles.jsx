let injected = false;

export default function injectTableStyles() {
  if (injected) return;
  injected = true;

  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    table thead th {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 13px;
      white-space: nowrap;
      z-index: 2;
    }

    table tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      white-space: nowrap;
    }

    table tbody tr:hover {
      background: #f1f5f9;
    }
  `;
  document.head.appendChild(styleSheet);
}
