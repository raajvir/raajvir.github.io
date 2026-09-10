import { motion } from "motion/react";
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

type Field = { key: string; label: string; value: string };
type Figure = { key: string; label: string; value: string };

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

function LicenceCard({ entry, index, reduced }: { entry: Entry; index: number; reduced: boolean }) {
  const fields = fieldsFor(entry);
  const figures = figuresFor(entry);
  const finePrint = finePrintFor(entry);
  const delay = index * CARD_STAGGER;

  const card = (
    <div className="cred-licence-card">
      {entry.image && (
        <div className="cred-licence-photo">
          <img src={entry.image} alt="" aria-hidden="true" loading="lazy" />
          <span className="cred-licence-holo" aria-hidden="true" />
        </div>
      )}

      <div className="cred-licence-main">
        <div className="cred-licence-topline">
          <span className="cred-licence-kicker">Student Super Licence</span>
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
      </li>
    );
  }

  return (
    <motion.li
      className="cred-licence"
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: CARD_DURATION, delay, ease: CARD_EASE }}
    >
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
            <LicenceCard entry={entry} index={i} reduced={reduced} key={entry.id} />
          ))}
        </ul>
      </div>
    </section>
  );
}
