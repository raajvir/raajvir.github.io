import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
};

/** easeOutExpo: fast start, long soft settle — matches a telemetry readout. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatNumber(n: number, isFraction: boolean, useThousands: boolean): string {
  if (isFraction) return n.toFixed(1);
  const rounded = Math.round(n);
  return useThousands ? rounded.toLocaleString("en-US") : String(rounded);
}

/**
 * Counts up from 0 to `value` once it scrolls into view, driven by
 * requestAnimationFrame rather than setInterval so it stays in step with
 * paint. Integers >= 10,000 get thousands separators; values with a
 * fractional part (e.g. a GPA) stay at one decimal place throughout.
 */
export function CountUp({ value, prefix = "", suffix = "", durationMs = 1100 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = usePrefersReducedMotion();

  const isFraction = !Number.isInteger(value);
  const useThousands = Number.isInteger(value) && Math.abs(value) >= 10000;
  const finalDisplay = formatNumber(value, isFraction, useThousands);

  const [display, setDisplay] = useState(() =>
    reduced ? finalDisplay : formatNumber(0, isFraction, useThousands)
  );

  useEffect(() => {
    if (reduced) {
      setDisplay(finalDisplay);
      return;
    }
    if (!inView) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = easeOutExpo(progress);
      setDisplay(formatNumber(value * eased, isFraction, useThousands));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value, durationMs, isFraction, useThousands, finalDisplay]);

  return (
    <span ref={ref} className="tabular">
      <span aria-hidden="true">
        {prefix}
        {display}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {finalDisplay}
        {suffix}
      </span>
    </span>
  );
}
