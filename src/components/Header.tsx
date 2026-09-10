import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { nav, profile } from "../data/site";
import "./Header.css";

/**
 * Fixed site header. Adds a few F1-flavoured micro-interactions on top of the
 * original static design: a racing-line nav underline, a "DRS" sheen on the
 * CV button, a scroll-progress throttle bar, a gear indicator derived from
 * scroll position, and a shrink-on-scroll header height.
 */
export function Header() {
  const reduced = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gear, setGear] = useState(1);

  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(
    scrollYProgress,
    reduced ? { stiffness: 1000, damping: 100 } : { stiffness: 120, damping: 20, mass: 0.2 }
  );

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // floor+1, not ceil: ceil maps the whole of progress 0 to gear 0 (then
    // clamped up to 1) and squeezes the low gears, so 2 barely appears.
    // This gives eight even 12.5% bands, gear 1 from the very top.
    const next = Math.min(8, Math.max(1, Math.floor(latest * 8) + 1));
    setGear(next);
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`hdr${scrolled ? " hdr--shrunk" : ""}`}>
      <div className="container hdr-inner">
        <a href="#main" className="hdr-logo-link" aria-label="Back to top">
          <img src="/assets/signature.png" alt="B. Vijay signature" className="hdr-logo" />
        </a>

        <div className="hdr-right">
          <div className="hdr-gear" aria-hidden="true">
            <span className="hdr-gear-label">Gear</span>
            <span className="hdr-gear-num tabular">{gear}</span>
          </div>

          <nav className="hdr-nav" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hdr-navlink">
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href={profile.cv}
            target="_blank"
            rel="noopener noreferrer"
            className="hdr-cv hdr-cv--bar"
          >
            Download CV
          </a>

          <button
            type="button"
            className={`hdr-burger${menuOpen ? " is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="hdr-overlay"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <motion.div className="hdr-progress" style={{ scaleX: progressScaleX }} aria-hidden="true" />

      <AnimatePresence>
        {menuOpen &&
          (reduced ? (
            <div id="hdr-overlay" className="hdr-overlay" role="dialog" aria-modal="true">
              <button
                type="button"
                className="hdr-overlay-close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ×
              </button>
              <ul className="hdr-overlay-nav">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="hdr-overlay-link" onClick={closeMenu}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={profile.cv}
                target="_blank"
                rel="noopener noreferrer"
                className="hdr-cv hdr-cv--overlay"
                onClick={closeMenu}
              >
                Download CV
              </a>
            </div>
          ) : (
            <motion.div
              id="hdr-overlay"
              className="hdr-overlay"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                type="button"
                className="hdr-overlay-close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ×
              </button>
              <motion.ul
                className="hdr-overlay-nav"
                initial="hidden"
                animate="shown"
                variants={{
                  hidden: {},
                  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
                }}
              >
                {nav.map((item) => (
                  <motion.li
                    key={item.href}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    <a href={item.href} className="hdr-overlay-link" onClick={closeMenu}>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.a
                href={profile.cv}
                target="_blank"
                rel="noopener noreferrer"
                className="hdr-cv hdr-cv--overlay"
                onClick={closeMenu}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.26, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              >
                Download CV
              </motion.a>
            </motion.div>
          ))}
      </AnimatePresence>
    </header>
  );
}
