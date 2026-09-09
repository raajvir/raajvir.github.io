import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionValueEvent } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./Crosshair.css";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, summary";
const pad4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/**
 * Telemetry-style cursor: full-bleed crosshair lines, a reticle box and a live
 * coordinate readout. Desktop fine-pointer only — never on touch, never under
 * reduced motion, and never below 900px.
 */
export function Crosshair() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [overInteractive, setOverInteractive] = useState(false);
  const [readout, setReadout] = useState({ x: 0, y: 0 });

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 600, damping: 40, mass: 0.15 });
  const y = useSpring(rawY, { stiffness: 600, damping: 40, mass: 0.15 });

  // Only run on a fine pointer, a wide viewport, and with motion allowed.
  useEffect(() => {
    if (reduced) {
      setActive(false);
      return;
    }
    const fine = window.matchMedia("(pointer: fine)");
    const wide = window.matchMedia("(min-width: 900px)");
    const evaluate = () => setActive(fine.matches && wide.matches);
    evaluate();
    fine.addEventListener("change", evaluate);
    wide.addEventListener("change", evaluate);
    return () => {
      fine.removeEventListener("change", evaluate);
      wide.removeEventListener("change", evaluate);
    };
  }, [reduced]);

  // Hide the native cursor only while we are actually drawing our own.
  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("xhair-hide-native");
    return () => document.documentElement.classList.remove("xhair-hide-native");
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      setOverInteractive(Boolean(target?.closest?.(INTERACTIVE)));
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, [active, visible, rawX, rawY]);

  // The readout only needs to keep up with the eye, not with every frame.
  useMotionValueEvent(x, "change", (v) => setReadout((p) => (Math.round(v) === p.x ? p : { ...p, x: v })));
  useMotionValueEvent(y, "change", (v) => setReadout((p) => (Math.round(v) === p.y ? p : { ...p, y: v })));

  if (!active) return null;

  return (
    <div className="xhair" aria-hidden="true" data-visible={visible ? "true" : "false"}>
      <motion.div className="xhair-line xhair-line--h" style={{ y }} />
      <motion.div className="xhair-line xhair-line--v" style={{ x }} />
      <motion.div
        className={`xhair-reticle${overInteractive ? " is-over" : ""}`}
        style={{ x, y }}
      />
      <motion.div className="xhair-readout" style={{ x, y }}>
        X:{pad4(readout.x)} Y:{pad4(readout.y)}
      </motion.div>
    </div>
  );
}
