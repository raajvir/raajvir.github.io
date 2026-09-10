import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./Crosshair.css";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, summary";

/**
 * Replaces the pointer with a single ring that swells over anything
 * clickable. Desktop fine-pointer only — never on touch, never under
 * reduced motion, and never below 900px.
 */
export function Crosshair() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [overInteractive, setOverInteractive] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 600, damping: 40, mass: 0.15 });
  const y = useSpring(rawY, { stiffness: 600, damping: 40, mass: 0.15 });

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

  if (!active) return null;

  return (
    <div className="xhair" aria-hidden="true" data-visible={visible ? "true" : "false"}>
      <motion.div
        className={`xhair-ring${overInteractive ? " is-over" : ""}`}
        style={{ x, y }}
      />
    </div>
  );
}
