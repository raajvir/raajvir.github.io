import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./ClickSpark.css";

type Spark = { id: number; x: number; y: number; lengths: number[] };

const MAX_SPARKS = 6;

/** A small burst of radiating lines wherever the visitor clicks. */
export function ClickSpark({ count = 8, duration = 500 }: { count?: number; duration?: number }) {
  const reduced = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) {
      setEnabled(false);
      return;
    }
    const fine = window.matchMedia("(pointer: fine)");
    const evaluate = () => setEnabled(fine.matches);
    evaluate();
    fine.addEventListener("change", evaluate);
    return () => fine.removeEventListener("change", evaluate);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;

      const id = nextId.current++;
      // Vary each ray so the burst reads as organic rather than an asterisk.
      const lengths = Array.from({ length: count }, () => 1 + (Math.random() - 0.5) * 0.5);
      setSparks((prev) => [...prev, { id, x: e.clientX, y: e.clientY, lengths }].slice(-MAX_SPARKS));

      const t = window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
        timers.current = timers.current.filter((x) => x !== t);
      }, duration);
      timers.current.push(t);
    };

    // Passive observation only — never intercepts the click.
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, [enabled, count, duration]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    []
  );

  if (!enabled) return null;

  return (
    <div className="spark-layer" aria-hidden="true">
      <AnimatePresence>
        {sparks.map((spark) => (
          <div key={spark.id} className="spark" style={{ left: spark.x, top: spark.y }}>
            {spark.lengths.map((scale, i) => (
              <motion.span
                key={i}
                className="spark-ray"
                style={{ rotate: (360 / spark.lengths.length) * i }}
                initial={{ scaleX: 0, opacity: 1, x: 4 }}
                animate={{ scaleX: scale, opacity: 0, x: 16 }}
                transition={{ duration: duration / 1000, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
