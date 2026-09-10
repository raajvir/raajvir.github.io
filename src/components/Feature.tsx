import { useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react";
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
 * weight. The purple "fastest lap" border shine and the oversized stats
 * both borrow techniques already used elsewhere on the site (SectionBlock,
 * ProjectGrid, Podium) rather than inventing new ones — this panel just
 * gives them room to be the whole show.
 */
export function Feature({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const labelId = `${section.id}-label`;

  return (
    <section id={section.id} className="feature-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label feature-label">
          {section.label}
        </SkewHeading>

        {section.entries.map((entry) => {
          const fastest = entry.fastest === true;
          // Somnia is the one panel that gets to look like its own product
          // (a dark ground lit from the bottom, matching projectsomnia.com's hero)
          // — kept as its own flag rather than piggybacking on `fastest`,
          // since they mean different things even though only Somnia has
          // both today.
          const dark = entry.id === "somnia";
          const panelClassName = [
            "feature-panel",
            fastest && "feature-panel--fastest",
            dark && "feature-panel--dark",
          ]
            .filter(Boolean)
            .join(" ");

          return <FeaturePanel key={entry.id} entry={entry} reduced={reduced} className={panelClassName} />;
        })}
      </div>
    </section>
  );
}

type FeaturePanelProps = {
  entry: Section["entries"][number];
  reduced: boolean;
  className: string;
};

function FeaturePanel({ entry, reduced, className }: FeaturePanelProps) {
  // The live phone/watch mockup is Somnia's own product, not generic panel
  // furniture — gated to that entry rather than assumed for any future one
  // this layout might carry.
  const isSomnia = entry.id === "somnia";

  const content = (
    <>
      {isSomnia && <FeatureGlow />}

      <div className="feature-panel-body">
        {isSomnia && <FeaturePhone reduced={reduced} />}

        <div className="feature-inner">
          {/* The purple border shine (feature-panel--fastest, on the
              article itself) is the only "fastest lap" indicator now — no
              text marker, visible or sr-only. Title and date share one row
              so the heading sits flush at the top of the column, level
              with the phone, instead of leaving a dead marker-row above
              it. */}
          <div className="feature-top">
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

            {entry.date && (
              <div className="feature-date">
                <SplitFlapDate value={entry.date} />
              </div>
            )}
          </div>

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

          {entry.extraLinks && entry.extraLinks.length > 0 && (
            <ul className="feature-links">
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
        </div>
      </div>
    </>
  );

  if (reduced) {
    return <article className={className}>{content}</article>;
  }

  return (
    <motion.article
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      {content}
    </motion.article>
  );
}

/**
 * The panel's dark ground: navy with a blue-to-white glow rising from the
 * bottom edge, echoing Somnia's own hero at projectsomnia.com. Static — the
 * light does not drift.
 */
function FeatureGlow() {
  return <div className="feature-glow" aria-hidden="true" />;
}

/* ---------------------------------------------------------------------- *
 * Somnia's phone mockup.
 *
 * Somnia's actual mechanic is a projected, gently pulsing circle on the
 * ceiling that you breathe in time with ("cardiac coherence") — this is a
 * live, running recreation of that pacer screen, built entirely from CSS/
 * SVG rather than a screenshot. Purely decorative: the real content lives
 * in the text column beside it.
 * ---------------------------------------------------------------------- */

/** Deterministic starfield — fixed x/y/size/opacity, never re-rolled. */
const PHONE_STARS: { x: number; y: number; size: number; opacity: number }[] = [
  { x: 12, y: 7, size: 2.4, opacity: 0.5 },
  { x: 34, y: 13, size: 1.4, opacity: 0.28 },
  { x: 70, y: 6, size: 1.9, opacity: 0.38 },
  { x: 88, y: 16, size: 2.8, opacity: 0.55 },
  { x: 20, y: 24, size: 1.2, opacity: 0.22 },
  { x: 50, y: 20, size: 1.7, opacity: 0.32 },
  { x: 80, y: 30, size: 1.3, opacity: 0.24 },
  { x: 8, y: 38, size: 2.0, opacity: 0.42 },
  { x: 93, y: 42, size: 1.5, opacity: 0.3 },
  { x: 60, y: 46, size: 1.1, opacity: 0.2 },
  { x: 28, y: 54, size: 2.1, opacity: 0.46 },
  { x: 12, y: 66, size: 1.4, opacity: 0.26 },
  { x: 84, y: 60, size: 1.8, opacity: 0.36 },
  { x: 66, y: 71, size: 1.2, opacity: 0.22 },
  { x: 38, y: 79, size: 1.6, opacity: 0.3 },
  { x: 91, y: 83, size: 2.5, opacity: 0.48 },
  { x: 20, y: 89, size: 1.3, opacity: 0.24 },
  { x: 56, y: 93, size: 1.9, opacity: 0.38 },
];

function FeaturePhoneStarfield() {
  return (
    <div className="feature-phone-stars" aria-hidden="true">
      {PHONE_STARS.map((star, i) => (
        <span
          key={i}
          className="feature-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}

function FeaturePhone({ reduced }: { reduced: boolean }) {
  return (
    <div className="feature-phone" aria-hidden="true">
      <div className="feature-phone-frame">
        <div className="feature-phone-notch" />
        <div className="feature-phone-screen">
          <FeaturePhoneStarfield />

          <div className="feature-phone-appbar">
            <img className="feature-phone-appicon" src="/assets/logos/somnia-icon.png" alt="" />
            <span className="feature-phone-appname">Somnia</span>
          </div>

          {reduced ? <FeaturePacerStatic /> : <FeaturePacerLive />}

          <div className="feature-phone-actions">
            <div className="feature-phone-sessions">
              <span className="feature-phone-btn feature-phone-btn--solid">8 min</span>
              <span className="feature-phone-btn feature-phone-btn--outline">12 min</span>
            </div>
            <span className="feature-phone-btn feature-phone-btn--ghost">How does Somnia work?</span>
          </div>
        </div>
      </div>

      <FeatureWatch />
    </div>
  );
}

/**
 * A companion Apple Watch mockup, overlapping the phone's lower-right
 * corner in front of it. Built the same way as the phone — CSS/SVG, no
 * image — and scaled off the same --phone-w-derived em base, so it stays
 * in proportion at every breakpoint without its own size ladder. Purely
 * decorative, like the phone.
 */
function FeatureWatch() {
  return (
    <div className="feature-watch" aria-hidden="true">
      <div className="feature-watch-strap feature-watch-strap--top" />
      <div className="feature-watch-strap feature-watch-strap--bottom" />
      <div className="feature-watch-case">
        <span className="feature-watch-crown" />
        <span className="feature-watch-button" />
        <div className="feature-watch-screen">
          <span className="feature-watch-app">Project Somnia</span>
          <span className="feature-watch-greeting">Good Evening, Raaj</span>
          <span className="feature-watch-sub">Time to wind down</span>
          <span className="feature-watch-start">Start</span>
        </div>
      </div>
    </div>
  );
}

/** prefers-reduced-motion: static mid-size glow, no loop, caption "Breathe". */
function FeaturePacerStatic() {
  return (
    <div className="feature-pacer">
      <div className="feature-pacer-glow feature-pacer-glow--static" />
      <span className="feature-pacer-caption">Breathe</span>
    </div>
  );
}

/**
 * The pacer: a real cardiac-coherence cadence — 5s inhale, 5s exhale, a 10s
 * loop, 6 breaths/min. One `useAnimationFrame` drives both the glow's scale
 * (via motion values, so it never re-renders React) and the caption text
 * (React state, but only written when the phase actually flips) off the
 * same clock, so the word and the circle can't drift apart.
 */
function FeaturePacerLive() {
  const scale = useMotionValue(0.62);
  const blur = useTransform(scale, [0.62, 1], [5, 15]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);
  const opacity = useTransform(scale, [0.62, 1], [0.55, 1]);

  const [caption, setCaption] = useState<"in" | "out">("in");
  const phaseRef = useRef<"in" | "out">("in");

  useAnimationFrame((time) => {
    const t = (time % 10000) / 1000; // seconds into the 10s breath cycle
    // Half-cosine: smooth ease-in-out, zero velocity at both extremes —
    // 0.62 at t=0 (start of inhale), 1 at t=5 (start of exhale), back at t=10.
    const s = 0.81 - 0.19 * Math.cos((2 * Math.PI * t) / 10);
    scale.set(s);

    const phase = t < 5 ? "in" : "out";
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      setCaption(phase);
    }
  });

  return (
    <div className="feature-pacer">
      <motion.div className="feature-pacer-glow" style={{ scale, opacity, filter }} />
      <span className="feature-pacer-caption">{caption === "in" ? "Breathe in" : "Breathe out"}</span>
    </div>
  );
}
