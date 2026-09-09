import { SkewHeading } from "./ui/SkewHeading";
import "./References.css";
import { references } from "../data/site";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";

/**
 * Referees, quietest section on the page. Deliberately no email addresses —
 * those live on the CV PDF only, not scraped off this page.
 */
export function References() {
  return (
    <section id="references" className="refs" aria-labelledby="refs-heading">
      <div className="container">
        <SectionRule />
        <SkewHeading id="refs-heading" className="section-label refs-label">
          {references.label}
        </SkewHeading>
        <p className="refs-note">{references.note}</p>

        <ul className="refs-grid">
          {references.entries.map((entry, i) => (
            <Reveal key={entry.id} as="li" index={i} className="refs-item">
              <span className="refs-relation">{entry.relation}</span>
              <span className="refs-name">{entry.name}</span>
              <span className="refs-role">{entry.role}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
