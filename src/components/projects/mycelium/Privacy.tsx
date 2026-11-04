"use client";

import { useState } from "react";
import "./mycelium.css";

/** The honest version of the privacy claim, driven by the summaries switch. */
export function Privacy() {
  const [summaries, setSummaries] = useState(false);
  const rows: {
    from: string;
    to: string;
    when: string;
    kind: "local" | "sync" | "off" | "on";
  }[] = [
    {
      from: "Page text + metadata",
      to: "chrome.storage.local",
      when: "Always. Written the moment a page passes the gates.",
      kind: "local",
    },
    {
      from: "Page text",
      to: "Your Moss project",
      when: "Synced, so the durable index can be built and loaded.",
      kind: "sync",
    },
    {
      from: "Search queries",
      to: "Moss WASM, inside the extension",
      when: "Local. No per-query network round trip once the index is loaded.",
      kind: "local",
    },
    {
      from: "Title + up to 12,000 chars",
      to: "OpenRouter",
      when: summaries
        ? "On: one sentence under 20 words per page, cached, never blocks ingestion."
        : "Off by default. Nothing is sent.",
      kind: summaries ? "on" : "off",
    },
  ];
  const tag = {
    local: "STAYS LOCAL",
    sync: "SYNCS",
    off: "NOT SENT",
    on: "SENT",
  };
  return (
    <div className="myc-privacy">
      <button
        type="button"
        role="switch"
        aria-checked={summaries}
        className="myc-switch"
        onClick={() => setSummaries((v) => !v)}
      >
        <span className="myc-switchTrack" aria-hidden="true">
          <span />
        </span>
        AI summaries {summaries ? "on" : "off"}
      </button>
      <ul className="myc-flows">
        {rows.map((r) => (
          <li key={r.to} data-kind={r.kind}>
            <span className="myc-flowFrom">{r.from}</span>
            <span className="myc-flowLine" aria-hidden="true" />
            <span className="myc-flowTo">{r.to}</span>
            <span className="myc-flowTag">{tag[r.kind]}</span>
            <span className="myc-flowWhen">{r.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
