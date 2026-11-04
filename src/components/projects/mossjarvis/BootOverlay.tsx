"use client";

import { useEffect, useSyncExternalStore } from "react";
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
 * before first paint; the timeline is pure CSS (about 1.2s) and ends itself.
 * JS lets any key, click, scroll or tap skip it. Never shown under reduced
 * motion or without JS.
 */
const decide = `try{if(!sessionStorage.getItem("jarvis-booted")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("${ATTR}","");sessionStorage.setItem("jarvis-booted","1")}}catch(e){}`;

const noop = () => () => {};

export function BootOverlay() {
  // The inline script only belongs in server HTML (it runs before first
  // paint). True while hydrating, false for client navigations, where React
  // would warn about a script it never executes and the boot is skipped.
  const fromServer = useSyncExternalStore(
    noop,
    () => false,
    () => true,
  );
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute(ATTR)) return;
    // Any intent to use the page skips it: a key, a click, a scroll, a tap.
    const evs = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    const end = () => {
      html.removeAttribute(ATTR);
      evs.forEach((e) => window.removeEventListener(e, end));
    };
    evs.forEach((e) => window.addEventListener(e, end, { passive: true }));
    const t = window.setTimeout(end, 1300);
    return () => {
      window.clearTimeout(t);
      end();
    };
  }, []);

  return (
    <>
      {fromServer && <script dangerouslySetInnerHTML={{ __html: decide }} />}
      <div className="jv-boot" aria-hidden="true">
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
        <span className="jv-bootSkip">PRESS ANY KEY TO SKIP</span>
      </div>
    </>
  );
}
