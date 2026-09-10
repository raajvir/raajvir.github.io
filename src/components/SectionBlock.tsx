import type React from "react";
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
 * accent-red on hover. A genuine "fastest lap" result is marked by a purple
 * shine travelling along its edge rather than by recolouring the text. Any
 * other section `kind` still falls back to this layout rather than
 * rendering nothing.
 */
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

      // Keep the card fully inside the row. The card keeps each image's own
      // aspect ratio, so its size has to be measured rather than assumed.
      const rect = entry.getBoundingClientRect();
      const art = entry.querySelector<HTMLElement>(".sec-art");
      const w = art?.offsetWidth ?? 0;
      const h = art?.offsetHeight ?? 0;
      const rect2 = entry.querySelector<SVGRectElement>(".sec-art-maskrect");
      if (rect2 && rect2.getAttribute("width") !== String(w)) {
        rect2.setAttribute("width", String(w));
        rect2.setAttribute("height", String(h));
      }
      const halfW = w / 2;
      const halfH = h / 2;
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
                  <>
                    {/* The mask rect is sized to the image in JS: each photo has
                        its own aspect ratio, so a shared mask cannot line up
                        with every card's edges. */}
                    <svg className="sec-art-defs" aria-hidden="true">
                      <mask
                        id={`sec-art-mask-${entry.id}`}
                        maskUnits="userSpaceOnUse"
                        x="-40"
                        y="-40"
                        width="2000"
                        height="2000"
                      >
                        <rect
                          className="sec-art-maskrect"
                          x="0"
                          y="0"
                          width="10"
                          height="10"
                          fill="#fff"
                          filter="url(#art-distort)"
                        />
                      </mask>
                    </svg>
                    <img
                      className="sec-art"
                      src={entry.image}
                      alt=""
                      aria-hidden="true"
                      style={
                        {
                          mask: `url(#sec-art-mask-${entry.id})`,
                          WebkitMask: `url(#sec-art-mask-${entry.id})`,
                        } as React.CSSProperties
                      }
                    />
                  </>
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
                  <div className="sec-heading">
                    {/* A company with a logo is identified by the mark alone;
                        the name stays in the heading for screen readers. */}
                    <h3 className={`sec-title${entry.logo ? " sec-title--logo" : ""}`}>
                      {entry.href ? (
                        <a
                          className="sec-title-link"
                          href={entry.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.logo ? (
                            <>
                              <img className="sec-logo" src={entry.logo} alt={entry.title} />
                              <span className="sec-title-arrow" aria-hidden="true">
                                &rarr;
                              </span>
                            </>
                          ) : (
                            <>
                              {entry.title}
                              <span className="sec-title-arrow" aria-hidden="true">
                                &rarr;
                              </span>
                            </>
                          )}
                        </a>
                      ) : entry.logo ? (
                        <img className="sec-logo" src={entry.logo} alt={entry.title} />
                      ) : (
                        entry.title
                      )}
                    </h3>
                  </div>

                  {entry.role && <p className="sec-role">{entry.role}</p>}
                  {entry.org && <p className="sec-role sec-org">{entry.org}</p>}

                  {entry.stats && entry.stats.length > 0 && <StatRow stats={entry.stats} />}

                  {entry.summary && <p className="sec-summary">{entry.summary}</p>}

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

                  {entry.extraLinks && entry.extraLinks.length > 0 && (
                    <ul className="sec-links">
                      {entry.extraLinks.map((link) => (
                        <li key={link.href}>
                          <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.label}
                            <span aria-hidden="true"> &rarr;</span>
                          </a>
                        </li>
                      ))}
                    </ul>
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
                      {fastest && <span className="sr-only">Fastest lap</span>}
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
