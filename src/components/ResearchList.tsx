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
 * One card, composed to read as the miniature first page of a paper: a
 * masthead (crest, date, published stamp), a centred title block, an
 * abstract, a bordered figure with a caption, and body copy below —
 * the same order a real offprint would carry.
 */
function ResearchCard({ entry, index }: { entry: Entry; index: number }) {
  const institution = entry.institution;
  const published = entry.tags?.includes("Published") ?? false;
  const showOrg = Boolean(entry.org) && entry.org !== institution?.name;

  return (
    <Reveal as="li" index={index} className="research-card-item">
      <article className="research-card">
        <header className="research-card-header">
          {institution ? (
            <div className="research-inst">
              <div className="research-crest">
                {institution.logo ? (
                  <img className="research-crest-img" src={institution.logo} alt="" />
                ) : (
                  <span className="research-crest-fallback" aria-hidden="true">
                    {institutionInitials(institution.name)}
                  </span>
                )}
              </div>
              <span className="research-inst-name">{institution.name}</span>
            </div>
          ) : (
            <span />
          )}

          <div className="research-card-meta">
            {entry.date && (
              <span className="research-date">
                <SplitFlapDate value={entry.date} />
              </span>
            )}
            {published && <span className="research-badge">Published</span>}
          </div>
        </header>

        <div className="research-titleblock">
          <h3 className="research-title">
            {entry.href ? (
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
            ) : (
              entry.title
            )}
          </h3>
          {entry.role && <p className="research-byline">{entry.role}</p>}
          {showOrg && <p className="research-byline research-org">{entry.org}</p>}
        </div>

        {entry.summary && (
          <div className="research-abstract">
            <p className="research-abstract-text">{entry.summary}</p>
          </div>
        )}

        {entry.image && (
          <figure className="research-figure">
            <span className="research-figure-frame">
              <img className="research-figure-img" src={entry.image} alt="" />
            </span>
            <figcaption className="research-figure-caption">Fig. 1</figcaption>
          </figure>
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

        {entry.bullets && entry.bullets.length > 0 && (
          <ul className="research-bullets">
            {entry.bullets.map((bullet, bi) => (
              <li key={bi}>{bullet}</li>
            ))}
          </ul>
        )}

        {entry.extraLinks && entry.extraLinks.length > 0 && (
          <div className="research-links">
            {entry.extraLinks.map((link) => (
              <a
                key={link.href}
                className="research-extra-link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
                <span className="research-title-arrow" aria-hidden="true">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        )}
      </article>
    </Reveal>
  );
}

/**
 * The RESEARCH section, laid out as a grid of paper previews rather than a
 * citation list — each card is a miniature first page of the work, complete
 * with a masthead, an abstract and a bordered technical figure.
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

        <ul className="research-grid">
          {section.entries.map((entry, i) => (
            <ResearchCard entry={entry} index={i} key={entry.id} />
          ))}
        </ul>
      </div>
    </section>
  );
}
