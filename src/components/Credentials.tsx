import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { Entry, Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./Credentials.css";

const COURSEWORK_PREFIX = "Coursework:";

/** One growth beat per card, P3-then-P1 style staggering from the podium. */
const CARD_DURATION = 0.8;
const CARD_STAGGER = 0.16;
const CARD_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Physical-card tilt: how far it leans toward the pointer, and how it settles. */
const TILT_MAX_DEG = 7;
const TILT_SPRING = { stiffness: 150, damping: 18 };
const TILT_REST_SCALE = 1;
const TILT_HOVER_SCALE = 1.02;

const COARSE_POINTER_QUERY = "(pointer: coarse)";

/** True on touch/stylus-primary input, where a hover tilt has no honest gesture behind it. */
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COARSE_POINTER_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(COARSE_POINTER_QUERY);
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return coarse;
}

/**
 * Wraps a licence card so it behaves like a laminated object on a desk: it
 * leans toward the pointer and carries a specular highlight that tracks the
 * lean, both driven entirely through motion values (no per-frame React
 * state) and eased back to flat with springs on pointer leave. Disabled
 * outright — no listeners, no transform — for touch input and reduced
 * motion, where the card stays flat with its static foil look.
 */
function TiltCard({ interactive, children }: { interactive: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(TILT_REST_SCALE);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, TILT_SPRING);
  const springRotateY = useSpring(rotateY, TILT_SPRING);
  const springScale = useSpring(scale, TILT_SPRING);
  const springGlareX = useSpring(glareX, TILT_SPRING);
  const springGlareY = useSpring(glareY, TILT_SPRING);

  const glareXPercent = useMotionTemplate`${springGlareX}%`;
  const glareYPercent = useMotionTemplate`${springGlareY}%`;

  useEffect(() => {
    if (!interactive) return;
    const node = ref.current;
    if (!node) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

      rotateY.set((px - 0.5) * 2 * TILT_MAX_DEG);
      rotateX.set(-(py - 0.5) * 2 * TILT_MAX_DEG);
      glareX.set(px * 100);
      glareY.set(py * 100);
    };

    const handlePointerEnter = () => {
      scale.set(TILT_HOVER_SCALE);
    };

    const handlePointerLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
      scale.set(TILT_REST_SCALE);
      glareX.set(50);
      glareY.set(50);
    };

    node.addEventListener("pointermove", handlePointerMove);
    node.addEventListener("pointerenter", handlePointerEnter);
    node.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      node.removeEventListener("pointermove", handlePointerMove);
      node.removeEventListener("pointerenter", handlePointerEnter);
      node.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [interactive, rotateX, rotateY, scale, glareX, glareY]);

  if (!interactive) {
    return <div className="cred-tilt">{children}</div>;
  }

  // Assigned to a variable (rather than written inline) so the custom
  // `--cred-glare-*` properties don't trip the style prop's excess-property
  // check — motion writes these straight to the DOM regardless of how
  // narrowly its own style type is declared.
  const tiltStyle = {
    rotateX: springRotateX,
    rotateY: springRotateY,
    scale: springScale,
    "--cred-glare-x": glareXPercent,
    "--cred-glare-y": glareYPercent,
  };

  // The pointer math and hit-testing live on this outer, untransformed div —
  // only the inner motion.div actually rotates. Measuring against the card
  // that is itself tilting would chase its own moving hit-region (its
  // rendered corners drift under 3D rotation) and never settle.
  return (
    <div ref={ref} className="cred-tilt">
      <motion.div className="cred-tilt-interactive" style={tiltStyle}>
        {children}
      </motion.div>
    </div>
  );
}

type Field = { key: string; label: string; value: string };
type Figure = { key: string; label: string; value: string };

/** Plain-language label for the institution — a university or a school. */
function kickerFor(entry: Entry): string {
  return /school|college/i.test(entry.title) ? "High School" : "University";
}

/** Role / location / date, read the way a licence card reads its own fields. */
function fieldsFor(entry: Entry): Field[] {
  const fields: Field[] = [];
  if (entry.role) fields.push({ key: "class", label: "Class", value: entry.role });
  if (entry.location) fields.push({ key: "issued", label: "Issued at", value: entry.location });
  if (entry.date) fields.push({ key: "valid", label: "Valid", value: entry.date });
  return fields;
}

/**
 * The one substantive number (or two) per school, read out of the resume's
 * own stats/bullets rather than hand-typed twice. A stat becomes a figure
 * outright; a "Label: value" bullet becomes one too, provided it isn't the
 * coursework line (too long to read as a headline figure).
 */
