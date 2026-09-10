import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The red hairline that sits above every section label on the original site.
 * Here it draws itself left-to-right on scroll, like a start/finish line.
 */
export function SectionRule({ dark = false }: { dark?: boolean }) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className={`sec-rule${dark ? " sec-rule--dark" : ""}`} aria-hidden="true">
      <motion.div
        className="sec-rule__line"
        style={{ transformOrigin: "left center" }}
        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
