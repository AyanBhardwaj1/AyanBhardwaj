/** The six styles the page can wear, keyed to a major (shared by server and client). */
export const STYLES = [
  { id: "terminal", major: "Computer science", name: "Terminal" },
  { id: "ledger", major: "Finance", name: "Ledger" },
  { id: "journal", major: "Government", name: "Journal" },
  { id: "lab", major: "Biology", name: "Lab" },
  { id: "atelier", major: "Design", name: "Atelier" },
  { id: "studio", major: "Something else", name: "Studio" },
] as const;
