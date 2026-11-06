"use client";

/** Opens the browser's print dialog (Save as PDF works from there too). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="pill min-h-10"
    >
      Print / save as PDF
    </button>
  );
}
