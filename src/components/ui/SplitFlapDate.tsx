import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./SplitFlapDate.css";

const DIGITS = "0123456789";

const isDigit = (c: string) => c >= "0" && c <= "9";
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

/**
 * Only digits cycle. Letters and punctuation resolve immediately — riffling a
 * proportional letter changes its width every frame, which makes the whole
 * line jitter, and boxing letters into a fixed cell crushes wide glyphs.
 */
const settled = (c: string) => !isDigit(c);

/**
 * Dates rendered like an old split-flap timing board: each character riffles
 * through its character set, then locks left to right.
 */
export function SplitFlapDate({ value }: { value: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const chars = Array.from(value);

  const [display, setDisplay] = useState(() =>
    chars.map((c) => (settled(c) ? c : " "))
  );
  const [locked, setLocked] = useState(reduced ? chars.length : 0);

  useEffect(() => {
    if (reduced || !inView) return;

    let lockIndex = 0;
    const cycle = window.setInterval(() => {
      setDisplay(
        chars.map((c, i) => {
          if (i < lockIndex || settled(c)) return c;
          return pick(DIGITS);
        })
      );
    }, 40);

    const lock = window.setInterval(() => {
      lockIndex += 1;
      setLocked(lockIndex);
      if (lockIndex >= chars.length) {
        window.clearInterval(cycle);
        window.clearInterval(lock);
        setDisplay(chars);
      }
    }, 45);

    return () => {
      window.clearInterval(cycle);
      window.clearInterval(lock);
    };
    // `value` drives `chars`; re-running on a value change is correct.
  }, [inView, reduced, value]);

  if (reduced) {
    return <span className="flap">{value}</span>;
  }

  return (
    <span className="flap" ref={ref}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {chars.map((c, i) =>
          c === " " ? (
            <span className="flap-space" key={i} />
          ) : (
            <span
              className={`flap-cell${isDigit(c) ? " flap-cell--digit" : ""}${
                i < locked || settled(c) ? " is-locked" : ""
              }`}
              key={i}
            >
              <span className="flap-face" key={display[i]}>
                {display[i]}
              </span>
            </span>
          )
        )}
      </span>
    </span>
  );
}
