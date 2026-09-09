import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import type { Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SplitFlapDate } from "./ui/SplitFlapDate";
import { StatRow } from "./ui/StatRow";
import { SkewHeading } from "./ui/SkewHeading";
import "./SectionBlock.css";

/**
 * Core content renderer, shared by MOTORSPORT and EXPERIENCE. Each entry is
 * a "timing-tower" row: a sector bar wipes in on scroll and the title turns
 * accent-red on hover — or, for a genuine "fastest lap" result, purple from
 * the start. Any other section `kind` still falls back to this layout
 * rather than rendering nothing.
 */
/** Card size as a fraction of the row — must match .sec-art in the CSS. */
const ART_W = 0.4;
const ART_H = 0.55;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function SectionBlock({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const labelId = `${section.id}-label`;
  const listRef = useRef<HTMLUListElement>(null);
  const activeArtRef = useRef<HTMLElement | null>(null);

  // Fine-pointer + motion-allowed gate for the per-entry cursor-revealed
  // background art (mirrors ProjectGrid's own spotlight gate).
  const artEnabled = useMemo(
    () => !reduced && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
    [reduced]
  );

  // One delegated pointermove/pointerleave pair on the list, rather than a
  // handler per entry — cheaper, and avoids needing to thread refs through
  // the shared <Reveal> wrapper. Writes CSS custom properties directly rather
  // than using React state, so trailing the cursor never re-renders.
  useEffect(() => {
    if (!artEnabled) return;
    const list = listRef.current;
    if (!list) return;

    function clearActive() {
      activeArtRef.current?.classList.remove("sec-entry--art-active");
      activeArtRef.current = null;
    }

    function handlePointerMove(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      const entry = target?.closest<HTMLElement>(".sec-entry--has-art") ?? null;
      if (!entry) {
        clearActive();
        return;
      }
      if (activeArtRef.current !== entry) {
        clearActive();
        entry.classList.add("sec-entry--art-active");
        activeArtRef.current = entry;
      }

      // Keep the card fully inside the row: clamp the centre by half the
      // card's size. These fractions mirror the width/height in the CSS.
      const rect = entry.getBoundingClientRect();
      const halfW = (rect.width * ART_W) / 2;
      const halfH = (rect.height * ART_H) / 2;
      const x = clamp(event.clientX - rect.left, halfW, rect.width - halfW);
      const y = clamp(event.clientY - rect.top, halfH, rect.height - halfH);
      entry.style.setProperty("--art-x", `${x}px`);
      entry.style.setProperty("--art-y", `${y}px`);
    }

    list.addEventListener("pointermove", handlePointerMove);
    list.addEventListener("pointerleave", clearActive);
    return () => {
      list.removeEventListener("pointermove", handlePointerMove);
      list.removeEventListener("pointerleave", clearActive);
      clearActive();
    };
  }, [artEnabled]);

  return (
    <section id={section.id} className="sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label sec-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="sec-blurb">{section.blurb}</p>}

        <ul className="sec-list" ref={listRef}>
          {section.entries.map((entry, i) => {
            const fastest = entry.fastest === true;
            const singleBullet = entry.bullets && entry.bullets.length === 1;
            const hasArt = artEnabled && Boolean(entry.image);
            const entryClassName = ["sec-entry", fastest && "sec-entry--fastest", hasArt && "sec-entry--has-art"]
              .filter(Boolean)
              .join(" ");

            return (
              <Reveal as="li" index={i} key={entry.id} className={entryClassName}>
                {hasArt && (
                  <div
                    className="sec-art"
                    aria-hidden="true"
                    style={{ backgroundImage: `url(${entry.image})` }}
                  />
                )}
                <motion.span
                  className="sec-bar"
                  aria-hidden="true"
                  initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />

                <div className="sec-content">
                  {entry.href ? (
                    <h3 className="sec-title">
                      <a
                        className="sec-title-link"
                        href={entry.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {entry.title}
                        <span className="sec-title-arrow" aria-hidden="true">
                          &rarr;
                        </span>
                      </a>
                    </h3>
                  ) : (
                    <h3 className="sec-title">{entry.title}</h3>
                  )}

                  {entry.role && <p className="sec-role">{entry.role}</p>}
                  {entry.org && <p className="sec-role sec-org">{entry.org}</p>}

                  {entry.stats && entry.stats.length > 0 && <StatRow stats={entry.stats} />}

                  {entry.bullets && entry.bullets.length > 0 && (
                    singleBullet ? (
                      <p className="sec-desc">{entry.bullets[0]}</p>
                    ) : (
                      <ul className="sec-bullets">
                        {entry.bullets.map((bullet, bi) => (
                          <li key={bi}>{bullet}</li>
                        ))}
                      </ul>
                    )
                  )}

                  {entry.pullQuote && (
                    <Reveal as="div" delay={0.22} className="sec-pull-quote">
                      <blockquote>{entry.pullQuote}</blockquote>
                    </Reveal>
                  )}
                </div>

                {entry.date && (
                  <div className="sec-date">
                    <div className="sec-date-top">
                      <SplitFlapDate value={entry.date} />
                      {fastest && (
                        <span
                          className="sec-fastest-badge"
                          title="In F1 timing, purple marks the fastest lap of the session."
                        >
                          Fastest lap
                        </span>
                      )}
                    </div>
                    {entry.location && (
                      <div className="sec-location">
                        <span className="sec-location-sep" aria-hidden="true">
                          &middot;
                        </span>
                        {entry.location}
                      </div>
                    )}
                  </div>
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
