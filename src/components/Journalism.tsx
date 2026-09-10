import type { Entry, Section } from "../data/site";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { SkewHeading } from "./ui/SkewHeading";
import { SplitFlapDate } from "./ui/SplitFlapDate";
import "./Journalism.css";

const WAVEFORM_BAR_COUNT = 60;
const REDUCED_PLAYED_PERCENT = 35;

/**
 * Deterministic pseudo-random value in [0, 1) from an integer seed — a fixed
 * hash formula, never `Math.random()`, so the waveform's shape is identical
 * on every render and every load instead of reshuffling.
 */
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Bar heights (in %), computed once at module load by blending that noise
 * with a slow sine envelope so the row reads as a real waveform — peaks and
 * troughs — rather than uniform static.
 */
const WAVE_HEIGHTS: number[] = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => {
  const noise = seededNoise(i + 1);
  const envelope = 0.5 + 0.5 * Math.sin(i / 4.3 + 0.6);
  const value = 14 + noise * 38 + envelope * 40;
  return Math.round(Math.min(96, Math.max(12, value)));
});

/**
 * Pulls the four headline titles out of the Medium entry's single
 * summarising bullet ("Recent pieces: A, B, C, D."). Returns null — rather
 * than a mis-split guess — the moment the sentence doesn't match the
 * expected "Recent pieces:" prefix, so a future data change degrades to
 * plain bullet text instead of producing garbage.
 */
function parseHeadlines(entry: Entry): string[] | null {
  const raw = entry.bullets?.[0];
  if (!raw) return null;
  const match = raw.match(/recent pieces:\s*(.+)$/i);
  if (!match) return null;
  const items = match[1]
    .replace(/\.+\s*$/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

/** The waveform centrepiece: a static base row, an accent "played" row
 *  revealed by an animated clip-path, and a travelling playhead line. */
function Waveform({ reduced }: { reduced: boolean }) {
  return (
    <div className="journalism-wave" aria-hidden="true">
      <div className="journalism-wave-track journalism-wave-track--base">
        {WAVE_HEIGHTS.map((h, i) => (
          <span className="journalism-wave-bar" style={{ height: `${h}%` }} key={i} />
        ))}
      </div>
      <div
        className={`journalism-wave-track journalism-wave-played${
          reduced ? "" : " journalism-wave-played--animate"
        }`}
        style={reduced ? { clipPath: `inset(0 ${100 - REDUCED_PLAYED_PERCENT}% 0 0)` } : undefined}
      >
        {WAVE_HEIGHTS.map((h, i) => (
          <span className="journalism-wave-bar" style={{ height: `${h}%` }} key={i} />
        ))}
      </div>
      <span className="journalism-wave-center" />
      <span
        className={`journalism-wave-playhead${reduced ? "" : " journalism-wave-playhead--animate"}`}
        style={reduced ? { left: `${REDUCED_PLAYED_PERCENT}%` } : undefined}
      />
    </div>
  );
}

/**
 * The JOURNALISM section, given a format of its own: a broadcast "now
 * playing" panel for the podcast beside a headline-stack panel for the
 * writing, rather than another timing-tower list.
 */
export function Journalism({ section }: { section: Section }) {
  const reduced = usePrefersReducedMotion();
  const labelId = `${section.id}-label`;

  const podcast = section.entries.find((e) => e.id === "six-cylinders") ?? section.entries[0];
  const writing = section.entries.find((e) => e.id === "medium") ?? section.entries[1];
  const headlines = writing ? parseHeadlines(writing) : null;

  return (
    <section id={section.id} className="journalism-sec" aria-labelledby={labelId}>
      <div className="container">
        <SectionRule />
        <SkewHeading id={labelId} className="section-label journalism-label">
          {section.label}
        </SkewHeading>
        {section.blurb && <p className="journalism-blurb">{section.blurb}</p>}

        <div className="journalism-grid">
          {podcast && (
            <Reveal as="div" index={0} className="journalism-panel journalism-panel--audio">
              <div className="journalism-panel-top">
                <span className="journalism-marker journalism-marker--live">
                  <span className="journalism-dot" aria-hidden="true" />
                  On air
                </span>
                {podcast.date && (
                  <div className="journalism-date">
                    <SplitFlapDate value={podcast.date} />
                  </div>
                )}
              </div>

              <h3 className="journalism-title">
                {podcast.href ? (
                  <a
                    className="journalism-title-link"
                    href={podcast.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {podcast.title}
                    <span className="journalism-title-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </a>
                ) : (
                  podcast.title
                )}
              </h3>
              {podcast.role && <p className="journalism-role">{podcast.role}</p>}

              <Waveform reduced={reduced} />

              {podcast.stats && podcast.stats.length > 0 && (
                <div className="journalism-stats">
                  {podcast.stats.map((stat, i) => (
                    <div className="journalism-stat" key={`${stat.label}-${i}`}>
                      <span className="journalism-stat-value">
                        {stat.prefix}
                        {stat.value}
                        {stat.suffix}
                      </span>
                      <span className="journalism-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {podcast.summary && <p className="journalism-summary">{podcast.summary}</p>}

              {podcast.bullets && podcast.bullets.length > 0 && (
                <ul className="journalism-bullets">
                  {podcast.bullets.map((bullet, bi) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              )}
            </Reveal>
          )}

          {writing && (
            <Reveal as="div" index={1} className="journalism-panel journalism-panel--writing">
              <div className="journalism-panel-top">
                <span className="journalism-marker">Writing</span>
                {writing.date && (
                  <div className="journalism-date">
                    <SplitFlapDate value={writing.date} />
                  </div>
                )}
              </div>

              <h3 className="journalism-title">
                {writing.href ? (
                  <a
                    className="journalism-title-link"
                    href={writing.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {writing.title}
                    <span className="journalism-title-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </a>
                ) : (
                  writing.title
                )}
              </h3>
              {writing.role && <p className="journalism-role">{writing.role}</p>}
              {writing.summary && <p className="journalism-summary">{writing.summary}</p>}

              {headlines ? (
                <ul className="journalism-headlines">
                  {headlines.map((headline, hi) => (
                    <li className="journalism-headline-row" key={hi}>
                      <span className="journalism-headline-index" aria-hidden="true">
                        {String(hi + 1).padStart(2, "0")}
                      </span>
                      <span className="journalism-headline-text">{headline}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                writing.bullets &&
                writing.bullets.length > 0 && (
                  <ul className="journalism-bullets">
                    {writing.bullets.map((bullet, bi) => (
                      <li key={bi}>{bullet}</li>
                    ))}
                  </ul>
                )
              )}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
