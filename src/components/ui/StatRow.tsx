import type { Stat } from "../../data/site";
import { CountUp } from "./CountUp";

/**
 * A horizontal row of count-up stat tiles, used inside a timing-tower entry
 * between the role block and the bullets. Styling lives in
 * SectionBlock.css (.sec-stats / .sec-stat / .sec-stat-value / .sec-stat-label)
 * since this row only ever appears inside a SectionBlock entry.
 */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="sec-stats">
      {stats.map((stat, i) => (
        <div className="sec-stat" key={`${stat.label}-${i}`}>
          <div className="sec-stat-value">
            <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
          </div>
          <div className="sec-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
