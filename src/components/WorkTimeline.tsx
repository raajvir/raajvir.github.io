import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Entry, Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { CountUp } from "./ui/CountUp";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import "./WorkTimeline.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BAR_DURATION = 0.7;
const MIN_BAR_WIDTH = "34px";
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

type Domain = { start: number; end: number };
type BarGeometry = { leftPct: number; widthPct: number; ongoing: boolean };

/** "YYYY-MM" -> { year, month }, or null if malformed. */
function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** "YYYY-MM" -> a decimal year (2026-06 -> 2026.4166...), or null if malformed. */
function monthToDecimalYear(value: string): number | null {
  const ym = parseYearMonth(value);
  return ym ? ym.year + (ym.month - 1) / 12 : null;
}

/** A real date range from `period`, e.g. "Jun – Aug 2026" or
 *  "Jan 2026 – Present". Null when the period is missing or malformed, so
 *  the caller can fall back to the plain `date` label. */
function formatPeriodRange(period: NonNullable<Entry["period"]>): string | null {
  const start = parseYearMonth(period.start);
  if (!start) return null;
  const startMonth = MONTH_ABBR[start.month - 1];

  if (period.end === null) {
    return `${startMonth} ${start.year} – Present`;
  }
  const end = parseYearMonth(period.end);
  if (!end) return null;
  const endMonth = MONTH_ABBR[end.month - 1];

  return start.year === end.year
    ? `${startMonth} – ${endMonth} ${end.year}`
    : `${startMonth} ${start.year} – ${endMonth} ${end.year}`;
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
  artEnabled,
}: {
  entry: Entry;
  index: number;
  domain: Domain;
  expanded: boolean;
  onExpand: (id: string) => void;
  onCollapse: (id: string) => void;
  reduced: boolean;
  artEnabled: boolean;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  const artImgRef = useRef<HTMLImageElement>(null);
  const maskRectRef = useRef<SVGRectElement>(null);

  const bar = computeBar(entry, domain);
  const stats = entry.stats ?? [];
  const detailId = `${entry.id}-work-detail`;
  const hasDetail = Boolean(entry.summary || (entry.bullets && entry.bullets.length > 0) || stats.length > 0);
  // Photo only floats while the row is actually open, and only for
  // fine-pointer/motion-allowed visitors — otherwise no layer, no listener.
  const showArt = artEnabled && Boolean(entry.image) && expanded;

  const dateLabel = (entry.period && formatPeriodRange(entry.period)) || entry.date;
  // Near the axis's right edge a label growing rightward from the bar's
  // start would run off the track, so it flips to grow backward instead.
  const dateFlipped = bar ? bar.leftPct > 80 : false;

  const barClassName = ["work-bar", bar?.ongoing && "work-bar--ongoing", !bar && "work-bar--fallback"]
    .filter(Boolean)
    .join(" ");

  const barStyle = bar
    ? { left: `${bar.leftPct}%`, width: `max(${bar.widthPct}%, ${MIN_BAR_WIDTH})` }
    : undefined;

  // Delegated-per-row pointer tracking, mirroring SectionBlock's cursor-art:
  // written straight to CSS custom properties (not React state) so trailing
  // the cursor never triggers a re-render.
  useEffect(() => {
    if (!showArt) return;
    const row = rowRef.current;
    if (!row) return;

    function handlePointerMove(event: PointerEvent) {
      const art = artImgRef.current;
      if (!art || !row) return;
      const rect = row.getBoundingClientRect();
      const w = art.offsetWidth;
      const h = art.offsetHeight;
      const maskRect = maskRectRef.current;
      if (maskRect && maskRect.getAttribute("width") !== String(w)) {
        maskRect.setAttribute("width", String(w));
        maskRect.setAttribute("height", String(h));
      }
      const halfW = w / 2;
      const halfH = h / 2;
      const x = clamp(event.clientX - rect.left, halfW, rect.width - halfW);
      const y = clamp(event.clientY - rect.top, halfH, rect.height - halfH);
      row.style.setProperty("--art-x", `${x}px`);
      row.style.setProperty("--art-y", `${y}px`);
      row.classList.add("work-row--art-active");
    }

    function handlePointerLeave() {
      row?.classList.remove("work-row--art-active");
    }

    row.addEventListener("pointermove", handlePointerMove);
    row.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      row.removeEventListener("pointermove", handlePointerMove);
      row.removeEventListener("pointerleave", handlePointerLeave);
      row.classList.remove("work-row--art-active");
    };
  }, [showArt]);

  return (
    <li
      className={`work-row${expanded ? " work-row--expanded" : ""}`}
      ref={rowRef}
      // On the LI (not the trigger button) so the row stays open while the
      // pointer wanders down into the opened detail panel — bound to just
      // the button, moving in to read the bullets (or follow the photo)
      // would immediately collapse it again.
      onMouseEnter={() => onExpand(entry.id)}
      onMouseLeave={() => onCollapse(entry.id)}
    >
      {showArt && (
        <>
          {/* The mask rect is sized to the image in JS, exactly as
              SectionBlock does: every photo has its own aspect ratio, so a
              shared mask cannot line up with every row's edges. */}
          <svg className="work-art-defs" aria-hidden="true">
            <mask
              id={`work-art-mask-${entry.id}`}
              maskUnits="userSpaceOnUse"
              x="-40"
              y="-40"
              width="2000"
              height="2000"
            >
              <rect
                ref={maskRectRef}
                className="work-art-maskrect"
                x="0"
                y="0"
                width="10"
                height="10"
                fill="#fff"
                filter="url(#art-distort)"
              />
            </mask>
          </svg>
          <img
            ref={artImgRef}
            className="work-art"
            src={entry.image}
            alt=""
            aria-hidden="true"
            style={
              {
                mask: `url(#work-art-mask-${entry.id})`,
                WebkitMask: `url(#work-art-mask-${entry.id})`,
              } as React.CSSProperties
            }
          />
        </>
      )}

      <button
        type="button"
        className="work-row-trigger"
        aria-expanded={hasDetail ? expanded : undefined}
        aria-controls={hasDetail ? detailId : undefined}
        onFocus={() => onExpand(entry.id)}
        onBlur={() => onCollapse(entry.id)}
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
            {/* Visible only in the mobile stacked fallback, which has no
                shared axis to hang the date on; desktop shows it over the
                bar's own start instead (below), unless there's no bar to
                anchor it to. */}
            <span className={`work-row-date${!bar ? " work-row-date--visible" : ""}`}>{dateLabel}</span>
          </span>

          <span className="work-row-track">
            {bar && (
              <span
                className={`work-row-bar-date${dateFlipped ? " work-row-bar-date--flip" : ""}`}
                style={{ left: `${bar.leftPct}%` }}
              >
                {dateLabel}
              </span>
            )}
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
            {stats.length > 0 && (
              <div className="work-detail-stats">
                {/* The first stat is the headline figure — it earns its
                    position (the row's right-hand slot) but not a louder
                    style; it reads as an ordinary stat tile like the rest. */}
                {stats.map((stat, si) => (
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

  // Fine-pointer + motion-allowed gate for the cursor-trailing photo,
  // mirroring SectionBlock's own spotlight gate.
  const artEnabled = useMemo(
    () => !reduced && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
    [reduced]
  );

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
                  artEnabled={artEnabled}
                />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
