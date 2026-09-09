import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  children: ReactNode;
  /** Stagger index within a group. */
  index?: number;
  /** Extra delay in seconds. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "header" | "footer";
};

const variants: Variants = {
  hidden: { opacity: 0, y: 26 },
  shown: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * Scroll-triggered entrance. Shared by every section so the whole page
 * reveals with one consistent rhythm.
 */
export function Reveal({ children, index = 0, delay = 0, className, as = "div" }: Props) {
  const reduced = usePrefersReducedMotion();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      custom={index * 0.09 + delay}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </MotionTag>
  );
}
