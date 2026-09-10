import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "motion/react";
import type { Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import { SplitFlapDate } from "./ui/SplitFlapDate";
import { CountUp } from "./ui/CountUp";
import "./Feature.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * A single headline entry, given a panel of its own rather than being one
 * row in a timing-tower list. Built for STARTUP / Somnia: the only section
 * with exactly one entry, and the point is that it deserves the extra
 * weight. The purple "fastest lap" treatment, the oversized stats and the
 * cursor-revealed artwork all borrow techniques already used elsewhere on
 * the site (SectionBlock, ProjectGrid, Podium) rather than inventing new
 * ones — this panel just gives them room to be the whole show.
 */
export function Feature({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const labelId = `${section.id}-label`;

  // Fine-pointer + motion-allowed gate for the cursor-revealed artwork,
  // computed once (mirrors SectionBlock / ProjectGrid's own gate).
  const artEnabled = useMemo(
    () => !reduced && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
    [reduced]
  );

  return (
    <section id={section.id} className="feature-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label feature-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="feature-blurb">{section.blurb}</p>}

        {section.entries.map((entry) => {
          const fastest = entry.fastest === true;
          const hasArt = artEnabled && Boolean(entry.image);
          const maskId = `feature-art-mask-${entry.id}`;
          const panelClassName = ["feature-panel", fastest && "feature-panel--fastest"]
            .filter(Boolean)
            .join(" ");

          return (
            <FeaturePanel
              key={entry.id}
              entry={entry}
              reduced={reduced}
              hasArt={hasArt}
              maskId={maskId}
              className={panelClassName}
            />
          );
        })}
      </div>
    </section>
  );
}

type FeaturePanelProps = {
  entry: Section["entries"][number];
  reduced: boolean;
  hasArt: boolean;
  maskId: string;
  className: string;
};

function FeaturePanel({ entry, reduced, hasArt, maskId, className }: FeaturePanelProps) {
  const holeRef = useRef<SVGCircleElement>(null);

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!hasArt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const hole = holeRef.current;
    if (!hole) return;
    hole.setAttribute("cx", String(event.clientX - rect.left));
    hole.setAttribute("cy", String(event.clientY - rect.top));
  }

  const content = (
    <>
      {hasArt && (
        <svg className="feature-art" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000">
              <circle ref={holeRef} cx="-500" cy="-500" r="200" fill="#fff" filter="url(#art-distort)" />
            </mask>
          </defs>
          <image
            href={entry.image}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            filter="url(#art-distort-soft)"
            mask={`url(#${maskId})`}
          />
        </svg>
      )}

      <div className="feature-inner">
        <div className="feature-top">
          {entry.fastest && (
            <span
              className="feature-fastest-marker"
              title="In F1 timing, purple marks the fastest lap set in a session — the single quickest lap of anyone on track."
            >
              <span className="feature-fastest-dot" aria-hidden="true" />
              Fastest Lap
            </span>
          )}
          {entry.date && (
            <div className="feature-date">
              <SplitFlapDate value={entry.date} />
            </div>
          )}
        </div>

        <h3 className="feature-title">
          {entry.href ? (
            <a className="feature-title-link" href={entry.href} target="_blank" rel="noopener noreferrer">
              {entry.title}
              <span className="feature-title-arrow" aria-hidden="true">
                &rarr;
              </span>
            </a>
          ) : (
            entry.title
          )}
        </h3>

        {entry.role && <p className="feature-role">{entry.role}</p>}
        {entry.org && <p className="feature-org">{entry.org}</p>}

        {entry.stats && entry.stats.length > 0 && (
          <div className="feature-stats">
            {entry.stats.map((stat, i) => (
              <div className="feature-stat" key={`${stat.label}-${i}`}>
                <div className="feature-stat-value">
                  <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="feature-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {entry.summary && <p className="feature-summary">{entry.summary}</p>}

        {entry.bullets && entry.bullets.length > 0 && (
          <ul className="feature-bullets">
            {entry.bullets.map((bullet, bi) => (
              <li key={bi}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (reduced) {
    return (
      <article className={className} onPointerMove={handlePointerMove}>
        {content}
      </article>
    );
  }

  return (
    <motion.article
      className={className}
      onPointerMove={handlePointerMove}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      {content}
    </motion.article>
  );
}
