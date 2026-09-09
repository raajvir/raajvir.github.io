import type { CSSProperties } from "react";
import { skills } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./SkillsMarquee.css";

/** Full loop duration per row, in seconds — each row feels independently paced. */
const DURATIONS = [38, 52, 30, 44];

/** Rows 0 and 2 read left-to-right, rows 1 and 3 read right-to-left. */
function directionFor(i: number): "normal" | "reverse" {
  return i % 2 === 0 ? "reverse" : "normal";
}

/**
 * "Trackside LED boards" — one full-bleed, infinitely scrolling row per
 * skills group. Built from a doubled item list animated with a linear CSS
 * keyframe so the loop is seamless; direction alternates per row via
 * `animation-direction`, and each row's speed is set through a CSS custom
 * property so a single keyframe definition serves every row.
 */
export function SkillsMarquee() {
  const reduced = usePrefersReducedMotion();
  const labelId = `${skills.id}-label`;

  return (
    <section id={skills.id} className="skills-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label skills-label">
          {skills.label}
        </SkewHeading>
      </div>

      <div className="skills-rows">
        {skills.groups.map((group, i) => {
          const rowStyle = reduced
            ? undefined
            : ({
                "--skills-duration": `${DURATIONS[i % DURATIONS.length]}s`,
                "--skills-direction": directionFor(i),
              } as CSSProperties);

          return (
            <div className="skills-row" key={group.id}>
              <span className="skills-row-label">{group.label}</span>

              {reduced ? (
                <div className="skills-track-wrap skills-track-wrap--static">
                  <div className="skills-track skills-track--static">
                    {group.items.map((item) => (
                      <span className="skills-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="skills-track-wrap">
                  <div className="skills-track" style={rowStyle}>
                    {group.items.map((item) => (
                      <span className="skills-chip" key={item}>
                        {item}
                      </span>
                    ))}
                    {group.items.map((item) => (
                      <span className="skills-chip" key={`dup-${item}`} aria-hidden="true">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
