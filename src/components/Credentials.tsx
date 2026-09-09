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
  const labelId = `${section.id}-label`;

  return (
    <section id={section.id} className="cred-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label cred-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="cred-blurb">{section.blurb}</p>}

        <div className="cred-grid">
          {section.entries.map((entry, i) => {
            const chips = chipsFor(entry);
            const coursework = entry.bullets?.filter((bullet) => bullet.startsWith(COURSEWORK_PREFIX));

            return (
              <Reveal as="div" index={reduced ? 0 : i} key={entry.id} className="cred-card">
                <span className="cred-bar" aria-hidden="true" />

                <div className="cred-head">
                  <div className="cred-heading">
                    <h3 className="cred-title">{entry.title}</h3>
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
