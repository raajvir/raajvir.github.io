import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The displacement filter behind every spotlight reveal (the helmet, the
 * project cards).
 *
 * The noise is animated from JS rather than with SMIL: Chrome does not
 * repaint an HTML element that references an SVG filter when that filter's
 * primitives are animated declaratively, so `<animate>` renders as a static
 * distortion. Writing the attribute ourselves forces the invalidation.
 */
export function DistortField() {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const turb = turbRef.current;
    if (!turb) return;

    let frame = 0;
    let last = 0;
    const start = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // ~30fps: fast enough to read as live movement, still cheap.
      if (now - last < 33) return;
      last = now;
      const t = (now - start) / 1000;
      const fx = 0.013 + Math.sin(t * 1.6) * 0.005;
      const fy = 0.019 + Math.cos(t * 1.25) * 0.006;
      turb.setAttribute("baseFrequency", `${fx.toFixed(5)} ${fy.toFixed(5)}`);
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
      <filter
        id="art-distort"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          ref={turbRef}
          type="fractalNoise"
          baseFrequency="0.013 0.019"
          numOctaves={2}
          seed={7}
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale={9}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
