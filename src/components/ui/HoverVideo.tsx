"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted demo clip layered over a project card's still. It loads nothing
 * until the card is first hovered or focused, plays while the pointer is on
 * the card, and fades back to the still on leave. Mouse/trackpad only, and
 * never under reduced motion (the still stays). Decorative: the still
 * underneath carries the alt text.
 */
export function HoverVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    const card = video?.closest(".project-card");
    if (!video || !card) return;
    const ok = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const enter = () => {
      if (!ok.matches) return;
      if (!video.getAttribute("src")) video.setAttribute("src", src);
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    };
    const leave = () => {
      video.pause();
      setPlaying(false);
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("focusin", enter);
    card.addEventListener("focusout", leave);
    return () => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("focusin", enter);
      card.removeEventListener("focusout", leave);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
    />
  );
}
