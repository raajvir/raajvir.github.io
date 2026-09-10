import { motion } from "motion/react";
import { references } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./References.css";

type ReferenceEntry = (typeof references.entries)[number];

/** Vertical connector height, in px, from the pit wall rail down to a station's screen. */
const DROP_HEIGHT = 40;
const DROP_DURATION = 0.6;
const STAGGER_STEP = 0.14;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Station({ entry, index, reduced }: { entry: ReferenceEntry; index: number; reduced: boolean }) {
  const channel = String(index + 1).padStart(2, "0");
  const delay = index * STAGGER_STEP;

  const screen = (
    <>
      <span className="refs-screen-top" aria-hidden="true">
        <span className="refs-led" />
        <span className="refs-channel">CH.{channel}</span>
      </span>
      <span className="refs-relation">{entry.relation}</span>
    </>
  );

  const plate = (
    <span className="refs-plate">
      <span className="refs-name">{entry.name}</span>
      <span className="refs-role">{entry.role}</span>
    </span>
  );

  if (reduced) {
    return (
      <li className="refs-station">
        <span className="refs-mobile-marker" aria-hidden="true" />
        <span className="refs-connector" style={{ height: DROP_HEIGHT }} />
        <span className="refs-content">
          <span className="refs-screen">{screen}</span>
          {plate}
        </span>
      </li>
    );
  }

  return (
    <li className="refs-station">
      <span className="refs-mobile-marker" aria-hidden="true" />
      <motion.span
        className="refs-connector"
        initial={{ height: 0 }}
        whileInView={{ height: DROP_HEIGHT }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: DROP_DURATION, delay, ease: EASE }}
      />
      <motion.span
        className="refs-content"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.4, delay: delay + DROP_DURATION, ease: "easeOut" }}
      >
        <span className="refs-screen">{screen}</span>
        {plate}
      </motion.span>
    </li>
  );
}

/**
 * The three referees rendered as stations along an F1 pit wall: a rail
 * running the width of the section, a signal dropping from it to a small
 * mono "readout" that names each person's relation as their channel, and
 * a nameplate underneath naming who is actually on the line. Deliberately
 * no email addresses — those live on the CV PDF only, not scraped off
 * this page.
 */
export function References() {
  const reduced = usePrefersReducedMotion();

  return (
    <section id="references" className="refs" aria-labelledby="refs-heading">
      <div className="container">
        <SectionRule />
        <SkewHeading id="refs-heading" className="section-label refs-label">
          {references.label}
        </SkewHeading>

        <div className="refs-wall">
          {reduced ? (
            <div className="refs-rail" />
          ) : (
            <motion.div
              className="refs-rail"
              style={{ transformOrigin: "left center" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 1.05, ease: EASE }}
            />
          )}

          <ul className="refs-stations">
            {references.entries.map((entry, i) => (
              <Station entry={entry} index={i} reduced={reduced} key={entry.id} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
