import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Lights exactly one content section at a time — whichever one crosses the
 * viewport's centre line inverts to black while the rest stay white.
 *
 * The classes are applied to the existing <section> elements rather than
 * threaded through every component, so the section renderers stay unaware
 * of it. Skipped entirely under reduced motion, where a page that flips
 * between black and white as you scroll would be hostile.
 */
export function useLitSection() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main > section:not(.hero)")
    );
    if (!sections.length) return;
    sections.forEach((s) => s.classList.add("surface"));

    let frame = 0;

    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const section of sections) {
        const r = section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        // A section straddling the centre line always wins; otherwise take
        // whichever centre sits closest to it.
        const score =
          r.top <= mid && r.bottom >= mid
            ? -1
            : Math.abs((r.top + r.bottom) / 2 - mid);
        if (score < bestScore) {
          bestScore = score;
          best = section;
        }
      }

      for (const section of sections) {
        section.classList.toggle("is-lit", section === best);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      sections.forEach((s) => s.classList.remove("surface", "is-lit"));
    };
  }, [reduced]);
}
