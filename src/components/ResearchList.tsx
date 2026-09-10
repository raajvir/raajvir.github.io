import type { Entry, Section } from "../data/site";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import { SplitFlapDate } from "./ui/SplitFlapDate";
import { CountUp } from "./ui/CountUp";
import "./ResearchList.css";

/** Up to three letters for the bordered-square fallback when an institution has no crest. */
function institutionInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]);
  return letters.slice(0, 3).join("").toUpperCase();
}

/**
 * Builds the grid-template-areas string for one row, so an entry with no
 * stats (or no org line) does not reserve an empty track for it. The first
 * row always carries the date beside the heading; every row after spans
 * the full content width.
 */
function buildAreas(entry: Entry): string {
  const rows = ["heading"];
  if (entry.role || entry.org) rows.push("role");
  if (entry.stats && entry.stats.length > 0) rows.push("stats");
  if (entry.summary) rows.push("summary");
  if (entry.bullets && entry.bullets.length > 0) rows.push("bullets");
  return rows.map((name, i) => (i === 0 ? `"rail ${name} date"` : `"rail ${name} ${name}"`)).join(" ");
}

/**
 * The RESEARCH section, laid out as a citation list rather than another
 * timing-tower row: a ghosted index numeral and an institution crest stand
 * in for the "entry number" and "publisher" a bibliography would carry.
 */
export function ResearchList({ section }: { section: Section }) {
  const labelId = `${section.id}-label`;

  return (
    <section id={section.id} className="research-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label research-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="research-blurb">{section.blurb}</p>}

        <ul className="research-list">
          {section.entries.map((entry, i) => {
            const institution = entry.institution;
            const published = entry.tags?.includes("Published") ?? false;
            const showOrg = Boolean(entry.org) && entry.org !== institution?.name;

            return (
              <Reveal
                as="li"
                index={i}
                key={entry.id}
                className="research-row"
                delay={0}
              >
                <div
                  className="research-row-grid"
                  style={{ gridTemplateAreas: buildAreas(entry) }}
                >
                  <div className="research-rail">
                    <span className="research-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {institution && (
                      <>
                        <div className="research-mark">
                          {institution.logo ? (
                            <img className="research-logo" src={institution.logo} alt="" />
                          ) : (
                            <span className="research-mark-fallback" aria-hidden="true">
                              {institutionInitials(institution.name)}
                            </span>
                          )}
                        </div>
                        <span className="research-inst-name">{institution.name}</span>
                      </>
                    )}
                  </div>

                  <div className="research-heading">
                    {entry.href ? (
                      <h3 className="research-title">
                        <a
                          className="research-title-link"
                          href={entry.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.title}
                          <span className="research-title-arrow" aria-hidden="true">
                            &rarr;
                          </span>
                        </a>
                      </h3>
                    ) : (
                      <h3 className="research-title">{entry.title}</h3>
                    )}
                    {published && <span className="research-badge">Published</span>}
                  </div>

                  {entry.date && (
                    <div className="research-date">
                      <SplitFlapDate value={entry.date} />
                    </div>
                  )}

                  {(entry.role || showOrg) && (
                    <div className="research-role-block">
                      {entry.role && <p className="research-role">{entry.role}</p>}
                      {showOrg && <p className="research-role research-org">{entry.org}</p>}
                    </div>
                  )}

                  {entry.stats && entry.stats.length > 0 && (
                    <div className="research-stats">
                      {entry.stats.map((stat, si) => (
                        <div className="research-stat" key={`${stat.label}-${si}`}>
                          <span className="research-stat-value">
                            <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                          </span>
                          <span className="research-stat-label">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.summary && <p className="research-summary">{entry.summary}</p>}

                  {entry.bullets && entry.bullets.length > 0 && (
                    <ul className="research-bullets">
                      {entry.bullets.map((bullet, bi) => (
                        <li key={bi}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
