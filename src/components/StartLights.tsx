import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./StartLights.css";

const SESSION_KEY = "rv-launched";
const COLUMN_COUNT = 5;
const STEP_MS = 600;
const INITIAL_HOLD_MS = 400;
const HOLD_MIN_MS = 700;
const HOLD_MAX_MS = 1400;

type Props = {
  onDone: () => void;
};

/** The full-screen F1 start-lights intro sequence, played once per session. */
export function StartLights({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();

  // Computed synchronously (before first paint) so a skipped session never
  // renders the overlay even for a single frame.
  const [skip, setSkip] = useState(() => {
    if (reduced) return true;
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [litCount, setLitCount] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [wipe, setWipe] = useState(false);
  const doneRef = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    setLightsOut(true);
    onDone();
    window.setTimeout(() => setWipe(true), 0);
  };

  // If this session should skip the sequence entirely, just signal done.
  useEffect(() => {
    if (!skip) return;
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  // Run the sequence when it's allowed to play.
  useEffect(() => {
    if (skip) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
      return id;
    };

    for (let i = 1; i <= COLUMN_COUNT; i++) {
      schedule(() => setLitCount(i), INITIAL_HOLD_MS + (i - 1) * STEP_MS);
    }

    const allLitAt = INITIAL_HOLD_MS + COLUMN_COUNT * STEP_MS;
    const hold = HOLD_MIN_MS + Math.random() * (HOLD_MAX_MS - HOLD_MIN_MS);
    schedule(finish, allLitAt + hold);

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scroll while the overlay is up. The scroll container is <html>, not
  // <body>, so body-only overflow does nothing — both have to be pinned, and
  // keyboard scrolling (space/arrows/page keys) has to be swallowed too.
  useEffect(() => {
    if (skip) return;
    const root = document.documentElement;
    const prevRoot = root.style.overflow;
    const prevBody = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const SCROLL_KEYS = new Set([
      " ", "Spacebar", "PageUp", "PageDown", "End", "Home",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    ]);
    const blockKeyScroll = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", blockKeyScroll, { passive: false });

    return () => {
      root.style.overflow = prevRoot;
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", blockKeyScroll);
    };
  }, [skip]);

  useEffect(() => {
    if (!wipe) return;
    const t = window.setTimeout(() => setSkip(true), 750);
    return () => window.clearTimeout(t);
  }, [wipe]);

  const handleSkip = () => finish();

  // Allow skipping via any keypress; does not steal focus from the page.
  useEffect(() => {
    if (skip) return;
    window.addEventListener("keydown", handleSkip);
    return () => window.removeEventListener("keydown", handleSkip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  if (skip) return null;

  return (
    <AnimatePresence>
      {!wipe ? (
        <motion.div
          className="lights-overlay"
          role="presentation"
          aria-hidden="true"
          onClick={handleSkip}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="lights-gantry">
            {Array.from({ length: COLUMN_COUNT }).map((_, col) => (
              <div className="lights-column" key={col}>
                {Array.from({ length: 2 }).map((__, row) => (
                  <span
                    key={row}
                    className={
                      "lights-bulb" +
                      (litCount > col && !lightsOut ? " lights-bulb--on" : "")
                    }
                  />
                ))}
              </div>
            ))}
          </div>
          <p className={"lights-caption" + (lightsOut ? " lights-caption--visible" : "")}>
            Lights Out And Away We Go
          </p>
          <span className="lights-skip">click to skip</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
