import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { Entry, Section, Stat } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { CountUp } from "./ui/CountUp";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./WorkTimeline.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BAR_DURATION = 0.7;
const MIN_BAR_WIDTH = "34px";

type Domain = { start: number; end: number };
type BarGeometry = { leftPct: number; widthPct: number; ongoing: boolean };

/** "YYYY-MM" -> a decimal year (2026-06 -> 2026.4166...), or null if malformed. */
function monthToDecimalYear(value: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return year + (month - 1) / 12;
}

function nowAsDecimalYear(): number {
  const now = new Date();
  return now.getFullYear() + now.getMonth() / 12;
}

/** The shared axis span: floor to the start of its earliest year, and out to
 *  "now" for any ongoing stint (or the latest known end date otherwise). */
function computeDomain(entries: Entry[]): Domain {
  const now = nowAsDecimalYear();
  const starts: number[] = [];
  const ends: number[] = [];

  for (const entry of entries) {
    if (!entry.period) continue;
    const s = monthToDecimalYear(entry.period.start);
    if (s !== null) starts.push(s);
    const e = entry.period.end === null ? now : monthToDecimalYear(entry.period.end);
    if (e !== null) ends.push(e);
  }

  if (starts.length === 0 || ends.length === 0) {
    return { start: now - 1, end: now };
  }

  const start = Math.floor(Math.min(...starts));
  const end = Math.max(Math.max(...ends), start + 0.5);
  return { start, end };
}

/** Position + width of one entry's bar as percentages of the domain span.
 *  Returns null when the entry has no (usable) period, so the caller can
 *  fall back to a full-width row instead of placing it at zero. */
function computeBar(entry: Entry, domain: Domain): BarGeometry | null {
  if (!entry.period) return null;
  const start = monthToDecimalYear(entry.period.start);
  if (start === null) return null;
  const ongoing = entry.period.end === null;
  const end = ongoing ? nowAsDecimalYear() : monthToDecimalYear(entry.period.end as string);
  if (end === null) return null;

  const span = domain.end - domain.start || 1;
  const clampedStart = Math.min(Math.max(start, domain.start), domain.end);
  const clampedEnd = Math.min(Math.max(end, domain.start), domain.end);
  const leftPct = ((clampedStart - domain.start) / span) * 100;
  const widthPct = Math.max(((clampedEnd - clampedStart) / span) * 100, 0);
  return { leftPct, widthPct, ongoing };
}

function yearTicks(domain: Domain): number[] {
  const first = Math.ceil(domain.start);
  const last = Math.floor(domain.end);
  const ticks: number[] = [];
  for (let year = first; year <= last; year++) ticks.push(year);
  if (ticks.length === 0) ticks.push(Math.round(domain.start));
  return ticks;
}

function tickPct(year: number, domain: Domain): number {
  const span = domain.end - domain.start || 1;
  return ((year - domain.start) / span) * 100;
}

