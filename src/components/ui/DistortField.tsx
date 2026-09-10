import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The displacement filters behind every spotlight reveal.
 *
 * Three strengths, all fed by the same drifting noise so they stay in step:
 *   art-distort       strong — the rippled boundary of a mask
 *   art-distort-soft  gentle — a little movement in the picture itself
 *   face-distort      medium — the face revealed under the helmet
 *
 * The noise is animated from JS rather than with SMIL: Chrome does not
 * repaint an HTML element that references an SVG filter when that filter's
 * primitives are animated declaratively, so `<animate>` renders as a static
 * distortion. Writing the attribute ourselves forces the invalidation.
 */
const FILTERS = [
  { id: "art-distort", scale: 17, base: [0.013, 0.019] },
  { id: "art-distort-soft", scale: 4, base: [0.009, 0.013] },
  { id: "face-distort", scale: 4, base: [0.015, 0.021] },
] as const;

export function DistortField() {
  const turbRefs = useRef<(SVGFETurbulenceElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let last = 0;
    const start = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // ~20fps is plenty for a slow drift and keeps the filter cheap.
      if (now - last < 50) return;
      last = now;
      const t = (now - start) / 1000;

      FILTERS.forEach((f, i) => {
        const turb = turbRefs.current[i];
        if (!turb) return;
        const fx = f.base[0] + Math.sin(t * 0.55) * 0.005;
        const fy = f.base[1] + Math.cos(t * 0.42) * 0.006;
        turb.setAttribute("baseFrequency", `${fx.toFixed(5)} ${fy.toFixed(5)}`);
      });
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute" }}
    >
      {FILTERS.map((f, i) => (
        <filter
          key={f.id}
          id={f.id}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            ref={(el) => {
              turbRefs.current[i] = el;
            }}
            type="fractalNoise"
            baseFrequency={`${f.base[0]} ${f.base[1]}`}
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={f.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      ))}
    </svg>
  );
}
