import type React from "react";
import { useEffect, useRef } from "react";
import type { Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./Credentials.css";

const COURSEWORK_PREFIX = "Coursework:";

type Chip = { key: string; text: string };

function chipsFor(entry: Section["entries"][number]): Chip[] {
  const chips: Chip[] = [];

  entry.stats?.forEach((stat, i) => {
    const value = stat.value.toFixed(1);
    chips.push({ key: `stat-${i}`, text: `${stat.label} ${stat.prefix ?? ""}${value}${stat.suffix ?? ""}` });
  });

  entry.bullets
    ?.filter((bullet) => !bullet.startsWith(COURSEWORK_PREFIX))
    .forEach((bullet, i) => chips.push({ key: `bullet-${i}`, text: bullet }));

  return chips;
}

/**
 * Education rendered as "super-licence" credential cards. Bullets and stats
 * both flatten into the same row of badge chips, except a coursework line
 * (too long to read as a chip) which drops to a full-width line instead.
 */
export function Credentials({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);

  // One delegated listener rather than a handler per card, so the art layer
  // can stay pointer-events:none and never swallow a click on the card link.
  useEffect(() => {
    if (reduced) return;
    const grid = gridRef.current;
    if (!grid) return;

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>(".cred-card--has-art");
      const art = card?.querySelector<HTMLElement>(".cred-art");
      if (!art || !card) return;
      // Clamp the card's centre so it never leaves the row. Its size follows
      // the image's own aspect ratio, so it has to be measured.
      const r = card.getBoundingClientRect();
      const w = art.offsetWidth;
      const h = art.offsetHeight;
      const maskRect = card.querySelector<SVGRectElement>(".cred-art-maskrect");
      if (maskRect && maskRect.getAttribute("width") !== String(w)) {
        maskRect.setAttribute("width", String(w));
        maskRect.setAttribute("height", String(h));
      }
      const halfW = w / 2;
      const halfH = h / 2;
      const x = Math.min(Math.max(event.clientX - r.left, halfW), r.width - halfW);
      const y = Math.min(Math.max(event.clientY - r.top, halfH), r.height - halfH);
      art.style.setProperty("--art-x", `${x}px`);
      art.style.setProperty("--art-y", `${y}px`);
    };

    grid.addEventListener("pointermove", onMove);
    return () => grid.removeEventListener("pointermove", onMove);
  }, [reduced]);

  const labelId = `${section.id}-label`;

  return (
    <section id={section.id} className="cred-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label cred-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="cred-blurb">{section.blurb}</p>}

        <div className="cred-grid" ref={gridRef}>
          {section.entries.map((entry, i) => {
            const chips = chipsFor(entry);
            const coursework = entry.bullets?.filter((bullet) => bullet.startsWith(COURSEWORK_PREFIX));

            return (
              <Reveal
                as="div"
                index={reduced ? 0 : i}
                key={entry.id}
                className={`cred-card${entry.image ? " cred-card--has-art" : ""}`}
              >
                {entry.image && !reduced && (
                  <>
                    <svg className="cred-art-defs" aria-hidden="true">
                      <mask
                        id={`cred-art-mask-${entry.id}`}
                        maskUnits="userSpaceOnUse"
                        x="-40"
                        y="-40"
                        width="2000"
                        height="2000"
                      >
                        <rect
                          className="cred-art-maskrect"
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
                      className="cred-art"
                      src={entry.image}
                      alt=""
                      aria-hidden="true"
                      style={
                        {
                          mask: `url(#cred-art-mask-${entry.id})`,
                          WebkitMask: `url(#cred-art-mask-${entry.id})`,
                        } as React.CSSProperties
                      }
                    />
                  </>
                )}
                <span className="cred-bar" aria-hidden="true" />

                <div className="cred-head">
                  <div className="cred-heading">
                    <h3 className="cred-title">
                      {entry.href ? (
                        <a
                          className="cred-title-link"
                          href={entry.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.title}
                          <span className="cred-title-arrow" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      ) : (
                        entry.title
                      )}
                    </h3>
                    {entry.org && <p className="cred-org">{entry.org}</p>}
                    {entry.role && <p className="cred-role">{entry.role}</p>}
                    {entry.location && <p className="cred-location">{entry.location}</p>}
                  </div>
                  <p className="cred-date">{entry.date}</p>
                </div>

                {chips.length > 0 && (
                  <div className="cred-chips">
                    {chips.map((chip) => (
                      <span className="cred-chip" key={chip.key}>
                        {chip.text}
                      </span>
                    ))}
                  </div>
                )}

                {coursework?.map((line, i) => (
                  <p className="cred-coursework" key={`coursework-${i}`}>
                    {line}
                  </p>
                ))}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
