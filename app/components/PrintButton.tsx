"use client";

export default function PrintButton() {
  return (
    <button
      className="btn btnPrimary"
      onClick={() => window.print()}
    >
      🖨️ Print / Save PDF
    </button>
  );
}