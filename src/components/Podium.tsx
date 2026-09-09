import { motion } from "motion/react";
import { awards } from "../data/site";
import type { Award } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./Podium.css";

/** Step height per finishing position — the actual podium geometry. */
const BLOCK_HEIGHT: Record<1 | 2 | 3, number> = { 1: 200, 2: 150, 3: 120 };

/** Grow-in stagger per position: P3 first, P1 last. */
const STAGGER: Record<1 | 2 | 3, number> = { 3: 0, 2: 0.1, 1: 0.2 };

const BLOCK_DURATION = 0.8;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function PodiumColumn({ award, reduced }: { award: Award; reduced: boolean }) {
  const position = award.position as 1 | 2 | 3;
  const height = BLOCK_HEIGHT[position];
  const delay = STAGGER[position];

  return (
    <li className={`podium-col podium-col--p${position}`}>
      {reduced ? (
        <div className="podium-copy">
          <p className="podium-title">{award.title}</p>
          <p className="podium-detail">{award.detail}</p>
          <p className="podium-date podium-date--mobile">{award.date}</p>
        </div>
      ) : (
        <motion.div
          className="podium-copy"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.4, delay: delay + BLOCK_DURATION, ease: "easeOut" }}
        >
          <p className="podium-title">{award.title}</p>
          <p className="podium-detail">{award.detail}</p>
          <p className="podium-date podium-date--mobile">{award.date}</p>
        </motion.div>
      )}

      {reduced ? (
        <div className="podium-block" style={{ height }}>
          <span className="podium-num" aria-hidden="true">
            <span className="podium-num-p">P</span>
            <span className="podium-num-n">{position}</span>
          </span>
          <span className="podium-block-date">{award.date}</span>
        </div>
      ) : (
        <motion.div
          className="podium-block"
          initial={{ height: 0 }}
          whileInView={{ height }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: BLOCK_DURATION, delay, ease: EASE }}
        >
          <span className="podium-num" aria-hidden="true">
            <span className="podium-num-p">P</span>
            <span className="podium-num-n">{position}</span>
          </span>
          <span className="podium-block-date">{award.date}</span>
        </motion.div>
      )}

      <span className="podium-mobile-marker" aria-hidden="true" />
    </li>
  );
}

/**
 * Awards rendered as an actual F1 podium: P2/P1/P3 left-to-right visually
 * (via CSS `order`) while the DOM stays in rank order for assistive tech.
 * Anything outside the top three renders below the floor line as a plain
 * "also classified" list.
 */
export function Podium() {
  const reduced = usePrefersReducedMotion();
  const labelId = `${awards.id}-label`;

  const podium = awards.entries.filter((a) => a.position !== 0);
  const alsoClassified = awards.entries.filter((a) => a.position === 0);

  return (
    <section id={awards.id} className="podium-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label podium-label">
          {awards.label}
        </SkewHeading>

        <ul className="podium-list">
          {podium.map((award) => (
            <PodiumColumn award={award} reduced={reduced} key={award.id} />
          ))}
        </ul>

        <div className="podium-floor" aria-hidden="true" />

        {alsoClassified.length > 0 && (
          <div className="podium-also">
            <h3 className="podium-also-heading">Also classified</h3>
            <ul className="podium-also-list">
              {alsoClassified.map((award) => (
                <li className="podium-also-row" key={award.id}>
                  <span className="podium-also-bullet" aria-hidden="true" />
                  <span className="podium-also-title">{award.title}</span>
                  <span className="podium-also-detail">{award.detail}</span>
                  <span className="podium-also-date">{award.date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
