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
      const r = card.getBoundingClientRect();
      art.style.setProperty("--art-x", `${event.clientX - r.left}px`);
      art.style.setProperty("--art-y", `${event.clientY - r.top}px`);
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
                  <span
                    className="cred-art"
                    aria-hidden="true"
                    style={{ backgroundImage: `url(${entry.image})` }}
                  />
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
