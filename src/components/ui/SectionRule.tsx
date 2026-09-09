import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The red hairline that sits above every section label on the original site.
 * Here it draws itself left-to-right on scroll, like a start/finish line.
 */
export function SectionRule({ dark = false }: { dark?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const color = dark ? "var(--c-white)" : "var(--c-hairline)";

  return (
    <div
      aria-hidden="true"
      style={{ position: "relative", height: 1, width: "100%", overflow: "hidden" }}
    >
      <motion.div
        style={{ height: 1, width: "100%", background: color, transformOrigin: "left center" }}
        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
