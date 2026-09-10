import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "motion/react";
import { profile, heroSocials } from "../data/site";
import { Icon } from "./ui/Icon";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./Hero.css";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Resting / hover / tap spotlight radii, in px. */
const SPOT_R_HOVER = 86;
const SPOT_R_TAP = 98;
const SPOT_SPRING = { stiffness: 250, damping: 28 };

type Props = {
  launched: boolean;
};

type NameRevealProps = {
  name: string;
  launched: boolean;
  reduced: boolean;
};

/** Splits the name into characters that rise up from a masked baseline. */
function NameReveal({ name, launched, reduced }: NameRevealProps) {
  const chars = useMemo(() => Array.from(name), [name]);

  return (
    <h1 className="hero-name" aria-label={name}>
      {chars.map((ch, i) => (
        <span className="hero-name__mask" key={i} aria-hidden="true">
          <motion.span
            className="hero-name__char"
            initial={reduced ? false : { y: "100%" }}
            animate={reduced ? { y: "0%" } : launched ? { y: "0%" } : { y: "100%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.6, ease: EASE, delay: launched ? i * 0.03 : 0 }
            }
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

/** Cycles through profile.status, one line at a time, with a soft crossfade. */
function StatusTicker({ reduced }: { reduced: boolean }) {
  const items = profile.status;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [reduced, items.length]);

  const current = items[reduced ? 0 : index];

  return (
    <div className="hero-status">
      <motion.span
        className="hero-status__bullet"
        aria-hidden="true"
        animate={reduced ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
        transition={reduced ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="hero-status__text-wrap">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current}
            className="hero-status__text"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {current}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

/** The landing hero: name, contact, socials, status ticker, lede, and the spotlight-reveal portrait. */
export function Hero({ launched }: Props) {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const helmetRef = useRef<HTMLImageElement>(null);

  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );
  const [tapOpen, setTapOpen] = useState(false);

  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const springX = useSpring(spotX, SPOT_SPRING);
  const springY = useSpring(spotY, SPOT_SPRING);
  const spotR = useMotionValue(0);

  // Detect coarse-pointer devices and keep it live if input mode changes.
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Write the spring values onto the figure's custom properties imperatively,
  // so the beam glides at 60fps without triggering React re-renders.
  useMotionValueEvent(springX, "change", (latest) => {
    figureRef.current?.style.setProperty("--spot-x", `${latest}px`);
  });
  useMotionValueEvent(springY, "change", (latest) => {
    figureRef.current?.style.setProperty("--spot-y", `${latest}px`);
  });
  useMotionValueEvent(spotR, "change", (latest) => {
    figureRef.current?.style.setProperty("--spot-r", `${latest}px`);
  });

  // Fine-pointer / mouse: track the cursor across the whole hero so the beam
  // is already moving as it approaches, but compute coordinates relative to
  // the figure. Radius opens on entering the hero, seals on leaving it.
  useEffect(() => {
    if (reduced || coarse) return;
    const section = sectionRef.current;
    const figure = figureRef.current;
    if (!section || !figure) return;

    const handleMove = (e: MouseEvent) => {
      const rect = figure.getBoundingClientRect();
      spotX.set(e.clientX - rect.left);
      spotY.set(e.clientY - rect.top);
    };
    const handleEnter = () => {
      animate(spotR, SPOT_R_HOVER, { duration: 0.45, ease: EASE });
    };
    const handleLeave = () => {
      animate(spotR, 0, { duration: 0.45, ease: EASE });
    };

    section.addEventListener("mousemove", handleMove);
    section.addEventListener("mouseenter", handleEnter);
    section.addEventListener("mouseleave", handleLeave);
    return () => {
      section.removeEventListener("mousemove", handleMove);
      section.removeEventListener("mouseenter", handleEnter);
      section.removeEventListener("mouseleave", handleLeave);
    };
  }, [reduced, coarse, spotX, spotY, spotR]);

  // Coarse-pointer / keyboard fallback: tap or Enter/Space toggles a fixed
  // reveal centred on the helmet.
  const toggleReveal = () => {
    if (reduced) return;
    const figure = figureRef.current;
    const helmet = helmetRef.current;
    if (!figure || !helmet) return;
    const cx = helmet.offsetLeft + helmet.offsetWidth / 2;
    const cy = helmet.offsetTop + helmet.offsetHeight / 2;
    setTapOpen((open) => {
      const next = !open;
      spotX.jump(cx);
      spotY.jump(cy);
      animate(spotR, next ? SPOT_R_TAP : 0, { duration: 0.45, ease: EASE });
      return next;
    });
  };

  const handleFigureClick = () => {
    if (coarse) toggleReveal();
  };
  const handleFigureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleReveal();
    }
  };

  const fade = (delay: number, y = 30) =>
    reduced
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y },
          animate: launched ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.9, ease: EASE, delay },
        };

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-container container">
        <div className="hero-left">
          <NameReveal name={profile.name} launched={launched} reduced={reduced} />

          <motion.div className="hero-contact" {...fade(0.12)}>
            <p className="hero-contact__meta">
              <span>{profile.location}</span>
              <span aria-hidden="true" className="hero-contact__dot">
                &middot;
              </span>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <span aria-hidden="true" className="hero-contact__dot">
                &middot;
              </span>
              <a href={profile.linkedinHref} target="_blank" rel="noreferrer">
                {profile.linkedinLabel}
              </a>
            </p>
          </motion.div>

          <motion.div className="hero-socials" {...fade(0.2)}>
            {heroSocials.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="hero-socials__link"
              >
                <Icon name={s.id} size={25} />
              </a>
            ))}
          </motion.div>

          <motion.div className="hero-status-block" {...fade(0.26)}>
            <StatusTicker reduced={reduced} />
          </motion.div>

          <motion.p className="hero-lede" {...fade(0.3)}>
            {profile.lede}
          </motion.p>
        </div>

        <motion.figure
          className="hero-portrait"
          ref={figureRef}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          animate={reduced ? { opacity: 1, y: 0 } : launched ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: 0.15 }}
          style={{ "--spot-x": "50%", "--spot-y": "30%", "--spot-r": "0px" } as React.CSSProperties}
          tabIndex={0}
          role="button"
          aria-label="Reveal the face behind the helmet"
          aria-pressed={tapOpen}
          onClick={handleFigureClick}
          onKeyDown={handleFigureKeyDown}
        >
          <img
            src="/assets/portrait.jpg"
            alt="Portrait of Raajvir Vijay standing in a tan blazer"
            className="hero-portrait__img"
          />
          {/*
            The mask lives on this full-figure-sized wrapper (not the small helmet
            image itself) so its coordinate space matches --spot-x/--spot-y, which
            are measured relative to the figure. The <img> inside keeps its original
            size/offset untouched; the wrapper's mask clips it (and anything else in
            the subtree) wherever the spotlight circle is.
          */}
          <div className="hero-portrait__distort" aria-hidden="true">
            <div className="hero-portrait__helmet-wrap">
              <img ref={helmetRef} src="/assets/helmet.png" alt="" className="hero-portrait__helmet" />
            </div>
          </div>
          <div className="hero-portrait__beam" aria-hidden="true" />
        </motion.figure>
      </div>

      {!reduced && (
        <div className="hero-scroll" aria-hidden="true">
          <span className="hero-scroll__label">Scroll</span>
          <span className="hero-scroll__line">
            <motion.span
              className="hero-scroll__seg"
              animate={{ y: [0, 34] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </span>
        </div>
      )}
    </section>
  );
}
