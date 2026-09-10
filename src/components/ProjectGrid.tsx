import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import type { Entry, Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./ProjectGrid.css";

/**
 * Static echo of CountUp's number formatting (no animation here — cards
 * reflow on filter, so a count-up on top of that would be distracting).
 * Integers >= 10,000 get thousands separators; fractional values (e.g. a
 * GPA-style stat) stay at one decimal place.
 */
function formatStatValue(value: number): string {
  if (!Number.isInteger(value)) return value.toFixed(1);
  return Math.abs(value) >= 10000 ? Math.round(value).toLocaleString("en-US") : String(Math.round(value));
}

// Shared by the initial scroll reveal AND the AnimatePresence enter/exit
// when the filter changes — both want "fade + rise in", and exit wants
// "fade + scale down", so one variants object covers every transition a
// card goes through.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

type CardProps = {
  entry: Entry;
  index: number;
  reduced: boolean;
  canSpotlight: boolean;
};

function ProjectCard({ entry, index, reduced, canSpotlight }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const holeRef = useRef<SVGCircleElement>(null);
  const fastest = entry.fastest === true;
  const maskId = `art-hole-${entry.id}`;

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canSpotlight || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = `${event.clientX - rect.left}px`;
    const y = `${event.clientY - rect.top}px`;
    ref.current.style.setProperty("--mx", x);
    ref.current.style.setProperty("--my", y);
    // The reveal is an SVG mask rather than a CSS gradient: only the mask's
    // circle carries the displacement filter, so the boundary ripples while
    // the artwork underneath stays sharp.
    const hole = holeRef.current;
    if (hole) {
      hole.setAttribute("cx", String(event.clientX - rect.left));
      hole.setAttribute("cy", String(event.clientY - rect.top));
    }
  }

  const hasArt = canSpotlight && Boolean(entry.image);

  const bottomContent = entry.summary ? (
    <p className="proj-bullet">{entry.summary}</p>
  ) : entry.pullQuote ? (
    <blockquote className="proj-quote">{entry.pullQuote}</blockquote>
  ) : entry.bullets && entry.bullets.length > 0 ? (
    <p className="proj-bullet">{entry.bullets[0]}</p>
  ) : null;

  const inner = (
    <>
      {entry.href && (
        <span className="proj-arrow" aria-hidden="true">
          &#8599;
        </span>
      )}

      <div className="proj-top">
        <span className="proj-date">{entry.date}</span>
        {fastest && <span className="sr-only">Fastest lap</span>}
      </div>

      <h3 className="proj-title">{entry.title}</h3>

      {(entry.role || entry.org) && (
        <div className="proj-meta">
          {entry.role && <p className="proj-role">{entry.role}</p>}
          {entry.org && <p className="proj-org">{entry.org}</p>}
        </div>
      )}

      {entry.stats && entry.stats.length > 0 && (
        <div className="proj-stats">
          {entry.stats.map((stat, i) => (
            <div className="proj-stat" key={`${stat.label}-${i}`}>
              <div className="proj-stat-value">
                {stat.prefix}
                {formatStatValue(stat.value)}
                {stat.suffix}
              </div>
              <div className="proj-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {bottomContent && <div className="proj-bottom">{bottomContent}</div>}
    </>
  );

  const cardClassName = [
    "proj-card",
    fastest && "proj-card--fastest",
    canSpotlight && "proj-card--spotlight",
  ]
    .filter(Boolean)
    .join(" ");

  const cardBody = entry.href ? (
    <a className="proj-card-body" href={entry.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <article className="proj-card-body">{inner}</article>
  );

  if (reduced) {
    return (
      <div className={cardClassName}>
        {cardBody}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      exit="exit"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      onPointerMove={handlePointerMove}
      className={cardClassName}
    >
      {hasArt && (
        <svg className="proj-art" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000">
              <circle
                ref={holeRef}
                cx="-500"
                cy="-500"
                r="140"
                fill="#fff"
                filter="url(#art-distort)"
              />
            </mask>
          </defs>
          <image
            href={entry.image}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            filter="url(#art-distort-soft)"
            mask={`url(#${maskId})`}
          />
        </svg>
      )}
      {cardBody}
    </motion.div>
  );
}

/**
 * "PROJECTS & RESEARCH" grid — a filterable card grid rather than the
 * timing-tower list SectionBlock renders for other sections. Filtering is
 * single-select (one tag, or "All") and cards FLIP-reflow into their new
 * positions via motion's `layout` + AnimatePresence.
 */
export function ProjectGrid({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const [canSpotlight] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );

  const labelId = `${section.id}-label`;

  const spotlightEnabled = canSpotlight && !reduced;

  const cards = section.entries.map((entry, i) => (
    <ProjectCard
      key={entry.id}
      entry={entry}
      index={i}
      reduced={reduced}
      canSpotlight={spotlightEnabled}
    />
  ));

  return (
    <section id={section.id} className="proj-section" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label proj-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="proj-blurb">{section.blurb}</p>}

        {reduced ? (
          <div className="proj-grid">{cards}</div>
        ) : (
          <div className="proj-grid">
            <AnimatePresence mode="popLayout">{cards}</AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