function WorkRow({
  entry,
  index,
  domain,
  expanded,
  onExpand,
  onCollapse,
  reduced,
}: {
  entry: Entry;
  index: number;
  domain: Domain;
  expanded: boolean;
  onExpand: (id: string) => void;
  onCollapse: (id: string) => void;
  reduced: boolean;
}) {
  const bar = computeBar(entry, domain);
  const headline: Stat | undefined = entry.stats?.[0];
  const restStats = entry.stats && entry.stats.length > 1 ? entry.stats.slice(1) : [];
  const detailId = `${entry.id}-work-detail`;
  const hasDetail = Boolean(entry.summary || (entry.bullets && entry.bullets.length > 0) || restStats.length > 0);

  const barClassName = [
    "work-bar",
    bar?.ongoing && "work-bar--ongoing",
    !bar && "work-bar--fallback",
  ]
    .filter(Boolean)
    .join(" ");

  const barStyle = bar
    ? { left: `${bar.leftPct}%`, width: `max(${bar.widthPct}%, ${MIN_BAR_WIDTH})` }
    : undefined;

  return (
    <li className={`work-row${expanded ? " work-row--expanded" : ""}`}>
      <button
        type="button"
        className="work-row-trigger"
        aria-expanded={hasDetail ? expanded : undefined}
        aria-controls={hasDetail ? detailId : undefined}
        onFocus={() => onExpand(entry.id)}
        onBlur={() => onCollapse(entry.id)}
        onMouseEnter={() => onExpand(entry.id)}
        onMouseLeave={() => onCollapse(entry.id)}
      >
        <span className="work-row-logo">
          {entry.logo ? (
            <img src={entry.logo} alt={entry.title} />
          ) : (
            <span className="work-row-logo-fallback">{entry.title}</span>
          )}
        </span>

        <span className="work-row-main">
          <span className="work-row-head">
            <span className="work-row-role">{entry.role ?? entry.title}</span>
            <span className="work-row-date">{entry.date}</span>
            {headline && (
              <span className="work-row-headline-stat">
                <span className="work-row-headline-value tabular">
                  <CountUp value={headline.value} prefix={headline.prefix} suffix={headline.suffix} />
                </span>
                <span className="work-row-headline-label">{headline.label}</span>
              </span>
            )}
          </span>

          <span className="work-row-track">
            <motion.span
              className={barClassName}
              style={barStyle}
              initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: BAR_DURATION, delay: reduced ? 0 : index * 0.08, ease: EASE }}
            />
          </span>
        </span>
      </button>

      {hasDetail && (
        <div className="work-detail" id={detailId}>
          <div className="work-detail-inner">
            {entry.location && <p className="work-detail-location">{entry.location}</p>}
            {entry.summary && <p className="work-detail-summary">{entry.summary}</p>}
            {entry.bullets && entry.bullets.length > 0 && (
              <ul className="work-detail-bullets">
                {entry.bullets.map((bullet, bi) => (
                  <li key={bi}>{bullet}</li>
                ))}
              </ul>
            )}
            {restStats.length > 0 && (
              <div className="work-detail-stats">
                {restStats.map((stat, si) => (
                  <div className="work-detail-stat" key={`${stat.label}-${si}`}>
                    <span className="work-detail-stat-value tabular">
                      <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </span>
                    <span className="work-detail-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * The five company roles rendered as bars on a shared horizontal time axis —
 * length is duration, position is when — so the shape of the career reads
 * at a glance instead of requiring five equal rows to be read date by date.
 * A row's fuller detail (summary, bullets, remaining stats) expands in place
 * on hover or focus, so the chart doesn't cost the substance underneath it.
 */
export function WorkTimeline({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const labelId = `${section.id}-label`;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const domain = useMemo(() => computeDomain(section.entries), [section.entries]);
  const ticks = useMemo(() => yearTicks(domain), [domain]);

  function expand(id: string) {
    setExpandedId(id);
  }
  // Guarded so a stale leave/blur from a row that already lost focus can't
  // clobber whichever row the pointer or focus has since moved to.
  function collapse(id: string) {
    setExpandedId((current) => (current === id ? null : current));
  }

  return (
    <section id={section.id} className="work-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label work-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="work-blurb">{section.blurb}</p>}

        <Reveal as="div" className="work-chart">
          <div className="work-axis-row" aria-hidden="true">
            <div className="work-gutter" />
            <div className="work-axis-track">
              {ticks.map((year) => (
                <span className="work-axis-tick" key={year} style={{ left: `${tickPct(year, domain)}%` }}>
                  {year}
                </span>
              ))}
            </div>
          </div>

          <div className="work-rows-wrap">
            <div className="work-gridlines" aria-hidden="true">
              {ticks.map((year) => (
                <span className="work-gridline" key={year} style={{ left: `${tickPct(year, domain)}%` }} />
              ))}
            </div>

            <ul className="work-rows">
              {section.entries.map((entry, i) => (
                <WorkRow
                  key={entry.id}
                  entry={entry}
                  index={i}
                  domain={domain}
                  expanded={expandedId === entry.id}
                  onExpand={expand}
                  onCollapse={collapse}
                  reduced={reduced}
                />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
