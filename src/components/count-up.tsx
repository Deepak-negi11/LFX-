"use client";

import { useEffect, useRef } from "react";

/**
 * Counts from 0 up to `value` once, after a short delay.
 * Writes to the DOM directly (no React state per frame). The server HTML already has the
 * final number, so it is correct without JavaScript and with reduced motion.
 */
export function CountUp({ value, delay = 0, duration = 1100 }: { value: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Skip in background tabs (animation frames are paused there) and for reduced motion.
    if (!el || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fmt = (n: number) => n.toLocaleString("en-US");
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      el.textContent = fmt(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    const timer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay);
    // Safety net: always end on the real number, even if frames get throttled.
    const done = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    }, delay + duration + 400);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(done);
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    };
  }, [value, delay, duration]);

  return <span ref={ref}>{value.toLocaleString("en-US")}</span>;
}