function figuresFor(entry: Entry): Figure[] {
  const figures: Figure[] = [];

  entry.stats?.forEach((stat, i) => {
    const value = stat.value.toFixed(2);
    figures.push({
      key: `stat-${i}`,
      label: stat.label.toUpperCase(),
      value: `${stat.prefix ?? ""}${value}${stat.suffix ?? ""}`,
    });
  });

  entry.bullets?.forEach((bullet, i) => {
    if (bullet.startsWith(COURSEWORK_PREFIX)) return;
    const split = bullet.indexOf(":");
    if (split === -1) return;
    figures.push({
      key: `bullet-${i}`,
      label: bullet.slice(0, split).trim().toUpperCase(),
      value: bullet.slice(split + 1).trim(),
    });
  });

  return figures;
}

function finePrintFor(entry: Entry): string[] {
  return entry.bullets?.filter((bullet) => bullet.startsWith(COURSEWORK_PREFIX)) ?? [];
}

/** "Expected Class of '29" reads as in-force; a past class year reads as cleared. */
function statusFor(entry: Entry): string {
  return /expected/i.test(entry.date) ? "In force" : "Cleared";
}

function LicenceCard({
  entry,
  index,
  reduced,
  interactive,
}: {
  entry: Entry;
  index: number;
  reduced: boolean;
  interactive: boolean;
}) {
  const fields = fieldsFor(entry);
  const figures = figuresFor(entry);
  const finePrint = finePrintFor(entry);
  const delay = index * CARD_STAGGER;

  const card = (
    <div className="cred-licence-card">
      {entry.image && (
        <div className="cred-licence-photo">
          <img src={entry.image} alt="" aria-hidden="true" loading="lazy" />
          {interactive ? (
            <span className="cred-tilt-sheen" aria-hidden="true" />
          ) : (
            <span className="cred-licence-holo" aria-hidden="true" />
          )}
        </div>
      )}

      <div className="cred-licence-main">
        <div className="cred-licence-topline">
          <span className="cred-licence-kicker">{kickerFor(entry)}</span>
          <span className="cred-licence-status">{statusFor(entry)}</span>
          <span className="cred-licence-no">No. {String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="cred-licence-heading">
          <h3 className="cred-licence-title">
            {entry.href ? (
              <a className="cred-licence-title-link" href={entry.href} target="_blank" rel="noopener noreferrer">
                {entry.title}
                <span className="cred-licence-title-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ) : (
              entry.title
            )}
          </h3>
          {entry.logo && <img className="cred-licence-seal" src={entry.logo} alt="" aria-hidden="true" />}
        </div>

        {entry.org && <p className="cred-licence-org">{entry.org}</p>}

        {fields.length > 0 && (
          <dl className="cred-licence-fields">
            {fields.map((field) => (
              <div className="cred-licence-field" key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );

  const finePrintNodes = finePrint.map((line, i) => (
    <p className="cred-licence-fine" key={`fine-${i}`}>
      {line}
    </p>
  ));

  if (reduced) {
    return (
      <li className="cred-licence">
        <TiltCard interactive={interactive}>
          {card}
          {figures.length > 0 && (
            <div className="cred-licence-scores">
              {figures.map((figure) => (
                <div className="cred-licence-score" key={figure.key}>
                  <span className="cred-licence-score-value tabular">{figure.value}</span>
                  <span className="cred-licence-score-label">{figure.label}</span>
                </div>
              ))}
            </div>
          )}
          {finePrintNodes}
          <span className="cred-licence-barcode" aria-hidden="true" />
        </TiltCard>
      </li>
    );
  }

  return (
    <motion.li
      className="cred-licence"
      initial={{ clipPath: "inset(100% -4% -4% -4%)" }}
      whileInView={{ clipPath: "inset(0% -4% -4% -4%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: CARD_DURATION, delay, ease: CARD_EASE }}
    >
      <TiltCard interactive={interactive}>
        {card}

        {figures.length > 0 && (
          <motion.div
            className="cred-licence-scores"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.4, delay: delay + CARD_DURATION, ease: "easeOut" }}
          >
            {figures.map((figure) => (
              <div className="cred-licence-score" key={figure.key}>
                <span className="cred-licence-score-value tabular">{figure.value}</span>
                <span className="cred-licence-score-label">{figure.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {finePrintNodes}
        <span className="cred-licence-barcode" aria-hidden="true" />
      </TiltCard>
    </motion.li>
  );
}

/**
 * Education rendered as F1 student "super licence" cards: the campus photo
 * as the ID panel, the grades as the headline figures, the rest as the
 * fields a real licence carries — issuing class, location, validity. Each
 * card grows into view from the baseline, the same idea as the podium's
 * blocks, before its figures settle in.
 */
export function Credentials({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const interactive = !reduced && !coarse;
  const labelId = `${section.id}-label`;

  return (
    <section id={section.id} className="cred-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label cred-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="cred-blurb">{section.blurb}</p>}

        <ul className="cred-grid">
          {section.entries.map((entry, i) => (
            <LicenceCard entry={entry} index={i} reduced={reduced} interactive={interactive} key={entry.id} />
          ))}
        </ul>
      </div>
    </section>
  );
}
