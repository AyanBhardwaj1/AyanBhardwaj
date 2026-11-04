"use client";

import { useEffect } from "react";
import "./jarvis.css";

const ATTR = "data-jarvis-boot";
const LINES = [
  "VALIDATING SECURE CONNECTIONS…",
  "INITIALIZING NEURAL CORE",
  "MOSS LOCAL INDEX: ONLINE",
  "OPENROUTER: LINKED",
  "TEXT CORE READY",
];

/**
 * Boot sequence, once per tab session, on a full page load only (a client
 * navigation from the home card keeps its morph). The inline script decides
 * before first paint; the timeline is pure CSS and ends itself. JS adds
 * Esc/click to skip. Never shown under reduced motion or without JS.
 */
const decide = `try{if(!sessionStorage.getItem("jarvis-booted")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("${ATTR}","");sessionStorage.setItem("jarvis-booted","1")}}catch(e){}`;

export function BootOverlay() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute(ATTR)) return;
    const end = () => html.removeAttribute(ATTR);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && end();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(end, 1500);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      end();
    };
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <div
        className="jv-boot"
        aria-hidden="true"
        onClick={() => document.documentElement.removeAttribute(ATTR)}
      >
        <div className="jv-bootReactor">
          <i />
          <i />
          <i />
        </div>
        <ol className="jv-bootLines">
          {LINES.map((l, i) => (
            <li key={l} style={{ "--i": i } as React.CSSProperties}>
              {l}
            </li>
          ))}
        </ol>
        <span className="jv-bootSkip">SKIP ▸ ESC</span>
      </div>
    </>
  );
}
