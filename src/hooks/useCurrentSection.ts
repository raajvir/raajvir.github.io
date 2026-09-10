import { useEffect } from "react";

/**
 * Marks whichever content section the reader is currently inside with
 * `is-current`, so its rule can stay lit while the others sit faint.
 *
 * "Inside" means the section straddles the line just below the fixed
 * header — the same line its label sticks to — rather than merely being
 * on screen, so exactly one section is ever current.
 */
export function useCurrentSection() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main > section:not(.hero)")
    );
    if (!sections.length) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const header =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h")
        ) || 100;
      const line = header + 2;

      let current: HTMLElement | null = null;
      for (const section of sections) {
        const r = section.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) {
          current = section;
          break;
        }
      }
      // Above the first section, treat the first as current so the page never
      // renders with every rule faint.
      if (!current && sections[0].getBoundingClientRect().top > line) {
        current = sections[0];
      }

      for (const section of sections) {
        section.classList.toggle("is-current", section === current);
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
      sections.forEach((s) => s.classList.remove("is-current"));
    };
  }, []);
}
