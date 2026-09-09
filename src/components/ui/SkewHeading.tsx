import type { ReactNode } from "react";
import { motion, useScroll, useVelocity, useSpring, useTransform } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = { id?: string; className?: string; children: ReactNode; max?: number };

/**
 * A section heading that leans with scroll velocity. Rendered as the <h2>
 * itself rather than a wrapper, so sibling selectors such as
 * `.sec-label:has(+ .sec-blurb)` keep working.
 */
export function SkewHeading({ id, className, children, max = 6 }: Props) {
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 200, damping: 40, mass: 0.4 });

  const skewY = useTransform(smooth, [-2500, 2500], [max, -max], { clamp: true });
  const scaleY = useTransform(smooth, [-2500, 0, 2500], [1.04, 1, 1.04], { clamp: true });

  if (reduced) {
    return (
      <h2 id={id} className={className}>
        {children}
      </h2>
    );
  }

  return (
    <motion.h2
      id={id}
      className={className}
      style={{ skewY, scaleY, willChange: "transform", transformOrigin: "left center" }}
    >
      {children}
    </motion.h2>
  );
}
